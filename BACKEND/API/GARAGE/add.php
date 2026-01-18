<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../../../CORE/Database.php';
$db = Database::conn();

$input = json_decode(file_get_contents('php://input'), true);

try {
    // Check if Variant Exists
    $stmt = $db->prepare("SELECT variant_id FROM ev_variants WHERE make=? AND model=? AND variant=? LIMIT 1");
    $stmt->execute([$input['make'], $input['model'], $input['variant']]);
    $v = $stmt->fetch();

    if (!$v) {
        $stmt = $db->prepare("INSERT INTO ev_variants (make, model, variant, battery_capacity_kwh, efficiency_wh_per_km) VALUES (?,?,?,?,?)");
        $stmt->execute([$input['make'], $input['model'], $input['variant'], $input['battery_kwh'], $input['eff_wh_km']]);
        $vid = $db->lastInsertId();
    } else {
        $vid = $v['variant_id'];
    }

    // Add to Garage
    $stmt = $db->prepare("INSERT INTO user_garage (user_id, variant_id, nickname, is_active) VALUES (?, ?, ?, 0)");
    $stmt->execute([$input['user_id'], $vid, $input['nickname']]);

    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>