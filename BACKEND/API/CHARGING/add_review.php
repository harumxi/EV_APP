<?php
/* BACKEND/API/CHARGING/add_review.php */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents("php://input"), true);
$user_id = $input['user_id'] ?? 0;
$station_id = $input['station_id'] ?? '';
$rating = (int)($input['rating'] ?? 0);
$comment = trim($input['comment'] ?? '');

if (!$user_id || !$station_id || $rating < 1 || $rating > 5) {
    echo json_encode(['ok' => false, 'error' => 'Invalid data or rating (1-5)']);
    exit;
}

try {
    $db = Database::conn();
    $stmt = $db->prepare("INSERT INTO station_reviews (user_id, station_id, rating, comment) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user_id, $station_id, $rating, $comment]);
    
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>