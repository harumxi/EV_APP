<?php
/* BACKEND/API/AUTH/forgot_password.php */
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

try {
    $db = Database::conn();
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if (AuthHelper::canSendOTP($db, $user['id'], 'reset_password')) {
            $otp = AuthHelper::generateOTP();
            AuthHelper::storeOTP($db, $user['id'], 'reset_password', $otp);
            
            // Send Email (This might block slightly, but it's acceptable for Forgot Password flow)
            if (!AuthHelper::sendEmail($email, "Reset Password", "Your reset code is: $otp")) {
                http_response_code(500);
                echo json_encode(['ok' => false, 'error' => 'Failed to send email. Check server logs.']);
                exit;
            }
        }
    }

    // Always return success to prevent email enumeration
    echo json_encode(['ok' => true, 'message' => 'If that email exists, we sent a code.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error']);
}
?>