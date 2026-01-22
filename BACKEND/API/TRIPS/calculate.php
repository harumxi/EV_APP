<?php
/* ===========================
   BACKEND/API/TRIPS/calculate.php
   =========================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents("php://input"), true);
$userId = $input['user_id'] ?? 1;
$origin = $input['origin'] ?? '';
$destination = $input['destination'] ?? '';
$batteryPercent = $input['battery_percent'] ?? 100;

if (!$origin || !$destination) {
    echo json_encode(['ok' => false, 'error' => 'Origin and Destination required']);
    exit;
}

try {
    $db = Database::conn();

    // 1. GET CAR SPECS (Active Car)
    $stmt = $db->prepare("
        SELECT v.efficiency_wh_per_km, v.battery_capacity_kwh, v.model_name 
        FROM user_garage g 
        JOIN ev_variants v ON g.variant_id = v.variant_id 
        WHERE g.user_id = ? AND g.is_active = 1 
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $car = $stmt->fetch(PDO::FETCH_ASSOC);

    // Fallback if no car selected
    if (!$car) {
        $car = ['efficiency_wh_per_km' => 160, 'battery_capacity_kwh' => 60, 'model_name' => 'Generic EV'];
    }

    // 2. GEOCODING (Using Nominatim - Free)
    $originCoords = geocode($origin);
    $destCoords = geocode($destination);

    if (!$originCoords || !$destCoords) {
        throw new Exception("Could not find location coordinates. Try a more specific address.");
    }

    // 3. ROUTING (Using OSRM - Free)
    $routeData = fetchOSRMRoute($originCoords, $destCoords);
    
    if (!$routeData) {
        throw new Exception("Could not calculate route path.");
    }

    // 4. CALCULATE ENERGY
    $distanceKm = $routeData['distance'] / 1000;
    $durationMin = $routeData['duration'] / 60;
    
    // Energy (kWh) = (Dist * Wh/km) / 1000
    $energyNeededKwh = ($distanceKm * $car['efficiency_wh_per_km']) / 1000;
    
    // Battery % usage
    $percentUsage = ($energyNeededKwh / $car['battery_capacity_kwh']) * 100;
    
    echo json_encode([
        'ok' => true,
        'car' => $car,
        'destination_label' => $destination,
        'destination_coords' => ['lat' => $destCoords[0], 'lng' => $destCoords[1]],
        'routes' => [
            [
                'geometry' => $routeData['geometry'], // Polyline string
                'distance_km' => round($distanceKm, 1),
                'duration_min' => round($durationMin),
                'est_usage' => round($percentUsage, 1)
            ]
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}

// --- HELPERS ---

function geocode($query) {
    // Check if input is "lat,lng"
    if (preg_match('/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/', $query, $matches)) {
        return [(float)$matches[1], (float)$matches[3]];
    }
    // Use Nominatim
    $url = "https://nominatim.openstreetmap.org/search?format=json&q=" . urlencode($query);
    $opts = ["http" => ["header" => "User-Agent: EVTripPlanner/1.0\r\n"]];
    $context = stream_context_create($opts);
    $resp = @file_get_contents($url, false, $context);
    $data = json_decode($resp, true);
    return !empty($data[0]) ? [(float)$data[0]['lat'], (float)$data[0]['lon']] : null;
}

function fetchOSRMRoute($start, $end) {
    // OSRM expects "lng,lat"
    $startStr = $start[1] . ',' . $start[0];
    $endStr = $end[1] . ',' . $end[0];
    $url = "http://router.project-osrm.org/route/v1/driving/$startStr;$endStr?overview=full";
    $resp = @file_get_contents($url);
    $data = json_decode($resp, true);
    return !empty($data['routes'][0]) ? $data['routes'][0] : null;
}
?>