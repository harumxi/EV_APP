<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Api-Key");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$q = trim($input['search'] ?? '');

if ($q === '') { echo json_encode(['ok'=>true,'results'=>[]]); exit; }

try {
    // --- Call API Ninjas EV endpoint ---
    $base = 'https://api.api-ninjas.com/v1/';
    $apiKey = 'LbrluHCyTzaxVI1CJAtO2LQMnrcfstO5gnjABkWh';

    // API supports: make, model, year (not full-text)
    // We'll treat the input as a loose query:
    // - if input has 2 words: 1st=make, rest=model
    $parts = preg_split('/\s+/', $q);
    $make = $parts[0] ?? '';
    $model = (count($parts) > 1) ? implode(' ', array_slice($parts, 1)) : '';

    $url = $base . "electricvehicle?make=" . urlencode($make);
    if ($model) $url .= "&model=" . urlencode($model);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "X-Api-Key: $apiKey"
        ],
        CURLOPT_TIMEOUT => 10
    ]);

    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$resp || $code >= 400) {
        http_response_code(500);
        echo json_encode(['ok'=>false,'error'=>'API Ninjas error. Check API key or endpoint.']);
        exit;
    }

    $cars = json_decode($resp, true);
    if (!is_array($cars)) $cars = [];

    // Normalize results for frontend
    $results = [];
    foreach ($cars as $c) {
        $results[] = [
            'make' => $c['make'] ?? '',
            'model' => $c['model'] ?? '',
            'variant' => $c['trim'] ?? ($c['variant'] ?? 'Standard'),
            'battery_kwh' => (float)($c['battery_capacity'] ?? ($c['battery_capacity_kwh'] ?? 0)),
            'eff_wh_km' => (float)($c['efficiency_wh_per_km'] ?? 0),
            'drive_mode' => $c['drivetrain'] ?? null,
            'raw' => $c
        ];
    }

    echo json_encode(['ok'=>true,'results'=>$results]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Server error']);
}
