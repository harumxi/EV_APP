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
$variant_id = (int)($input['variant_id'] ?? 0);
$nickname = trim($input['nickname'] ?? '');

if ($user_id <= 0 || $variant_id <= 0) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'Missing user_id or variant_id']);
    exit;
}

try {
    $db = Database::conn();

    // Make sure variant exists
    $v = $db->prepare("SELECT variant_id FROM ev_variants WHERE variant_id = ? LIMIT 1");
    $v->execute([$variant_id]);
    if (!$v->fetch()) {
        http_response_code(404);
        echo json_encode(['ok'=>false,'error'=>'Variant not found']);
        exit;
    }

    // Check if user already has this variant (optional)
    $dup = $db->prepare("SELECT garage_id FROM user_garage WHERE user_id = ? AND variant_id = ? LIMIT 1");
    $dup->execute([$user_id, $variant_id]);
    if ($dup->fetch()) {
        http_response_code(409);
        echo json_encode(['ok'=>false,'error'=>'Vehicle already in your garage']);
        exit;
    }

    // If first car, set active = 1
    $check = $db->prepare("SELECT COUNT(*) FROM user_garage WHERE user_id = ?");
    $check->execute([$user_id]);
    $count = (int)$check->fetchColumn();
    $is_active = ($count === 0) ? 1 : 0;

    $stmt = $db->prepare("INSERT INTO user_garage (user_id, variant_id, nickname, is_active) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user_id, $variant_id, $nickname ?: null, $is_active]);

    echo json_encode(['ok'=>true, 'garage_id'=>(int)$db->lastInsertId(), 'is_active'=>$is_active]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Server error']);
}
