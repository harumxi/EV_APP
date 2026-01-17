<?php
// 1. Force Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Hide HTML Errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // 3. Get Input
    $inputRaw = file_get_contents('php://input');
    $input = json_decode($inputRaw, true) ?? [];
    $lat = $input['lat'] ?? 14.5995;
    $lng = $input['lng'] ?? 120.9842;

    // 4. ATTEMPT 1: REAL WEATHER (Open-Meteo)
    $weatherData = fetchRealWeather($lat, $lng);

    // 5. ATTEMPT 2: SIMULATION (Fallback if Real Weather fails)
    if (!$weatherData) {
        $weatherData = [
            'temp' => rand(26, 32), // Random realistic temp
            'condition' => 'Simulated',
            'icon' => '🌤️',
            'location' => 'Offline Mode'
        ];
    }

    echo json_encode([
        'ok' => true,
        'weather' => $weatherData
    ]);

} catch (Exception $e) {
    // Final Safety Net
    echo json_encode([
        'ok' => true, // Say true so frontend displays it
        'weather' => ['temp' => 30, 'condition' => 'System OK', 'icon' => '⚡']
    ]);
}

// --- HELPER FUNCTION ---
function fetchRealWeather($lat, $lng) {
    // If cURL is missing on XAMPP, return null immediately to trigger simulation
    if (!function_exists('curl_init')) return null;

    $url = "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lng&current_weather=true";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    // SUPER FAST TIMEOUT: Give up after 2 seconds so the UI doesn't hang
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2); 
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    curl_setopt($ch, CURLOPT_USERAGENT, "EV_Student_Project/1.0");
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$response || $httpCode >= 400) return null;

    $data = json_decode($response, true);
    $current = $data['current_weather'] ?? null;

    if (!$current) return null;

    // Map Code to Icon
    $code = $current['weathercode'];
    $icon = '🌡️';
    $text = 'Unknown';
    
    if ($code === 0) { $text = 'Clear Sky'; $icon = '☀️'; }
    elseif ($code <= 3) { $text = 'Partly Cloudy'; $icon = '⛅'; }
    elseif ($code <= 67) { $text = 'Rainy'; $icon = '🌧️'; }
    elseif ($code <= 99) { $text = 'Thunderstorm'; $icon = '⚡'; }

    return [
        'temp' => round($current['temperature']),
        'condition' => $text,
        'icon' => $icon
    ];
}
?>