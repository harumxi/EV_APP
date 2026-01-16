<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['user_id'], $input['garage_id'])) {
    echo json_encode(['ok' => false, 'error' => 'Missing ID']);
    exit;
}

try {
    $db = Database::conn();
    // Only delete if it belongs to the user
    $q = $db->prepare("DELETE FROM user_garage WHERE garage_id = ? AND user_id = ?");
    $q->execute([$input['garage_id'], $input['user_id']]);

    echo json_encode(['ok' => true, 'message' => 'Car removed']);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>