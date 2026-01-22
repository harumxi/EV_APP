<?php
/* BACKEND/API/GARAGE/get_user_garage.php */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../../CORE/Database.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

try {
    $db = Database::conn();
    
    // Fetch user's garage cars joined with vehicle details
    $stmt = $db->prepare("
        SELECT g.garage_id, g.variant_id, g.is_active, 
               v.make as brand, v.model, v.year,
               v.battery_capacity_kwh as battery_kwh, 
               v.efficiency_wh_per_km as efficiency_whkm,
               CAST((v.battery_capacity_kwh * 1000 / v.efficiency_wh_per_km) AS UNSIGNED) as range_km,
               v.image_url as image, v.plug_type
        FROM user_garage g
        JOIN ev_variants v ON g.variant_id = v.variant_id
        WHERE g.user_id = ?
        ORDER BY g.garage_id DESC
    ");
    $stmt->execute([$user_id]);
    $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['ok' => true, 'data' => $cars]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>