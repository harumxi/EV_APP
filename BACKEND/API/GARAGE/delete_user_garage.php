<?php
/* BACKEND/API/GARAGE/delete_user_garage.php */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents("php://input"), true);
$garage_id = $input['garage_id'] ?? 0;

try {
    $db = Database::conn();
    $stmt = $db->prepare("DELETE FROM user_garage WHERE garage_id = ?");
    $stmt->execute([$garage_id]);
    
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>
