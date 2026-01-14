<?php
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../../CORE/Response.php';
require_once __DIR__ . '/../../CORE/HttpClient.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Only POST method allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['user_id'], $input['origin'], $input['destination'])) {
    Response::error('Required: user_id, origin[lat/lng], destination[lat/lng]', 400);
}

try {
    $db = Database::conn();
    $cfg = require __DIR__ . '/../../CONFIG/maps.php';

    // 1. Check for Active EV
    $check = $db->prepare("SELECT garage_id FROM user_garage WHERE user_id = ? AND is_active = 1 LIMIT 1");
    $check->execute([(int)$input['user_id']]);
    if (!$check->fetch()) {
        Response::error('User has no active EV selected', 400);
    }

    // 2. Fetch Distance from OpenRouteService
    $url = $cfg['ors']['base_url'] . '/v2/directions/' . $cfg['ors']['default_profile'] . '/geojson';
    $body = [
        "coordinates" => [
            [(float)$input['origin']['lng'], (float)$input['origin']['lat']], 
            [(float)$input['destination']['lng'], (float)$input['destination']['lat']]
        ]
    ];

    $data = HttpClient::postJson($url, $body, ['Authorization: ' . $cfg['ors']['api_key']]);

    // 3. Log Trip and Return Results
    if (isset($data['features'][0]['properties']['summary'])) {
        $summary = $data['features'][0]['properties']['summary'];
        Response::ok([
            'distance_km' => round($summary['distance'] / 1000, 2),
            'duration_min' => round($summary['duration'] / 60)
        ]);
    } else {
        Response::error('Could not calculate route', 500);
    }
} catch (Throwable $e) {
    Response::error($e->getMessage(), 500);
}