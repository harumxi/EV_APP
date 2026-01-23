<?php
/* BACKEND/API/AUTH/verify_registration.php */
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/AuthHelper.php';

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$userId = $input['user_id'] ?? 0;
$otp = trim($input['otp'] ?? ''); // Clean input

if (empty($userId) || empty($otp)) {
    echo json_encode(['ok' => false, 'error' => 'Missing User ID or OTP']);
    exit;
}

try {
    $db = Database::conn();
    
    // 1. Verify OTP using AuthHelper
    $result = AuthHelper::verifyOTP($db, $userId, 'register', $otp);
    
    if (!$result['ok']) {
        // This is where your "Verification Error" comes from
        http_response_code(400);
        echo json_encode([
            'ok' => false, 
            'error' => $result['error'] ?? 'Invalid or expired code.'
        ]);
        exit;
    }

    // 2. Mark User Verified
    $stmt = $db->prepare("UPDATE users SET is_verified = 1 WHERE id = ?");
    $stmt->execute([$userId]);

    // 3. AUTOMATIC LOGIN
    $stmt = $db->prepare("SELECT id, username, name, email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("User not found after verification.");
    }

    // Generate Session Token
    $sessionToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $sessionToken);
    $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Insert session into auth_sessions table
    $stmt = $db->prepare("INSERT INTO auth_sessions (user_id, session_token_hash, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $tokenHash, $expires]);

    echo json_encode([
        'ok' => true, 
        'message' => 'Account verified! Logging you in...',
        'token' => $sessionToken,
        'user' => $user
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>