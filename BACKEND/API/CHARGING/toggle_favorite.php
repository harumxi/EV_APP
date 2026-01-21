<?php
/* BACKEND/API/CHARGING/toggle_favorite.php */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents("php://input"), true);
$user_id = $input['user_id'] ?? 0;
$station_id = $input['station_id'] ?? '';
$name = $input['name'] ?? '';
$address = $input['address'] ?? '';

if (!$user_id || !$station_id) {
    echo json_encode(['ok' => false, 'error' => 'Missing data']);
    exit;
}

try {
    $db = Database::conn();
    
    // Check if exists
    $stmt = $db->prepare("SELECT fav_id FROM user_favorites WHERE user_id = ? AND station_id = ?");
    $stmt->execute([$user_id, $station_id]);
    
    if ($stmt->fetch()) {
        $db->prepare("DELETE FROM user_favorites WHERE user_id = ? AND station_id = ?")->execute([$user_id, $station_id]);
        echo json_encode(['ok' => true, 'status' => 'removed']);
    } else {
        $db->prepare("INSERT INTO user_favorites (user_id, station_id, station_name, address) VALUES (?, ?, ?, ?)")->execute([$user_id, $station_id, $name, $address]);
        echo json_encode(['ok' => true, 'status' => 'added']);
    }
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>