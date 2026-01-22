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
        b.brand_name,
        m.model_name,
        v.variant_name,
        v.battery_capacity_kwh,
        v.efficiency_wh_per_km
      FROM ev_variants v
      JOIN ev_models m ON m.model_id = v.model_id
      JOIN ev_brands b ON b.brand_id = m.brand_id
      WHERE b.brand_name LIKE ?
         OR m.model_name LIKE ?
         OR v.variant_name LIKE ?
      ORDER BY b.brand_name, m.model_name, v.variant_name
      LIMIT 25
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([$like, $like, $like]);
    $results = $stmt->fetchAll();

    echo json_encode(['ok'=>true, 'results'=>$results]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Server error']);
}
