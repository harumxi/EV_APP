<?php
// DISABLE DEBUGGING OUTPUT SO WE ONLY GET CLEAN JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// START OUTPUT BUFFERING
ob_start();

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';

function jsonErrorHandler($errno, $errstr, $errfile, $errline) {
    if (ob_get_length()) ob_clean();
    echo json_encode(['ok' => false, 'error' => "PHP Error: $errstr"]);
    exit;
}
set_error_handler("jsonErrorHandler");

try {
    // 1. Config
    $configFile = __DIR__ . '/../../CONFIG/maps.php';
    if (!file_exists($configFile)) throw new Exception("Config file missing");
    $mapsCfg = require $configFile;

    // 2. Input
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['user_id'], $input['origin'], $input['destination'])) {
        throw new Exception("Missing required fields");
    }

    $db = Database::conn();

    // 3. Active Car Check
    $ev = $db->prepare("SELECT garage_id FROM user_garage WHERE user_id = ? AND is_active = 1 LIMIT 1");
    $ev->execute([(int)$input['user_id']]);
    if (!$ev->fetch()) throw new Exception("No active EV found. Check garage.");

    // 4. CALL MAP API
    $url = "https://api.openrouteservice.org/v2/directions/driving-car";
    
    $body = json_encode([
        "coordinates" => [
            [(float)$input['origin']['lng'], (float)$input['origin']['lat']], 
            [(float)$input['destination']['lng'], (float)$input['destination']['lat']]
        ],
        "units" => "km"
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: ' . $mapsCfg['ors']['api_key']
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $mapData = json_decode($response, true);
    ob_end_clean(); // Clear buffer

    // 5. PARSE RESPONSE (Updated for your specific JSON format)
    if ($httpCode === 200 && isset($mapData['routes'][0])) {
        $route = $mapData['routes'][0];
        $summary = $route['summary'];
        
        echo json_encode([
            'ok' => true,
            'message' => 'Trip calculated successfully',
            'data' => [
                'distance_km' => $summary['distance'], // 14.61 km
                'duration_min' => round($summary['duration'] / 60, 1), // ~24.8 min
                'encoded_polyline' => $route['geometry'] // "anbxAivlaVQ..." (This draws the map line)
            ]
        ]);
    } else {
        echo json_encode([
            'ok' => false, 
            'error' => 'Map Provider Error',
            'details' => $mapData['error'] ?? 'Unknown error from ORS'
        ]);
    }

} catch (Exception $e) {
    if (ob_get_length()) ob_clean();
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>