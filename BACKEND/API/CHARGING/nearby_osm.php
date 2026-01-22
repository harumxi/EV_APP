<?php
/* BACKEND/API/CHARGING/nearby_osm.php */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$lat = isset($_GET['lat']) ? (float)$_GET['lat'] : 14.5995;
$lon = isset($_GET['lon']) ? (float)$_GET['lon'] : 120.9842;
$radius = 30000; // 30km radius (OSM can be slow with larger areas)

// =================================================================================
// 🌍 OVERPASS API QUERY (OpenStreetMap)
// To include Gas Stations, change: node['amenity'='charging_station']
// To: node['amenity'~'charging_station|fuel']
// =================================================================================
$ql = "[out:json][timeout:25];
(
  node['amenity'='charging_station'](around:$radius,$lat,$lon);
);
out body;
>;
out skel qt;";

$url = "https://overpass-api.de/api/interpreter?data=" . urlencode($ql);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, "EnerGo_App/1.0");
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$finalStations = [];

if (isset($data['elements'])) {
    foreach ($data['elements'] as $element) {
        if (!isset($element['tags'])) continue;
        $tags = $element['tags'];

        // 1. Extract Plugs (OSM format: socket:type2=2)
        $plugs = [];
        $connections = [];
        foreach ($tags as $key => $value) {
            if (strpos($key, 'socket:') === 0) {
                $type = ucfirst(str_replace('socket:', '', $key));
                // Normalize names
                if(strtolower($type) == 'type2') $type = 'Type 2';
                if(strtolower($type) == 'chademo') $type = 'CHAdeMO';
                if(strtolower($type) == 'ccs') $type = 'CCS2';
                
                $plugs[] = $type;
                $connections[] = [
                    'type' => $type,
                    'power' => 0, // OSM often lacks power data
                    'qty' => is_numeric($value) ? $value : 1,
                    'status' => 'Operational'
                ];
            }
        }
        if (empty($plugs)) $plugs[] = "Standard / Unknown";

        // 2. Map to App Structure
        $finalStations[] = [
            "id" => "OSM-" . $element['id'],
            "name" => $tags['name'] ?? "EV Charging Station",
            "operator" => $tags['operator'] ?? $tags['brand'] ?? "Unknown Operator",
            "website" => $tags['website'] ?? "",
            "email" => $tags['email'] ?? "",
            "status" => "Operational",
            "usage" => $tags['access'] ?? "Public",
            "usage_cost" => ($tags['fee'] ?? '') === 'yes' ? "Paid" : (($tags['fee'] ?? '') === 'no' ? "Free" : "Unknown"),
            "is_free" => (isset($tags['fee']) && $tags['fee'] === 'no') ? 1 : 0,
            "address" => [
                "line1" => $tags['addr:street'] ?? $tags['addr:full'] ?? "Near " . ($tags['addr:city'] ?? "Location"),
                "line2" => null,
                "town" => $tags['addr:city'] ?? "",
                "state" => $tags['addr:province'] ?? "",
                "postcode" => $tags['addr:postcode'] ?? "",
                "country" => "Philippines"
            ],
            "location" => [
                "latitude" => $element['lat'],
                "longitude" => $element['lon']
            ],
            "distance_km" => 0, // Calculated in frontend or helper
            "plugs" => $plugs,
            "connections" => $connections,
            "bays" => $tags['capacity'] ?? 1,
            "access_comments" => $tags['description'] ?? $tags['note'] ?? "",
            "data_provider" => "OpenStreetMap",
            "last_verified" => $tags['check_date'] ?? null,
            "photos" => []
        ];
    }
}

echo json_encode($finalStations);
?>