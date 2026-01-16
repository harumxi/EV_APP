<?php
// FILE: BACKEND/api/GARAGE/set_active.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once __DIR__ . '/../../CORE/Database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $db = Database::conn();
    
    // Deactivate all
    $db->prepare("UPDATE user_garage SET is_active = 0 WHERE user_id = ?")->execute([$input['user_id']]);
    // Activate target
    $db->prepare("UPDATE user_garage SET is_active = 1 WHERE user_id = ? AND garage_id = ?")->execute([$input['user_id'], $input['garage_id']]);
    
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>