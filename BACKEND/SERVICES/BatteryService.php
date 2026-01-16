<?php
class BatteryService {
    private $db;
    private $apiNinjasKey;
    private $apiNinjasUrl;

    public function __construct($dbConn, $keys) {
        $this->db = $dbConn;
        $this->apiNinjasKey = $keys['api_ninjas']['api_key'];
        $this->apiNinjasUrl = $keys['api_ninjas']['base_url'];
    }

    public function getActiveCarSpecs($userId) {
        $stmt = $this->db->prepare("SELECT c.api_car_id, c.naming_make, c.naming_model FROM user_garage g JOIN cars c ON g.car_id = c.car_id WHERE g.user_id = ? AND g.is_active = 1 LIMIT 1");
        $stmt->execute([$userId]);
        $car = $stmt->fetch(PDO::FETCH_ASSOC);

        // Default Defaults
        $specs = ['name' => 'Generic EV', 'battery_kwh' => 60.0, 'range_km' => 350.0];

        if ($car) {
            $specs['name'] = $car['naming_make'] . ' ' . $car['naming_model'];
            $parts = explode('|', $car['api_car_id']); 
            
            $url = $this->apiNinjasUrl . "?make=" . urlencode($parts[0] ?? 'Tesla') . "&model=" . urlencode($parts[1] ?? 'Model 3');
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-Api-Key: " . $this->apiNinjasKey]);
            $data = json_decode(curl_exec($ch), true);
            curl_close($ch);

            if (is_array($data) && !empty($data)) {
                $apiSpec = $data[0]; 
                // CRITICAL FIX: (float) casting prevents "string/string" errors
                $specs['battery_kwh'] = (float)($apiSpec['battery_useable_capacity'] ?? $apiSpec['battery_capacity'] ?? 60);
                $specs['range_km'] = (float)($apiSpec['electric_range'] ?? 350);
            }
        }
        return $specs;
    }

    public function calculateUsage($distance, $specs, $currentBattery) {
        // CRITICAL FIX: Force all inputs to be numbers
        $dist = (float)$distance;
        $batSize = (float)$specs['battery_kwh'];
        $range = (float)$specs['range_km'];
        $curr = (float)$currentBattery;

        if ($range <= 0) $range = 350.0; // Prevent divide by zero

        $efficiency = $batSize / $range; 
        $kwhNeeded = $dist * $efficiency;
        $percentUsed = ($kwhNeeded / $batSize) * 100;
        $remaining = $curr - $percentUsed;

        return [
            'est_usage' => round($percentUsed, 1),
            'end_battery' => round($remaining, 1),
            'feasible' => $remaining > 5
        ];
    }
}
?>