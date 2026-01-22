<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$user_id = (int)($input['user_id'] ?? 0);
$garage_id = (int)($input['garage_id'] ?? 0);

if ($user_id <= 0 || $garage_id <= 0) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'Missing user_id or garage_id']);
    exit;
}

try {
    $db = Database::conn();

    $car = $db->prepare("SELECT garage_id, is_active FROM user_garage WHERE garage_id = ? AND user_id = ? LIMIT 1");
    $car->execute([$garage_id, $user_id]);
    $row = $car->fetch();
    if (!$row) { http_response_code(404); echo json_encode(['ok'=>false,'error'=>'Not found']); exit; }

    $wasActive = (int)$row['is_active'] === 1;

    $db->beginTransaction();
    $db->prepare("DELETE FROM user_garage WHERE garage_id = ? AND user_id = ?")->execute([$garage_id, $user_id]);

    if ($wasActive) {
        // pick latest remaining as active
        $next = $db->prepare("SELECT garage_id FROM user_garage WHERE user_id = ? ORDER BY garage_id DESC LIMIT 1");
        $next->execute([$user_id]);
        $n = $next->fetch();
        if ($n) {
            $db->prepare("UPDATE user_garage SET is_active = 1 WHERE garage_id = ?")->execute([(int)$n['garage_id']]);
        }
    }

    $db->commit();
    echo json_encode(['ok'=>true]);
} catch (Throwable $e) {
    if ($db && $db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Server error']);
}
