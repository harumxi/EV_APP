<?php
class RouteService {
    private $apiKey;

    public function __construct($keys) {
        $this->apiKey = $keys['ors']['api_key'];
    }

    // Helper: Strict GPS Parser
    private function parseLatLng($location) {
        $location = trim($location);
        if (!preg_match('/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/', $location, $m)) {
            return null;
        }
        return [
            'lat' => (float)$m[1],
            'lng' => (float)$m[2],
            'label' => "GPS Coordinates",
            'confidence' => 1.0
        ];
    }

    // INTERNAL HELPER: Call API
    private function fetchFromApi($query, $biasLat = null, $biasLng = null) {
        $url = "https://api.openrouteservice.org/geocode/search?api_key=" . $this->apiKey . 
               "&text=" . urlencode($query) . 
               "&boundary.country=PH&size=1"; // Just get the top result

        if ($biasLat !== null && $biasLng !== null) {
            $url .= "&focus.point.lat=" . $biasLat . "&focus.point.lon=" . $biasLng;
        }

        $response = @file_get_contents($url);
        if (!$response) return null;
        $json = json_decode($response, true);
        
        if (!empty($json['features'])) {
            $f = $json['features'][0];
            return [
                'lat' => $f['geometry']['coordinates'][1],
                'lng' => $f['geometry']['coordinates'][0],
                'label' => $f['properties']['label'],
                'confidence' => $f['properties']['confidence'] ?? 0
            ];
        }
        return null;
    }

    // THE SMART GEOCODER (With Auto-Correction)
    public function getCoordinates($location, $biasLat = null, $biasLng = null) {
        // 1. Try GPS
        $gps = $this->parseLatLng($location);
        if ($gps) return $gps;

        // 2. Perform Initial Search
        $result = $this->fetchFromApi($location, $biasLat, $biasLng);

        // --- 3. AUTO-CORRECTION LOGIC (The Fix) ---
        // Problem: User types "NU Fairview", Map returns "NU Manila".
        // Fix: Detect this mismatch and search for a nearby landmark instead.
        
        if ($result) {
            $userQuery = strtolower($location);
            $foundAddress = strtolower($result['label']);

            // CHECK: Did user want "Fairview" but got "Manila"?
            if (strpos($userQuery, 'fairview') !== false && strpos($foundAddress, 'manila') !== false) {
                // FORCE RETRY: Search for "SM City Fairview" instead
                // This is a known landmark right across the street from NU Fairview
                $correction = $this->fetchFromApi("SM City Fairview, Quezon City", $biasLat, $biasLng);
                if ($correction) {
                    $correction['label'] = "National University Fairview (via SM Proxy)"; // Update label for user
                    return $correction;
                }
            }
        }

        return $result;
    }

    // Get Route Options
    public function getRouteOptions($originCoords, $destCoords) {
        $url = "https://api.openrouteservice.org/v2/directions/driving-car";
        $body = json_encode([
            "coordinates" => [[$originCoords['lng'], $originCoords['lat']], [$destCoords['lng'], $destCoords['lat']]],
            "alternative_routes" => ["target_count" => 3],
            "units" => "km",
            "geometry" => "true"
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: ' . $this->apiKey]);

        $result = curl_exec($ch);
        curl_close($ch);
        $data = json_decode($result, true);
        
        if (!isset($data['routes'])) return null;

        $options = [];
        foreach ($data['routes'] as $index => $route) {
            $options[] = [
                'id' => $index,
                'distance_km' => $route['summary']['distance'],
                'duration_min' => round($route['summary']['duration'] / 60),
                'geometry' => $route['geometry']
            ];
        }
        return $options;
    }
}
?>