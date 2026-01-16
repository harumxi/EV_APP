<?php
ini_set('display_errors', 0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    require_once __DIR__ . '/../../CORE/Database.php';
    require_once __DIR__ . '/../../services/RouteService.php';
    require_once __DIR__ . '/../../services/BatteryService.php';

    $keys = require __DIR__ . '/../../CONFIG/api_keys.php';
    $input = json_decode(file_get_contents('php://input'), true);
    
    $db = Database::conn();
    $routeService = new RouteService($keys);
    $batteryService = new BatteryService($db, $keys);

    // 1. Resolve Origin
    $originData = $routeService->getCoordinates($input['origin']);
    if (!$originData) throw new Exception("Origin not found. Please check spelling.");

    // 2. Resolve Destination (with Bias & Sanity Check)
    $destData = $routeService->getCoordinates(
        $input['destination'], 
        $originData['lat'], 
        $originData['lng']
    );

    if (!$destData) {
        throw new Exception("Destination ambiguous or not found. Try adding 'Quezon City' or check spelling.");
    }

    // 3. Get Routes
    $routes = $routeService->getRouteOptions($originData, $destData);
    if (!$routes) throw new Exception("No drivable route found.");

    // 4. Calculate Battery
    $carSpecs = $batteryService->getActiveCarSpecs($input['user_id'] ?? 1);
    
    $processedRoutes = [];
    foreach ($routes as $route) {
        $tripCalc = $batteryService->calculateUsage($route['distance_km'], $carSpecs, $input['battery_percent']);
        
        $processedRoutes[] = [
            'id' => $route['id'],
            'distance_km' => round($route['distance_km'], 1),
            'duration_min' => $route['duration_min'],
            'est_usage' => $tripCalc['est_usage'],
            'end_battery' => $tripCalc['end_battery'],
            'feasible' => $tripCalc['feasible'],
            'geometry' => $route['geometry']
        ];
    }

    usort($processedRoutes, function($a, $b) { return $a['est_usage'] <=> $b['est_usage']; });
    $processedRoutes[0]['recommended'] = true;

    echo json_encode([
        'ok' => true,
        'car' => $carSpecs['name'],
        'routes' => $processedRoutes,
        
        // STABLE KEYS FOR FRONTEND
        'origin_label' => $originData['label'],
        'destination_label' => $destData['label'], // FIXED: Use this key in JS
        'destination_coords' => ['lat' => $destData['lat'], 'lng' => $destData['lng']]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>