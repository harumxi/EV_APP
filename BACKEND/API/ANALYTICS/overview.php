<?php
/* ===========================
   BACKEND/API/ANALYTICS/overview.php
   Dashboard Overview Data
   =========================== */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();

    // 1. Active Users (verified users with activity in last 30 days)
    $stmt = $db->prepare("
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        WHERE u.is_verified = 1
        AND (
            u.id IN (SELECT DISTINCT user_id FROM trip_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY))
            OR u.id IN (SELECT DISTINCT user_id FROM battery_logs WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY))
            OR u.id IN (SELECT DISTINCT user_id FROM auth_sessions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY))
        )
    ");
    $stmt->execute();
    $active_users = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 2. Inactive Users (verified users with NO activity in last 30 days)
    $stmt = $db->prepare("
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        WHERE u.is_verified = 1
        AND u.id NOT IN (
            SELECT DISTINCT user_id FROM trip_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            UNION
            SELECT DISTINCT user_id FROM battery_logs WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            UNION
            SELECT DISTINCT user_id FROM auth_sessions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
    ");
    $stmt->execute();
    $inactive_users = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 3. Unverified Users (not yet verified)
    $stmt = $db->prepare("
        SELECT COUNT(id) as count
        FROM users
        WHERE is_verified = 0
    ");
    $stmt->execute();
    $unverified_users = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 4. Monthly Active Users (last 12 months from trip_logs)
    $stmt = $db->prepare("
        SELECT 
            DATE_FORMAT(tl.created_at, '%b %Y') as month,
            COUNT(DISTINCT tl.user_id) as users
        FROM trip_logs tl
        WHERE tl.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY YEAR(tl.created_at), MONTH(tl.created_at)
        ORDER BY YEAR(tl.created_at), MONTH(tl.created_at) ASC
    ");
    $stmt->execute();
    $monthly_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Total Energy Used (kWh from trip logs - all time)
    $stmt = $db->prepare("
        SELECT COALESCE(SUM(battery_drained), 0) as energy_used
        FROM trip_logs
    ");
    $stmt->execute();
    $total_energy = (float)$stmt->fetch(PDO::FETCH_ASSOC)['energy_used'];

    // 6. CO2 Saved (1 kWh EV = ~0.5 kg CO2 saved vs gasoline)
    $co2_saved = $total_energy * 0.5;

    // 7. Average Energy Efficiency (km per kWh, displayed as percentage)
    // Efficiency = (distance_km / battery_drained) * 100 / max_possible_km_per_kwh
    // Most EVs do 5-7 km per kWh, so we use 7 as baseline for 100%
    $stmt = $db->prepare("
        SELECT 
            COALESCE(AVG(distance_km / NULLIF(battery_drained, 0)), 0) as avg_km_per_kwh
        FROM trip_logs
        WHERE battery_drained > 0 AND distance_km > 0
    ");
    $stmt->execute();
    $avg_km_per_kwh = (float)$stmt->fetch(PDO::FETCH_ASSOC)['avg_km_per_kwh'];
    
    // Convert to efficiency percentage (7 km/kWh = 100%, baseline for good EV)
    $avg_efficiency = min(100, ($avg_km_per_kwh / 7) * 100);
    $avg_efficiency = max(0, $avg_efficiency);

    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'data' => [
            'active_users' => $active_users,
            'inactive_users' => $inactive_users,
            'unverified_users' => $unverified_users,
            'total_energy_kwh' => round($total_energy, 2),
            'co2_saved_kg' => round($co2_saved, 2),
            'avg_energy_efficiency' => round($avg_efficiency, 1),
            'monthly_users' => $monthly_users
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to fetch overview data',
        'message' => $e->getMessage()
    ]);
}
?>
