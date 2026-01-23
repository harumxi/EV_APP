<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../../CORE/Database.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($user_id <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Invalid User ID']);
    exit;
}

try {
    $db = Database::conn();
    
    // Fix: Use 'make' and 'model' columns from ev_variants
    // We alias 'make' to 'brand' to match what garage.html expects
    $sql = "
        SELECT 
            ug.garage_id,
            ug.nickname,
            ug.is_active,
            v.make AS brand,
            v.model,
            v.year,
            v.battery_capacity_kwh AS battery_kwh,
            v.efficiency_wh_per_km AS efficiency_whkm,
            v.image_url AS image,
            v.plug_type
        FROM user_garage ug
        JOIN ev_variants v ON ug.variant_id = v.variant_id
        WHERE ug.user_id = ?
        ORDER BY ug.is_active DESC, ug.garage_id DESC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([$user_id]);
    $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate range if missing (Required for frontend display)
    foreach ($cars as &$car) {
        $batt = (float)$car['battery_kwh'];
        $eff = (int)$car['efficiency_whkm'];
        
        if ($eff > 0) {
            $car['range_km'] = ($batt * 1000) / $eff;
        } else {
            $car['range_km'] = 0;
        }
        
        $car['real_world_range_km'] = $car['range_km'] * 0.85;
    }

    echo json_encode(['ok' => true, 'data' => $cars]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>