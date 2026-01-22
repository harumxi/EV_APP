<?php
/* BACKEND/API/CHARGING/get_reviews.php */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once __DIR__ . '/../../CORE/Database.php';

$station_id = $_GET['station_id'] ?? '';

try {
    $db = Database::conn();
    $stmt = $db->prepare("
        SELECT r.rating, r.comment, r.created_at, u.username 
        FROM station_reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.station_id = ?
        ORDER BY r.created_at DESC
    ");
    $stmt->execute([$station_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $avg = 0;
    if (count($reviews) > 0) {
        $avg = round(array_sum(array_column($reviews, 'rating')) / count($reviews), 1);
    }

    echo json_encode(['ok' => true, 'reviews' => $reviews, 'average' => $avg]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>