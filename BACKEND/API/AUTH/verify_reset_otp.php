<?php
/* BACKEND/API/AUTH/verify_reset_otp.php */
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/AuthHelper.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($input['email'] ?? '');
$otp = $input['otp'] ?? '';

try {
    $db = Database::conn();
    
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['ok' => false, 'error' => 'Invalid request']);
        exit;
    }

    $result = AuthHelper::verifyOTP($db, $user['id'], 'reset_password', $otp);
    
    if ($result['ok']) {
        // Generate a temporary reset token
        $resetToken = bin2hex(random_bytes(16));
        $expires = date('Y-m-d H:i:s', strtotime('+5 minutes'));
        $tokenHash = password_hash($resetToken, PASSWORD_DEFAULT);
        $now = date('Y-m-d H:i:s');
        
        // Store as a special OTP entry
        $stmt = $db->prepare("INSERT INTO auth_otps (user_id, purpose, otp_hash, expires_at, created_at) VALUES (?, 'reset_token', ?, ?, ?)");
        $stmt->execute([$user['id'], $tokenHash, $expires, $now]);

        echo json_encode(['ok' => true, 'reset_token' => $resetToken]);
    } else {
        echo json_encode($result);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>