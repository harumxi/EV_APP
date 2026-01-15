<?php
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../../CORE/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

try {
    $db = Database::conn();
    $mapsCfg = require __DIR__ . '/../../CONFIG/maps.php';

    // Verify Active EV (Required First Step) [cite: 3]
    $ev = $db->prepare("SELECT garage_id FROM user_garage WHERE user_id = ? AND is_active = 1 LIMIT 1");
    $ev->execute([(int)$input['user_id']]);
    if (!$ev->fetch()) {
        Response::error('Please select an Active EV in your Garage.', 400);
    }

    // Call OpenRouteService
    $url = "https://api.openrouteservice.org/v2/directions/driving-car";
    $body = json_encode([
        "coordinates" => [
            [$input['origin']['lng'], $input['origin']['lat']], 
            [$input['destination']['lng'], $input['destination']['lat']]
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

    $res = json_decode(curl_exec($ch), true);
    ($ch);

    if (isset($res['features'][0]['properties']['summary'])) {
        $data = $res['features'][0]['properties']['summary'];
        Response::ok([
            'distance_km' => $data['distance'],
            'duration_mins' => round($data['duration'] / 60)
        ]);
    } else {
        Response::error('Route not found', 404);
    }
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}