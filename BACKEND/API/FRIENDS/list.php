<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../../CORE/Database.php';

$userId = $_GET['user_id'] ?? 0;
if(!$userId) { echo json_encode(['ok'=>false]); exit; }

try {
    $db = Database::conn();

    // 1. Accepted Friends (Bidirectional)
    $sqlFriends = "
        SELECT u.id, u.name, u.username 
        FROM friendships f
        JOIN users u ON (u.id = f.requester_id OR u.id = f.receiver_id)
        WHERE (f.requester_id = ? OR f.receiver_id = ?) 
        AND f.status = 'accepted' AND u.id != ?";

    $stmt = $db->prepare($sqlFriends);
    $stmt->execute([$userId, $userId, $userId]);
    $friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Pending Requests (Incoming Only)
    $sqlReq = "
        SELECT f.id as friendship_id, u.name, u.username 
        FROM friendships f
        JOIN users u ON u.id = f.requester_id
        WHERE f.receiver_id = ? AND f.status = 'pending'";

    $stmt2 = $db->prepare($sqlReq);
    $stmt2->execute([$userId]);
    $requests = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['ok'=>true, 'friends'=>$friends, 'requests'=>$requests]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error listing friends.']);
}