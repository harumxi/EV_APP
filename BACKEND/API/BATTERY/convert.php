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

    $userId = $input['user_id'] ?? 1;
    $value = $input['value'] ?? 0; // The number to convert
    $type = $input['type'] ?? 'percent_to_km'; // 'percent_to_km' OR 'km_to_percent'

    $db = Database::conn();
    $service = new BatteryService($db, $keys);
    $car = $service->getActiveCarSpecs($userId);

    // Car Efficiency (km per kWh) * Battery Size (kWh) = Max Range
    $maxRangeKm = $car['efficiency'] * $car['battery_capacity']; 

    $result = 0;
    $label = "";

    if ($type === 'percent_to_km') {
        // Convert 80% -> 240km
        $result = ($value / 100) * $maxRangeKm;
        $label = "Estimated Range";
        $unit = "km";
    } elseif ($type === 'km_to_percent') {
        // Convert 50km -> 12%
        $result = ($value / $maxRangeKm) * 100;
        $label = "Battery Required";
        $unit = "%";
    } else {
        throw new Exception("Invalid conversion type");
    }

    echo json_encode([
        'ok' => true,
        'car' => $car['name'],
        'input' => $value,
        'output' => round($result, 1),
        'unit' => $unit,
        'label' => $label
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>