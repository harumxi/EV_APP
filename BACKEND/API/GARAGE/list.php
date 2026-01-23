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

if ($user_id <= 0) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Missing user_id']); exit; }

try {
    $db = Database::conn();

    $sql = "
      SELECT 
        ug.garage_id,
        ug.nickname,
        ug.is_active,
        v.variant_id,
        v.year as variant_name,
        v.battery_capacity_kwh,
        v.efficiency_wh_per_km,
        v.model as model_name,
        v.make as brand_name
      FROM user_garage ug
      JOIN ev_variants v ON v.variant_id = ug.variant_id
      WHERE ug.user_id = ?
      ORDER BY ug.is_active DESC, ug.garage_id DESC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([$user_id]);
    $cars = $stmt->fetchAll();

    echo json_encode(['ok'=>true, 'cars'=>$cars]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false, 'error'=>'Server error']);
}
