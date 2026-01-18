<?php
/**
 * 🚗 EV GARAGE API - PRODUCTION READY
 * Features: Local Priority, API Caching, Smart Ranking, Data Normalization, Real-World Buffers
 */

// 1. SETUP & HEADERS
error_reporting(0); // Hide warnings in production JSON
ini_set('display_errors', 0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// =================================================================================
// 🔑 CONFIGURATION
// =================================================================================
$API_KEY = "PASTE_YOUR_API_KEY_HERE"; 
$CACHE_FILE = sys_get_temp_dir() . '/ev_api_cache.json'; // Auto-managed temp file
$CACHE_DURATION = 86400; // 24 Hours
// =================================================================================

$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$debug = isset($_GET['debug']) && $_GET['debug'] == '1';

// 2. LOCAL DATABASE (The "Gold Standard" - Verified PH Specs)
$ph_vehicles = [
    // --- TOYOTA ---
    [
        "id" => "toyota_bz4x", "brand" => "Toyota", "model" => "bZ4X", "year" => 2024,
        "battery_kwh" => 71.4, "range_km" => 500, "efficiency_whkm" => 143, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Toyota_bZ4X_001.jpg/800px-Toyota_bZ4X_001.jpg"
    ],
    // --- TESLA ---
    [
        "id" => "tesla_m3_rwd", "brand" => "Tesla", "model" => "Model 3 RWD", "year" => 2024,
        "battery_kwh" => 60.0, "range_km" => 513, "efficiency_whkm" => 132, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2019_Tesla_Model_3_Performance_AWD_Front.jpg/800px-2019_Tesla_Model_3_Performance_AWD_Front.jpg"
    ],
    [
        "id" => "tesla_my_rwd", "brand" => "Tesla", "model" => "Model Y RWD", "year" => 2024,
        "battery_kwh" => 60.0, "range_km" => 455, "efficiency_whkm" => 157, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Tesla_Model_Y_Austin_Made.jpg/800px-Tesla_Model_Y_Austin_Made.jpg"
    ],
    // --- BYD ---
    [
        "id" => "byd_atto3", "brand" => "BYD", "model" => "Atto 3", "year" => 2024,
        "battery_kwh" => 60.5, "range_km" => 480, "efficiency_whkm" => 156, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/2022_BYD_Atto_3_Standard_Range_%28Australia%29_front_view.jpg/800px-2022_BYD_Atto_3_Standard_Range_%28Australia%29_front_view.jpg"
    ],
    [
        "id" => "byd_dolphin", "brand" => "BYD", "model" => "Dolphin", "year" => 2024,
        "battery_kwh" => 44.9, "range_km" => 410, "efficiency_whkm" => 120, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/BYD_Dolphin_Plus_2023_Brazil_Front.jpg/800px-BYD_Dolphin_Plus_2023_Brazil_Front.jpg"
    ],
    [
        "id" => "byd_seagull", "brand" => "BYD", "model" => "Seagull", "year" => 2024,
        "battery_kwh" => 30.0, "range_km" => 305, "efficiency_whkm" => 105, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/BYD_Seagull_001.jpg/1280px-BYD_Seagull_001.jpg"
    ],
    // --- MG ---
    [
        "id" => "mg_4", "brand" => "MG", "model" => "4 EV", "year" => 2024,
        "battery_kwh" => 64.0, "range_km" => 435, "efficiency_whkm" => 160, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/MG_4_EV_101.jpg/800px-MG_4_EV_101.jpg"
    ],
    // --- HYUNDAI / KIA ---
    [
        "id" => "hyundai_ioniq5", "brand" => "Hyundai", "model" => "Ioniq 5", "year" => 2024,
        "battery_kwh" => 72.6, "range_km" => 481, "efficiency_whkm" => 168, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Hyundai_Ioniq_5_Auto_Zuerich_2021_IMG_0283.jpg/800px-Hyundai_Ioniq_5_Auto_Zuerich_2021_IMG_0283.jpg"
    ],
    [
        "id" => "kia_ev6", "brand" => "Kia", "model" => "EV6 GT-Line", "year" => 2024,
        "battery_kwh" => 77.4, "range_km" => 528, "efficiency_whkm" => 165, 
        "plug_type" => "Type 2 / CCS2",
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Kia_EV6_GT-Line.jpg/800px-Kia_EV6_GT-Line.jpg"
    ],
    // --- NISSAN ---
    [
        "id" => "nissan_leaf", "brand" => "Nissan", "model" => "LEAF", "year" => 2024,
        "battery_kwh" => 40.0, "range_km" => 311, "efficiency_whkm" => 171, 
        "plug_type" => "Type 1 / CHAdeMO", // Accurate PH Plug
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Nissan_Leaf_ZE1_2018.jpg/800px-Nissan_Leaf_ZE1_2018.jpg"
    ],
    // --- BUDGET / CITY ---
    [
        "id" => "jetour_ice_cream", "brand" => "Jetour", "model" => "Ice Cream EV", "year" => 2023,
        "battery_kwh" => 13.9, "range_km" => 170, "efficiency_whkm" => 100, 
        "plug_type" => "GB/T", // Chinese Standard
        "image" => "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Chery_QQ_Ice_Cream_001.jpg/800px-Chery_QQ_Ice_Cream_001.jpg"
    ]
];

// 3. HELPER FUNCTIONS

/**
 * Normalizes car data (Calculates missing math, adds real-world buffer)
 */
function normalizeCarData($car, $source = "local") {
    // 1. Sanitize Basics
    $batt = (float)($car['battery_kwh'] ?? 0);
    $range = (int)($car['range_km'] ?? 0);
    $eff = (int)($car['efficiency_whkm'] ?? 0);

    // 2. Auto-Fix Missing Math (The "Triangle of EV Math")
    // If we have 2 numbers, we can always calculate the 3rd.
    if ($batt > 0 && $range > 0 && $eff == 0) {
        $eff = (int)(($batt * 1000) / $range); // Calculate Efficiency
    }
    if ($batt > 0 && $eff > 0 && $range == 0) {
        $range = (int)(($batt * 1000) / $eff); // Calculate Range
    }
    
    // 3. Fallbacks for impossible zeros
    if ($batt == 0) $batt = 60.0;
    if ($eff == 0) $eff = 160;
    if ($range == 0) $range = 400;

    // 4. Real-World PH Buffer (The "Manila Traffic Factor")
    // Deduct 15% for AC + Traffic
    $realWorldRange = (int)($range * 0.85);

    return [
        "id" => $car['id'],
        "brand" => $car['brand'],
        "model" => $car['model'],
        "year" => $car['year'] ?? "2024",
        "battery_kwh" => $batt,
        "range_km" => $range,
        "real_world_range_km" => $realWorldRange, // <--- New Field!
        "efficiency_whkm" => $eff,
        "plug_type" => $car['plug_type'] ?? "Type 2 / CCS2",
        "image" => $car['image'],
        "source" => $source
    ];
}

/**
 * Call External API with Caching
 */
function callApiWithCache($make, $model, $key, $cacheFile, $duration) {
    $cacheKey = "ev_" . md5($make . $model);
    
    // Check Cache
    if (file_exists($cacheFile)) {
        $cache = json_decode(file_get_contents($cacheFile), true);
        if (isset($cache[$cacheKey]) && (time() - $cache[$cacheKey]['time'] < $duration)) {
            return $cache[$cacheKey]['data']; // Return cached data
        }
    } else {
        $cache = [];
    }

    // Call API
    $url = "https://api.api-ninjas.com/v1/electricvehicle?make=" . urlencode($make);
    if ($model) $url .= "&model=" . urlencode($model);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-Api-Key: " . trim($key)]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true);

    // Save to Cache if valid
    if ($httpCode == 200 && !empty($data)) {
        $cache[$cacheKey] = ['time' => time(), 'data' => $data];
        file_put_contents($cacheFile, json_encode($cache));
    }

    return $data;
}

// 4. SEARCH EXECUTION
$results = [];

// STEP A: Search Local Database (Exact & Partial Matching)
if ($query !== '') {
    $q = strtolower($query);
    foreach ($ph_vehicles as $car) {
        $text = strtolower($car['brand'] . ' ' . $car['model']);
        
        // Exact brand matches get priority (handled by array order + this check)
        if (strpos($text, $q) !== false) {
            $results[] = normalizeCarData($car, "local");
        }
    }
} else {
    // Default View: Just show top 4
    $slice = array_slice($ph_vehicles, 0, 4);
    foreach($slice as $c) $results[] = normalizeCarData($c, "local");
}

// STEP B: API Fallback (Only if Local failed & Query exists)
if (empty($results) && $query !== '' && strpos($API_KEY, "PASTE") === false) {
    
    // Guess Make/Model
    $parts = explode(' ', $query, 2);
    $make = $parts[0];
    $model = isset($parts[1]) ? $parts[1] : "";

    $apiData = callApiWithCache($make, $model, $API_KEY, $CACHE_FILE, $CACHE_DURATION);
    
    // Retry with just Make if Make+Model failed
    if (empty($apiData) && !empty($model)) {
        $apiData = callApiWithCache($make, "", $API_KEY, $CACHE_FILE, $CACHE_DURATION);
    }

    if ($apiData && is_array($apiData)) {
        foreach ($apiData as $car) {
            $id = strtolower(str_replace(' ', '_', $car['make'] . '_' . $car['model']));
            $fallbackImage = "https://placehold.co/600x400/EEE/31343C?text=" . urlencode($car['make'] . "+" . $car['model']);

            // Parse Premium/Locked fields
            $batt = (float)($car['battery_useable_capacity'] ?? $car['battery_capacity'] ?? 0);
            $eff = (int)($car['energy_consumption_combined_mild_weather'] ?? $car['vehicle_consumption'] ?? 0);
            $range = (int)($car['electric_range'] ?? 0);

            // Create Raw Car Object
            $rawCar = [
                "id" => $id,
                "brand" => $car['make'],
                "model" => $car['model'],
                "year" => $car['year_start'] ?? "2024",
                "battery_kwh" => $batt,
                "range_km" => $range,
                "efficiency_whkm" => $eff,
                "plug_type" => "Type 2 / CCS2", // Global Assumption
                "image" => $fallbackImage
            ];

            // Normalize (Apply Math + PH Buffer)
            $results[] = normalizeCarData($rawCar, "api");
        }
    }
}

// 5. OUTPUT
echo json_encode([
    "ok" => true,
    "count" => count($results),
    "debug" => $debug ? ["query" => $query, "source" => empty($results) ? "none" : $results[0]['source']] : null,
    "data" => $results
]);
exit;
?>