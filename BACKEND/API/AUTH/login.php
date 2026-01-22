<?php
/* ===========================
   BACKEND/API/AUTH/login.php
   =========================== */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email and password are required']);
    exit;
}

try {
    $db = Database::conn();
    
    // Fetch user
    $stmt = $db->prepare("SELECT id, username, name, email, password_hash, is_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify Password
    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(['ok' => false, 'error' => 'Invalid email or password']);
        exit;
    }

    // Check Verification
    if ($user['is_verified'] == 0) {
        // Return specific flag for frontend to trigger OTP flow
        echo json_encode([
            'ok' => false,
            'require_verification' => true,
            'user_id' => $user['id'],
            'email' => $user['email'],
            'error' => 'Account not verified'
        ]);
        exit;
    }

    // Success
    unset($user['password_hash']); // Security: Remove hash
    
    echo json_encode(['ok' => true, 'user' => $user]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database connection error']);
}
?>