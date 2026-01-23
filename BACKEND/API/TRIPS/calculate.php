<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../../CORE/Database.php';

// Load API Keys
$apiKeys = require __DIR__ . '/../../CONFIG/api_keys.php';
$orsKey = $apiKeys['ors']['api_key'];

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$userId = $input['user_id'] ?? 0;
$origin = $input['origin'] ?? null;
$dest = $input['destination'] ?? null;
$battery = $input['battery_percent'] ?? 100;

if (!$userId || !$origin || !$dest) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing parameters']);
    exit;
}

try {
    $db = Database::conn();

    // 1. Get Active Car
    $stmt = $db->prepare("
        SELECT v.make, v.model, v.battery_capacity_kwh, v.efficiency_wh_per_km 
        FROM user_garage ug 
        JOIN ev_variants v ON ug.variant_id = v.variant_id 
        WHERE ug.user_id = ? AND ug.is_active = 1 
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $car = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$car) {
        // Default car if none active
        $car = ['make' => 'Generic', 'model' => 'EV', 'battery_capacity_kwh' => 60, 'efficiency_wh_per_km' => 160];
    }

    // 2. Calculate Route (Using OpenRouteService)
    $lat1 = $origin['lat']; $lon1 = $origin['lng'];
    $lat2 = $dest['lat']; $lon2 = $dest['lng'];
    
    $url = "https://api.openrouteservice.org/v2/directions/driving-car/json";
    
    $postData = [
        'coordinates' => [[$lon1, $lat1], [$lon2, $lat2]],
        'alternative_routes' => [
            'target_count' => 3,
            'weight_factor' => 2.0, // Increased to find more diverse routes (up to 2x longer)
            'share_factor' => 0.5   // Decreased to allow less overlap (50%)
        ],
        'units' => 'km',
        'geometry' => 'true'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: ' . $orsKey
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Fix for local SSL issues
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $resp = curl_exec($ch);
    
    if (curl_errno($ch)) {
        throw new Exception("Routing Service Error: " . curl_error($ch));
    }
    curl_close($ch);
    
    $data = json_decode($resp, true);
    
    if (isset($data['error'])) {
        $errMsg = is_array($data['error']) ? ($data['error']['message'] ?? json_encode($data['error'])) : $data['error'];
        throw new Exception("ORS Error: " . $errMsg);
    }
    
    if (!isset($data['routes']) || empty($data['routes'])) {
        throw new Exception("No route found between these locations.");
    }
    
    $routesOutput = [];
    foreach ($data['routes'] as $route) {
        $summary = $route['summary'];
        $distKm = $summary['distance'];
        $durationMin = round($summary['duration'] / 60);
        
        // 3. Calculate Battery Usage
        // Efficiency is Wh/km. Total Wh = dist * eff.
        $consumedWh = $distKm * $car['efficiency_wh_per_km'];
        $consumedKwh = $consumedWh / 1000;
        $percentDrain = ($consumedKwh / $car['battery_capacity_kwh']) * 100;
        
        $endBattery = round($battery - $percentDrain);

        $routesOutput[] = [
            'geometry' => $route['geometry'],
            'distance_km' => round($distKm, 1),
            'duration_min' => $durationMin,
            'est_usage' => round($percentDrain, 1),
            'end_battery' => $endBattery
        ];
    }

    echo json_encode([
        'ok' => true,
        'car' => $car,
        'destination_label' => 'Selected Destination',
        'routes' => $routesOutput
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>