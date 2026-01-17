<?php
// --- 1. ALLOW CONNECTION FROM FRONTEND (CORS Fix) ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle "Preflight" Check (Browser safety check)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- 2. YOUR ORIGINAL LOGIC ---
header("Content-Type: application/json");

// Ensure this path is correct for your project structure
require_once __DIR__ . '/../../services/WeatherService.php';

try {
    // Get input (lat/lng)
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['lat']) || !isset($input['lng'])) {
        throw new Exception("Missing coordinates");
    }

    $service = new WeatherService();
    $weather = $service->getWeather($input['lat'], $input['lng']);
    
    echo json_encode([
        'ok' => true,
        'weather' => $weather
    ]);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>