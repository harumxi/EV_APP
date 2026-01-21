<?php
/* BACKEND/API/CHARGING/get_favorites.php */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once __DIR__ . '/../../CORE/Database.php';

$user_id = $_GET['user_id'] ?? 0;

try {
    $db = Database::conn();
    $stmt = $db->prepare("SELECT station_id FROM user_favorites WHERE user_id = ?");
    $stmt->execute([$user_id]);
    echo json_encode(['ok' => true, 'favorites' => $stmt->fetchAll(PDO::FETCH_COLUMN)]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>