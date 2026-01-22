<?php
/* ===========================
   BACKEND/API/SOS/invite.php
   =========================== */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../AUTH/AuthHelper.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$userId = $input['user_id'] ?? null;
$email = $input['email'] ?? null;
$userName = $input['user_name'] ?? 'A friend';

if (!$userId || !$email) {
    echo json_encode(['ok' => false, 'error' => 'Missing data']);
    exit;
}

$subject = "Emergency Contact Invitation - EnerGo";
$body = "Hello,\n\n$userName has added you as their Emergency Contact on EnerGo.\n\nYou will be notified via email if they trigger an SOS alert from their dashboard.\n\nStay safe,\nEnerGo Team";

// Use the existing AuthHelper to send the email
$sent = AuthHelper::sendEmail($email, $subject, $body);

echo json_encode(['ok' => $sent]);
?>