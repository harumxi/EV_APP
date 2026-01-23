<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$q = trim($input['search'] ?? '');

if ($q === '') { echo json_encode(['ok'=>true,'results'=>[]]); exit; }

try {
    $db = Database::conn();

    $like = '%' . $q . '%';

    $sql = "
      SELECT
        v.variant_id,
        v.make as brand_name,
        v.model as model_name,
        v.year as variant_name,
        v.battery_capacity_kwh,
        v.efficiency_wh_per_km
      FROM ev_variants v
      WHERE v.make LIKE ?
         OR v.model LIKE ?
      ORDER BY v.make, v.model
      LIMIT 25
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([$like, $like]);
    $results = $stmt->fetchAll();

    echo json_encode(['ok'=>true, 'results'=>$results]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Server error']);
}
