<?php
// 1. Force CORS & JSON Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // 2. SMART PATH FINDER (Database Loader)
    $possiblePaths = [
        __DIR__ . '/../../../CORE/Database.php',
        __DIR__ . '/../../../core/Database.php',
        __DIR__ . '/../../CORE/Database.php',
        __DIR__ . '/../../core/Database.php'
    ];

    $dbPath = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $dbPath = $path;
            break;
        }
    }

    if (!$dbPath) throw new Exception("Database.php not found.");
    require_once $dbPath;
    $db = Database::conn();
    
    // 3. Get Input
    $input = json_decode(file_get_contents('php://input'), true);

    // 4. Get Active Car
    $stmt = $db->prepare("SELECT g.nickname, v.battery_capacity_kwh, v.efficiency_wh_per_km 
                         FROM user_garage g
                         JOIN ev_variants v ON g.variant_id = v.variant_id
                         WHERE g.user_id = ? AND g.is_active = 1 LIMIT 1");
    $stmt->execute([$input['user_id'] ?? 1]);
    $car = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$car) {
        $car = ['nickname' => 'Default EV', 'battery_capacity_kwh' => 60, 'efficiency_wh_per_km' => 160];
    }

    // 5. FETCH "SMART" ROUTES (Alternatives Enabled)
    $lat1 = $input['origin']['lat']; $lon1 = $input['origin']['lng'];
    $lat2 = $input['destination']['lat']; $lon2 = $input['destination']['lng'];

    // Added "&alternatives=true" to get multiple options
    $osrmUrl = "http://router.project-osrm.org/route/v1/driving/$lon1,$lat1;$lon2,$lat2?overview=full&geometries=polyline&alternatives=true";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $osrmUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $osrmRaw = curl_exec($ch);
    curl_close($ch);
    
    $osrmData = json_decode($osrmRaw, true);
    $finalRoutes = [];

    // 6. Process ALL Routes (Not just the first one)
    if (!empty($osrmData['routes'])) {
        foreach ($osrmData['routes'] as $index => $route) {
            $distance_km = $route['distance'] / 1000;
            
            // Battery Math
            $efficiency = $car['efficiency_wh_per_km'];
            $capacity_wh = $car['battery_capacity_kwh'] * 1000;
            $energy_needed_wh = $distance_km * $efficiency;
            $percent_usage = ($energy_needed_wh / $capacity_wh) * 100;
            
            $start_battery = $input['battery_percent'] ?? 80;
            $end_battery = $start_battery - $percent_usage;

            $finalRoutes[] = [
                'distance_km' => round($distance_km, 1),
                'duration_min' => round($route['duration'] / 60),
                'est_usage' => round($percent_usage, 1),
                'end_battery' => round($end_battery, 1),
                'recommended' => ($index === 0), // First route is usually fastest
                'feasible' => ($end_battery > 5),
                'geometry' => $route['geometry']
            ];
        }
    } else {
        // Fallback Mock Route if OSRM fails
        $finalRoutes[] = [
            'distance_km' => 10, 'duration_min' => 15, 'est_usage' => 5, 
            'end_battery' => 75, 'recommended' => true, 'feasible' => true,
            'geometry' => '_p~iF~ps|U_ulLnnqC_mqNvxq`@'
        ];
    }

    echo json_encode([
        'ok' => true,
        'car' => $car['nickname'],
        'routes' => $finalRoutes
    ]);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>