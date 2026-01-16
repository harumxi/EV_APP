<?php
// FILE: BACKEND/api/GARAGE/list.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once __DIR__ . '/../../CORE/Database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? 1;

    $db = Database::conn();
    $q = $db->prepare("
        SELECT g.garage_id, c.naming_make, c.naming_model, g.is_active 
        FROM user_garage g
        JOIN cars c ON g.car_id = c.car_id
        WHERE g.user_id = ?
        ORDER BY g.is_active DESC
    ");
    $q->execute([$userId]);
    echo json_encode(['ok' => true, 'cars' => $q->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>