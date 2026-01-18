<?php
// 1. ALLOW ACCESS (CORS Headers)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// 2. Handle "Preflight" Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. Get Query
$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (strlen($q) < 3) {
    echo json_encode(['ok' => true, 'results' => []]);
    exit;
}

// 4. SMART PRE-PROCESSING
$qClean = strtolower($q);
$abbreviations = [
    '/\bsjdm\b/' => 'san jose del monte',
    '/\bqc\b/'   => 'quezon city',
    '/\bbgc\b/'  => 'bonifacio global city',
    '/\bpque\b/' => 'paranaque',
    '/\bmmla\b/' => 'metro manila',
    '/\bncr\b/'  => 'metro manila'
];
$qExpanded = preg_replace(array_keys($abbreviations), array_values($abbreviations), $qClean);

// 5. SEARCH ENGINE (Photon by Komoot)
// BBOX format: min_lon,min_lat,max_lon,max_lat (Covers Philippines)
$bbox = "116.8,4.5,126.7,21.2"; 

$url = "https://photon.komoot.io/api/?" . http_build_query([
    'q'     => $qExpanded,
    'limit' => 15,
    'lat'   => 14.5995, // Bias center (Manila)
    'lon'   => 120.9842,
    'bbox'  => $bbox,
    'lang'  => 'en'
]);

// 6. Fetch Data safely
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_USERAGENT, "EvTripPlanner/1.0"); 
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$features = $data['features'] ?? [];

// 7. FORMAT RESULTS
$finalResults = [];

foreach ($features as $f) {
    $p = $f['properties'];
    $g = $f['geometry'];

    $addressParts = [
        $p['name'] ?? '',
        $p['street'] ?? '',
        $p['district'] ?? '',
        $p['suburb'] ?? '',
        $p['city'] ?? $p['town'] ?? $p['municipality'] ?? '',
        $p['county'] ?? '', 
        $p['state'] ?? ''
    ];

    $cleanParts = array_values(array_unique(array_filter($addressParts)));
    $fullLabel = implode(', ', $cleanParts);

    if (empty($fullLabel)) continue;

    $finalResults[] = [
        'display_name' => $fullLabel,
        'name'         => $p['name'] ?? $cleanParts[0],
        'lat'          => $g['coordinates'][1],
        'lon'          => $g['coordinates'][0],
    ];
}

echo json_encode([
    'ok' => true, 
    'query_used' => $qExpanded, 
    'results' => $finalResults
]);
?>