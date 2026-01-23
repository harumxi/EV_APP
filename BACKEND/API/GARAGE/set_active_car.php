<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents('php://input'), true);
$user_id = $input['user_id'] ?? 0;
$garage_id = $input['garage_id'] ?? 0;

try {
    $db = Database::conn();
    $db->beginTransaction();

    // Deactivate all cars for this user
    $db->prepare("UPDATE user_garage SET is_active = 0 WHERE user_id = ?")->execute([$user_id]);
    
    // Activate the selected car
    $db->prepare("UPDATE user_garage SET is_active = 1 WHERE user_id = ? AND garage_id = ?")->execute([$user_id, $garage_id]);

    $db->commit();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    $db->rollBack();
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>