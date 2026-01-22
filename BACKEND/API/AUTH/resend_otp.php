<?php
/* BACKEND/API/AUTH/resend_otp.php */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/AuthHelper.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$userId = $input['user_id'] ?? 0;
$purpose = $input['purpose'] ?? 'register';

if (!$userId) {
    echo json_encode(['ok' => false, 'error' => 'Missing user ID']);
    exit;
}

try {
    $db = Database::conn();
    
    // Get Email
    $stmt = $db->prepare("SELECT email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $email = $stmt->fetchColumn();

    if ($email) {
        if (AuthHelper::canSendOTP($db, $userId, $purpose)) {
            $otp = AuthHelper::generateOTP();
            AuthHelper::storeOTP($db, $userId, $purpose, $otp);
            AuthHelper::sendEmail($email, "Verification Code", "Your code is: $otp");
            echo json_encode(['ok' => true]);
        } else {
            echo json_encode(['ok' => false, 'error' => 'Please wait before resending.']);
        }
    } else {
        echo json_encode(['ok' => false, 'error' => 'User not found']);
    }
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => 'Server error']);
}
?>