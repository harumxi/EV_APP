<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents('php://input'), true);
$friendshipId = $input['friendship_id'];

try {
    $db = Database::conn();
    $stmt = $db->prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?");
    $stmt->execute([$friendshipId]);
    echo json_encode(['ok'=>true]);
} catch(Throwable $e) { echo json_encode(['ok'=>false, 'error'=>$e->getMessage()]); }
?>