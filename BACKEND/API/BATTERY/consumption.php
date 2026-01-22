<?php
// --- CORS HEADERS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");

require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../../services/BatteryService.php';
$keys = require __DIR__ . '/../../CONFIG/api_keys.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation
    if (!isset($input['distance_km'])) {
        throw new Exception("Missing 'distance_km' parameter.");
    }

    $userId = $input['user_id'] ?? 1; // Default to User 1
    $currentBatt = $input['battery_percent'] ?? 100;

    $db = Database::conn();
    $service = new BatteryService($db, $keys);
    
    // Get Car Info
    $car = $service->getActiveCarSpecs($userId);

    // Calculate
    $result = $service->calculateUsage($input['distance_km'], $car, $currentBatt);

    echo json_encode([
        'ok' => true,
        'car' => $car['name'],
        'result' => $result
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>