<?php
/* ===========================
   BACKEND/API/AUTH/resend_otp.php
   =========================== */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/AuthHelper.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$userId = $input['user_id'] ?? 0;
$purpose = $input['purpose'] ?? 'register'; // Default to register, but respects input

if (!$userId) {
    echo json_encode(['ok' => false, 'error' => 'Missing user ID']);
    exit;
}

try {
    $db = Database::conn();
    
    // 1. Get User Email
    $stmt = $db->prepare("SELECT email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) { echo json_encode(['ok' => false, 'error' => 'User not found']); exit; }

    // 2. Check Rate Limit (Spec: 60 seconds)
    if (!AuthHelper::canSendOTP($db, $userId, $purpose)) {
        echo json_encode(['ok' => false, 'error' => 'Please wait 60 seconds before resending.']);
        exit;
    }

    // 3. Generate & Send New OTP
    $otp = AuthHelper::generateOTP();
    AuthHelper::storeOTP($db, $userId, $purpose, $otp);
    
    if (!AuthHelper::sendEmail($user['email'], "Energo Account Verification Code", "Your Energo verification code is: $otp")) {
        echo json_encode(['ok' => false, 'error' => 'Failed to send email. Check server logs.']);
        exit;
    }

    echo json_encode(['ok' => true, 'message' => 'New code sent!']);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>