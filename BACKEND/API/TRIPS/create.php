<?php
// 1. Dependencies - Match your CORE folder naming exactly
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../../CORE/Response.php';

// 2. Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Only POST method allowed', 405);
}

// 3. Read and Validate JSON Input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    Response::error('Invalid JSON body', 400);
}

// Check for required fields for the Trip Planner UI Flow
if (
    !isset($input['user_id']) ||
    !isset($input['origin']['lat']) || !isset($input['origin']['lng']) ||
    !isset($input['destination']['lat']) || !isset($input['destination']['lng'])
) {
    Response::error('Required: user_id, origin[lat,lng], destination[lat,lng]', 400);
}

// 4. Sanitize Inputs
$userId   = (int)$input['user_id'];
$origLat  = (float)$input['origin']['lat'];
$origLng  = (float)$input['origin']['lng'];
$destLat  = (float)$input['destination']['lat'];
$destLng  = (float)$input['destination']['lng'];

try {
    $db = Database::conn();

    // 5. WORKFLOW STEP: Ensure user has an Active EV (Required First Step)
    // This is critical to get the vehicle specs needed for forecasting later.
    $evCheck = $db->prepare("SELECT garage_id FROM user_garage WHERE user_id = ? AND is_active = 1 LIMIT 1");
    $evCheck->execute([$userId]);
    if (!$evCheck->fetch()) {
        Response::error('Required First Step: No active EV selected in your Garage.', 400);
    }

    // 6. MAPS API INTEGRATION: Fetch Route Data from OpenRouteService
    // Note: ORS expects [longitude, latitude] format[cite: 5].
    $apiKey = 'YOUR_ORS_API_KEY'; 
    $url = "https://api.openrouteservice.org/v2/directions/driving-car";

    $body = json_encode([
        "coordinates" => [[$origLng, $origLat], [$destLng, $destLat]],
        "units" => "km"
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: ' . $apiKey
    ]);

    $apiResponse = curl_exec($ch);
    $routeData = json_decode($apiResponse, true);
    curl_close($ch);

    // Validate API Response
    if (!isset($routeData['features'][0]['properties']['summary'])) {
        Response::error('OpenRouteService Error: Could not calculate route.', 500);
    }

    $summary = $routeData['features'][0]['properties']['summary'];
    $distance = $summary['distance']; // in km
    $duration = round($summary['duration'] / 60); // convert seconds to minutes

    // 7. RETURN DATA: Send results back for the Battery Forecasting Engine
    // Since reporting is removed, we do not need to save this to a 'trips' table 
    // unless you want to keep a history of past trips for the user profile.
    Response::ok([
        'message' => 'Route calculated successfully',
        'distance_km' => $distance,
        'duration_mins' => $duration
    ]);

} catch (Exception $e) {
    Response::error('Server Error: ' . $e->getMessage(), 500);
}