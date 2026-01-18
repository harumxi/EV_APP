<?php
// 1. SILENCE & HEADERS
ini_set('display_errors', 0);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// --- CONFIGURATION ---
$API_KEY = "b81965b3-ac20-4da1-af40-4b450c802e3e"; // Your Key
$lat = isset($_GET['lat']) ? $_GET['lat'] : 14.5995;
$lng = isset($_GET['lon']) ? $_GET['lon'] : 120.9842;
$radius = 50; // Search radius in KM (increased for better results)
$limit = 20;  // Max stations to show

$finalStations = [];

// ========================================================
// STRATEGY A: FETCH FROM OPEN CHARGE MAP API (REAL DATA)
// ========================================================
$apiUrl = "https://api.openchargemap.io/v3/poi/?output=json&latitude=$lat&longitude=$lng&distance=$radius&maxresults=$limit&compact=true&verbose=false&key=$API_KEY";

// Use CURL to fetch data
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Fix for local XAMPP SSL issues
$response = curl_exec($ch);
curl_close($ch);

$apiData = json_decode($response, true);

if ($apiData && is_array($apiData)) {
    foreach ($apiData as $station) {
        // Map API format to YOUR App's format
        $addr = $station['AddressInfo'] ?? [];
        $usage = $station['UsageType'] ?? [];
        $status = $station['StatusType'] ?? [];
        $op = $station['OperatorInfo'] ?? [];

        $finalStations[] = [
            "id" => "OCM_" . ($station['ID'] ?? uniqid()),
            "name" => $addr['Title'] ?? "Unknown Station",
            "operator" => $op['Title'] ?? "Unknown Operator",
            "status" => $status['Title'] ?? "Unknown",
            // Determine if free or paid based on API data
            "usage_cost" => ($usage['Title'] ?? "Unknown"), 
            "is_free" => (stripos($usage['Title'] ?? '', 'Free') !== false) ? 1 : 0,
            "address" => [
                "address_line_1" => $addr['AddressLine1'] ?? "",
                "town" => $addr['Town'] ?? ""
            ],
            "location" => [
                "latitude" => (float)($addr['Latitude'] ?? 0),
                "longitude" => (float)($addr['Longitude'] ?? 0)
            ],
            "distance_km" => calculateDistance($lat, $lng, $addr['Latitude'] ?? 0, $addr['Longitude'] ?? 0)
        ];
    }
}

// ========================================================
// STRATEGY B: FALLBACK TO LOCAL DATABASE (IF API FAILS)
// ========================================================
if (empty($finalStations)) {
    $conn = new mysqli("localhost", "root", "", "ev_app_db");
    
    if (!$conn->connect_error) {
        $sql = "SELECT * FROM charging_stations"; // Simple fetch all for demo
        $result = $conn->query($sql);
        
        if ($result) {
            while($row = $result->fetch_assoc()) {
                $dist = calculateDistance($lat, $lng, $row['lat'], $row['lng']);
                // Only show if within radius
                if($dist <= $radius) {
                    $finalStations[] = [
                        "id" => $row['station_id'],
                        "name" => $row['station_name'],
                        "operator" => $row['operator_name'],
                        "status" => "Operational",
                        "usage_cost" => ($row['is_free'] == 1) ? "Free" : "Paid",
                        "is_free" => $row['is_free'],
                        "address" => [
                            "address_line_1" => $row['operator_name'] . " Station",
                            "town" => "Metro Manila"
                        ],
                        "location" => [
                            "latitude" => (float)$row['lat'],
                            "longitude" => (float)$row['lng']
                        ],
                        "distance_km" => $dist
                    ];
                }
            }
        }
        $conn->close();
    }
}

// SORT BY DISTANCE (Nearest First)
usort($finalStations, function($a, $b) {
    return $a['distance_km'] <=> $b['distance_km'];
});

// OUTPUT JSON
echo json_encode($finalStations);

// --- HELPER FUNCTION ---
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    if(($lat1 == $lat2) && ($lon1 == $lon2)) return 0;
    $theta = $lon1 - $lon2;
    $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
    $dist = acos($dist);
    $dist = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;
    return ($miles * 1.609344); // Convert to KM
}
?>