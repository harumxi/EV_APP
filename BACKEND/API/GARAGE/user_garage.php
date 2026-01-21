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
$nickname = trim($input['nickname'] ?? '');

// Car Details - Map 'brand' from frontend to 'make' for database
$make = trim($input['brand'] ?? $input['make'] ?? '');
$model = trim($input['model'] ?? '');
$year = (int)($input['year'] ?? date('Y'));
$battery = (float)($input['battery_kwh'] ?? 0);
$efficiency = (int)($input['efficiency_whkm'] ?? 160);
$image = trim($input['image'] ?? '');
$plug = trim($input['plug_type'] ?? 'Type 2');

if ($user_id <= 0 || empty($make) || empty($model)) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'Missing user_id, brand, or model']);
    exit;
}

try {
    $db = Database::conn();

    // 1. Find or Create Variant (Using 'make' column)
    $stmt = $db->prepare("SELECT variant_id FROM ev_variants WHERE make = ? AND model = ? AND year = ? LIMIT 1");
    $stmt->execute([$make, $model, $year]);
    $variant = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($variant) {
        $variant_id = $variant['variant_id'];
    } else {
        // Insert new variant
        $stmt = $db->prepare("INSERT INTO ev_variants (make, model, year, battery_capacity_kwh, efficiency_wh_per_km, image_url, plug_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$make, $model, $year, $battery, $efficiency, $image, $plug]);
        $variant_id = $db->lastInsertId();
    }

    // 2. Check if user already has this car
    $dup = $db->prepare("SELECT garage_id FROM user_garage WHERE user_id = ? AND variant_id = ? LIMIT 1");
    $dup->execute([$user_id, $variant_id]);
    if ($dup->fetch()) {
        http_response_code(409);
        echo json_encode(['ok'=>false,'error'=>'Vehicle already in your garage']);
        exit;
    }

    // 3. Add to Garage (Set active if first car)
    $check = $db->prepare("SELECT COUNT(*) FROM user_garage WHERE user_id = ?");
    $check->execute([$user_id]);
    $count = (int)$check->fetchColumn();
    $is_active = ($count === 0) ? 1 : 0;

    $stmt = $db->prepare("INSERT INTO user_garage (user_id, variant_id, nickname, is_active) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user_id, $variant_id, $nickname ?: null, $is_active]);

    echo json_encode(['ok'=>true, 'garage_id'=>(int)$db->lastInsertId(), 'is_active'=>$is_active]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Server error: ' . $e->getMessage()]);
}
