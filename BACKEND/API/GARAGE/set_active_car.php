<?php
/* BACKEND/API/GARAGE/set_active_car.php */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents("php://input"), true);
$user_id = $input['user_id'] ?? 0;
$garage_id = $input['garage_id'] ?? 0;

try {
    $db = Database::conn();
    $db->beginTransaction();
    
    // 1. Deactivate all cars for this user
    $stmt = $db->prepare("UPDATE user_garage SET is_active = 0 WHERE user_id = ?");
    $stmt->execute([$user_id]);

    // 2. Activate the selected car
    $stmt = $db->prepare("UPDATE user_garage SET is_active = 1 WHERE garage_id = ? AND user_id = ?");
    $stmt->execute([$garage_id, $user_id]);
    
    $db->commit();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    $db->rollBack();
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>
