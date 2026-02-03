<?php
/**
 * Get Analytics Data
 * Fetches trips, charging stations, efficiency, and location-based analytics
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../CORE/Database.php';

try {
    $db = Database::conn();
    
    // 1. Total Trips Count
    $stmt = $db->prepare("
        SELECT COUNT(*) as total FROM trip_logs
    ");
    $stmt->execute();
    $totalTrips = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // 2. Total Charging Sessions (from trip_charging_stops)
    $stmt = $db->prepare("
        SELECT COUNT(*) as total FROM trip_charging_stops
    ");
    $stmt->execute();
    $totalChargingSessions = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // 3. Average Efficiency (km per kWh converted to percentage)
    // 7 km/kWh = 100% baseline
    $stmt = $db->prepare("
        SELECT 
            COALESCE(AVG(distance_km / NULLIF(battery_drained, 0)), 0) as avg_km_per_kwh
        FROM trip_logs
        WHERE battery_drained > 0 AND distance_km > 0
    ");
    $stmt->execute();
    $avgKmPerKwh = (float)$stmt->fetch(PDO::FETCH_ASSOC)['avg_km_per_kwh'];
    $avgEfficiency = min(100, ($avgKmPerKwh / 7) * 100);
    $avgEfficiency = max(0, $avgEfficiency);
    
    // 4. Trips by Location (extract city from destination)
    $stmt = $db->prepare("
        SELECT 
            SUBSTRING_INDEX(SUBSTRING_INDEX(destination, ',', -1), ' ', 1) as city,
            COUNT(*) as trip_count
        FROM trip_logs
        WHERE destination IS NOT NULL AND destination != ''
        GROUP BY city
        ORDER BY trip_count DESC
        LIMIT 10
    ");
    $stmt->execute();
    $tripsByLocation = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 5. Charging Stations Data (count by region/city if available)
    $stmt = $db->prepare("
        SELECT 
            operator_name as region,
            COUNT(*) as station_count
        FROM charging_stations
        WHERE operator_name IS NOT NULL
        GROUP BY operator_name
        ORDER BY station_count DESC
        LIMIT 10
    ");
    $stmt->execute();
    $chargingByRegion = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If not enough data by operator, try by location
    if (empty($chargingByRegion)) {
        $stmt = $db->prepare("
            SELECT 
                'All Stations' as region,
                COUNT(*) as station_count
            FROM charging_stations
        ");
        $stmt->execute();
        $chargingByRegion = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // 6. Get unique cities from trips for better city-based analysis
    $stmt = $db->prepare("
        SELECT DISTINCT 
            SUBSTRING_INDEX(SUBSTRING_INDEX(destination, ',', -1), ' ', 1) as city
        FROM trip_logs
        WHERE destination IS NOT NULL AND destination != ''
        ORDER BY city ASC
    ");
    $stmt->execute();
    $citiesRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $cities = array_map(function($row) { return trim($row['city']); }, $citiesRaw);
    $cities = array_filter($cities); // Remove empty values
    $cities = array_unique($cities);
    $cities = array_values($cities); // Re-index
    
    // Build city-wise trip count
    $tripsByCity = [];
    foreach ($cities as $city) {
        if (!empty($city)) {
            $stmt = $db->prepare("
                SELECT COUNT(*) as count FROM trip_logs 
                WHERE destination LIKE CONCAT('%', ?, '%')
            ");
            $stmt->execute([$city]);
            $count = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
            if ($count > 0) {
                $tripsByCity[] = [
                    'city' => $city,
                    'count' => $count
                ];
            }
        }
    }
    
    // Sort by count descending and limit to 10
    usort($tripsByCity, function($a, $b) { return $b['count'] - $a['count']; });
    $tripsByCity = array_slice($tripsByCity, 0, 10);
    
    // Return all analytics data
    http_response_code(200);
    echo json_encode([
        'total_trips' => $totalTrips,
        'total_charging_sessions' => $totalChargingSessions,
        'avg_efficiency' => round($avgEfficiency, 1),
        'trips_by_location' => $tripsByCity,
        'charging_by_region' => $chargingByRegion,
        'cities' => array_slice($cities, 0, 10)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch analytics data',
        'message' => $e->getMessage()
    ]);
}
?>
