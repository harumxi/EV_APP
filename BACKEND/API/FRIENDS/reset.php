<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    $db->exec("TRUNCATE TABLE friendships");
    echo json_encode(['ok' => true, 'message' => 'All friend requests and connections have been reset.']);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>