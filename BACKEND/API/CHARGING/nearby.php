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
$limit = 100; // Increased limit to find better stations

require_once __DIR__ . '/../../CORE/Database.php';

$finalStations = [];

// ========================================================
// STRATEGY A: FETCH FROM OPEN CHARGE MAP API (REAL DATA)
// ========================================================
$apiUrl = "https://api.openchargemap.io/v3/poi/?output=json&latitude=$lat&longitude=$lng&distance=$radius&maxresults=$limit&compact=false&verbose=true&key=$API_KEY";

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

        // Extract Detailed Connections
        $plugs = [];
        $connections = [];
        if (isset($station['Connections']) && is_array($station['Connections'])) {
            foreach ($station['Connections'] as $conn) {
                if (isset($conn['ConnectionType']['Title'])) {
                    $plugs[] = $conn['ConnectionType']['Title'];
                }
                $connections[] = [
                    'type' => $conn['ConnectionType']['Title'] ?? 'Unknown Type',
                    'power' => $conn['PowerKW'] ?? 0,
                    'current' => $conn['CurrentType']['Title'] ?? '',
                    'qty' => $conn['Quantity'] ?? 1,
                    'status' => $conn['StatusType']['Title'] ?? 'Operational'
                ];
            }
        }
        $plugs = array_values(array_unique($plugs));

        // Smart Operator Fallback
        $operatorName = $op['Title'] ?? "Unknown Operator";
        if ($operatorName === "Unknown Operator" && isset($addr['Title'])) {
            $commonBrands = ['Petron', 'Shell', 'Tesla', 'SM ', 'Ayala', 'Robinsons', 'Unioil', 'Caltex', 'Total', 'CleanFuel', 'Galaxy'];
            foreach ($commonBrands as $brand) {
                if (stripos($addr['Title'], $brand) !== false) {
                    $operatorName = trim($brand) . " (Inferred)";
                    break;
                }
            }
        }

        // Smart Usage Cost Logic
        $cost = $station['UsageCost'] ?? "";
        if (empty($cost)) {
            $uTitle = $usage['Title'] ?? "";
            if (stripos($uTitle, "Free") !== false) $cost = "Free";
            elseif (stripos($uTitle, "Pay") !== false || stripos($uTitle, "Membership") !== false) $cost = "Paid (See Operator)";
            else $cost = "Unknown";
        }

        // Merge Comments (Access + General)
        $commentsParts = [];
        if (!empty($addr['AccessComments'])) $commentsParts[] = $addr['AccessComments'];
        if (!empty($station['GeneralComments'])) $commentsParts[] = $station['GeneralComments'];
        $finalComments = implode(". ", $commentsParts);

        // Extract Photos (MediaItems)
        $photos = [];
        if (isset($station['MediaItems']) && is_array($station['MediaItems'])) {
            foreach ($station['MediaItems'] as $media) {
                if (isset($media['ItemURL'])) $photos[] = $media['ItemURL'];
            }
        }

        $finalStations[] = [
            "id" => "OCM-" . ($station['ID'] ?? uniqid()),
            "name" => $addr['Title'] ?? "Unknown Station",
            "operator" => $operatorName,
            "website" => $op['WebsiteURL'] ?? "",
            "email" => $op['ContactEmail'] ?? "",
            "status" => $status['Title'] ?? "Unknown",
            "usage" => $usage['Title'] ?? "Public",
            "usage_cost" => $cost,
            "is_free" => (stripos($cost, 'Free') !== false) ? 1 : 0,
            "address" => [
                "line1" => $addr['AddressLine1'] ?? $addr['Title'] ?? "",
                "line2" => $addr['AddressLine2'] ?? null,
                "town" => $addr['Town'] ?? $addr['StateOrProvince'] ?? "",
                "state" => $addr['StateOrProvince'] ?? null,
                "postcode" => $addr['Postcode'] ?? "",
                "country" => $addr['Country']['Title'] ?? ""
            ],
            "location" => [
                "latitude" => (float)($addr['Latitude'] ?? 0),
                "longitude" => (float)($addr['Longitude'] ?? 0)
            ],
            "distance_km" => calculateDistance($lat, $lng, $addr['Latitude'] ?? 0, $addr['Longitude'] ?? 0),
            "plugs" => $plugs,
            "connections" => $connections,
            "bays" => $station['NumberOfPoints'] ?? 1,
            "access_comments" => $finalComments,
            "data_provider" => $station['DataProvider']['Title'] ?? "Open Charge Map Contributors",
            "last_verified" => $station['DateLastVerified'] ?? null,
            "photos" => $photos
        ];
    }
}

// ========================================================
// STRATEGY B: FALLBACK TO LOCAL DATABASE (IF API FAILS)
// ========================================================
if (empty($finalStations)) {
    try {
        $db = Database::conn();
        $stmt = $db->prepare("SELECT * FROM charging_stations");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($rows as $row) {
            $dist = calculateDistance($lat, $lng, $row['latitude'], $row['longitude']);
            
            // Decode connections JSON
            $connections = json_decode($row['connections_json'] ?? '[]', true);
            $plugs = array_map(function($c) { return $c['type']; }, $connections);

            if($dist <= $radius) {
                $finalStations[] = [
                    "id" => "DB-" . $row['station_id'],
                    "name" => $row['name'],
                    "operator" => $row['operator'],
                    "status" => $row['status_type'],
                    "usage" => $row['usage_type'],
                    "usage_cost" => $row['usage_cost'],
                    "is_free" => (int)$row['is_free'],
                    "address" => [
                        "line1" => $row['address_line1'],
                        "line2" => null,
                        "town" => $row['town'],
                        "state" => $row['state'],
                        "postcode" => $row['postcode'],
                        "country" => $row['country']
                    ],
                    "location" => [
                        "latitude" => (float)$row['latitude'],
                        "longitude" => (float)$row['longitude']
                    ],
                    "distance_km" => $dist,
                    "plugs" => $plugs,
                    "connections" => $connections,
                    "bays" => (int)$row['bays'],
                    "website" => $row['website'],
                    "email" => $row['email'],
                    "access_comments" => "",
                    "data_provider" => "Local Database",
                    "last_verified" => null,
                    "photos" => []
                ];
            }
        }
    } catch (Exception $e) { /* Ignore DB errors in fallback */ }
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