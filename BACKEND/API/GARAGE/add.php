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

$make = trim($input['make'] ?? '');
$model = trim($input['model'] ?? '');
$variant = trim($input['variant'] ?? 'Standard');
$nickname = trim($input['nickname'] ?? '');

$battery_kwh = (float)($input['battery_kwh'] ?? 0);
$eff_wh_km = (float)($input['eff_wh_km'] ?? 0);
$drive_mode = trim($input['drive_mode'] ?? '');

if ($user_id <= 0 || !$make || !$model) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'Missing required fields (user_id/make/model)']);
    exit;
}

// Fallbacks if API doesn't provide
if ($battery_kwh <= 0) $battery_kwh = 60;
if ($eff_wh_km <= 0) $eff_wh_km = 170;

try {
    $db = Database::conn();
    $db->beginTransaction();

    // 1) brand
    $stmt = $db->prepare("SELECT brand_id FROM ev_brands WHERE brand_name=? LIMIT 1");
    $stmt->execute([$make]);
    $brand = $stmt->fetch();
    if (!$brand) {
        $ins = $db->prepare("INSERT INTO ev_brands (brand_name) VALUES (?)");
        $ins->execute([$make]);
        $brand_id = (int)$db->lastInsertId();
    } else {
        $brand_id = (int)$brand['brand_id'];
    }

    // 2) model
    $stmt = $db->prepare("SELECT model_id FROM ev_models WHERE brand_id=? AND model_name=? LIMIT 1");
    $stmt->execute([$brand_id, $model]);
    $m = $stmt->fetch();
    if (!$m) {
        $ins = $db->prepare("INSERT INTO ev_models (brand_id, model_name) VALUES (?, ?)");
        $ins->execute([$brand_id, $model]);
        $model_id = (int)$db->lastInsertId();
    } else {
        $model_id = (int)$m['model_id'];
    }

    // 3) variant
    $stmt = $db->prepare("SELECT variant_id FROM ev_variants WHERE model_id=? AND variant_name=? LIMIT 1");
    $stmt->execute([$model_id, $variant]);
    $v = $stmt->fetch();

    if (!$v) {
        $ins = $db->prepare("INSERT INTO ev_variants (model_id, variant_name, battery_capacity_kwh, efficiency_wh_per_km, drive_mode)
                             VALUES (?, ?, ?, ?, ?)");
        $ins->execute([$model_id, $variant, $battery_kwh, $eff_wh_km, $drive_mode ?: null]);
        $variant_id = (int)$db->lastInsertId();
    } else {
        $variant_id = (int)$v['variant_id'];
    }

    // 4) prevent duplicates in user_garage
    $dup = $db->prepare("SELECT garage_id FROM user_garage WHERE user_id=? AND variant_id=? LIMIT 1");
    $dup->execute([$user_id, $variant_id]);
    if ($dup->fetch()) {
        $db->rollBack();
        http_response_code(409);
        echo json_encode(['ok'=>false,'error'=>'Already in your garage']);
        exit;
    }

    // 5) set active if first car
    $cnt = $db->prepare("SELECT COUNT(*) FROM user_garage WHERE user_id=?");
    $cnt->execute([$user_id]);
    $count = (int)$cnt->fetchColumn();
    $is_active = ($count === 0) ? 1 : 0;

    $ins = $db->prepare("INSERT INTO user_garage (user_id, variant_id, nickname, is_active) VALUES (?, ?, ?, ?)");
    $ins->execute([$user_id, $variant_id, $nickname ?: null, $is_active]);

    $db->commit();

    echo json_encode([
        'ok'=>true,
        'garage_id'=>(int)$db->lastInsertId(),
        'variant_id'=>$variant_id,
        'is_active'=>$is_active
    ]);

} catch (Throwable $e) {
    if ($db && $db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Server error']);
}
