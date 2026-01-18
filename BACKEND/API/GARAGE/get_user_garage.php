<?php
// 1. Force Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // 2. Connect
    $possiblePaths = [
        __DIR__ . '/../../../CORE/Database.php',
        __DIR__ . '/../../CORE/Database.php'
    ];
    $dbPath = null;
    foreach ($possiblePaths as $path) { if (file_exists($path)) { $dbPath = $path; break; } }
    if (!$dbPath) throw new Exception("Database.php not found");
    require_once $dbPath;
    $db = Database::conn();

    // 3. Get User ID
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) throw new Exception("Missing user_id");

    // 4. THE FIX: LEFT JOIN & COALESCE
    // This query says: "Select EVERYTHING from user_garage where user_id matches."
    // "Then try to find details in ev_variants. If missing, use defaults."
    $sql = "SELECT 
                g.garage_id, 
                g.nickname, 
                g.is_active, 
                COALESCE(v.brand_name, v.make, 'Unknown Brand') AS brand, 
                COALESCE(v.model_name, v.model, 'Unknown Model') AS model, 
                COALESCE(v.variant_name, v.variant, 'Standard') AS variant, 
                COALESCE(v.battery_capacity_kwh, 0) AS battery_capacity_kwh, 
                COALESCE(v.efficiency_wh_per_km, 150) AS efficiency_wh_per_km 
            FROM user_garage g
            LEFT JOIN ev_variants v ON g.variant_id = v.variant_id
            WHERE g.user_id = ?
            ORDER BY g.is_active DESC, g.garage_id DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute([$userId]);
    $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['ok' => true, 'garage' => $cars]);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>