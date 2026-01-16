<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$keyPath = __DIR__ . '/../../CONFIG/api_keys.php';
if (!file_exists($keyPath)) exit(json_encode([]));
$keys = require $keyPath;

$input = json_decode(file_get_contents('php://input'), true);
$query = $input['search'] ?? '';

if (!$query) exit(json_encode([]));

$apiKey = $keys['api_ninjas']['api_key'];
$baseUrl = $keys['api_ninjas']['base_url'];

// STRATEGY 1: Search as "Make" (e.g., "BYD", "Tesla")
$urlMake = $baseUrl . "?make=" . urlencode($query);
$ch1 = curl_init($urlMake);
curl_setopt($ch1, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch1, CURLOPT_HTTPHEADER, ["X-Api-Key: " . $apiKey]);
$resMake = json_decode(curl_exec($ch1), true);
curl_close($ch1);

// STRATEGY 2: Search as "Model" (e.g., "Han", "Civic")
$urlModel = $baseUrl . "?model=" . urlencode($query);
$ch2 = curl_init($urlModel);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, ["X-Api-Key: " . $apiKey]);
$resModel = json_decode(curl_exec($ch2), true);
curl_close($ch2);

// Merge results (remove duplicates)
$allCars = array_merge($resMake ?? [], $resModel ?? []);
$uniqueCars = [];
$seen = [];

foreach ($allCars as $car) {
    // Create a unique ID to prevent duplicates (e.g. "BYD|Tang|2023")
    $id = $car['make'] . '|' . $car['model'] . '|' . ($car['year'] ?? '0');
    if (!in_array($id, $seen)) {
        $seen[] = $id;
        $uniqueCars[] = $car;
    }
}

echo json_encode($uniqueCars);
?>