<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../AUTH/AuthHelper.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$userId = $input['user_id'] ?? 0;
$lat = $input['lat'] ?? 0;
$lng = $input['lng'] ?? 0;

if (!$userId || !$lat || !$lng) {
    echo json_encode(['ok' => false, 'error' => 'Missing location data']);
    exit;
}

try {
    $db = Database::conn();
    
    // 1. Get User Details
    $stmt = $db->prepare("SELECT name FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $userName = $stmt->fetchColumn() ?: "Unknown User";

    // 2. Get Emergency Contacts (Array)
    $emails = $input['contact_emails'] ?? [];
    // Backward compatibility for single email
    if (!empty($input['contact_email'])) {
        $emails[] = $input['contact_email'];
    }
    $emails = array_unique(array_filter($emails));

    if (empty($emails)) {
        echo json_encode(['ok' => false, 'error' => 'No emergency contacts found.']);
        exit;
    }

    // 3. Send Alert
    $mapsLink = "https://www.google.com/maps?q={$lat},{$lng}";
    $subject = "🚨 SOS ALERT: $userName needs help!";
    $message = "URGENT: $userName has triggered an SOS alert.\n\nCurrent Location: $mapsLink\n\nPlease check on them immediately.";

    $sentCount = 0;
    foreach ($emails as $email) {
        if (AuthHelper::sendEmail($email, $subject, $message)) {
            $sentCount++;
        }
    }

    // Log the event
    error_log("🚨 SOS Triggered by User ID: $userId ($userName) to " . implode(', ', $emails));

    echo json_encode(['ok' => $sentCount > 0, 'message' => "Alert sent to $sentCount contacts."]);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>