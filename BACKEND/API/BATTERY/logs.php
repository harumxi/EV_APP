<?php
// --- CORS HEADERS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");
require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();

    // GET Request: Fetch History
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = $_GET['user_id'] ?? 1;
        $stmt = $db->prepare("SELECT * FROM trip_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
        $stmt->execute([$userId]);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['ok' => true, 'logs' => $logs]);
        exit;
    }

    // POST Request: Save New Trip
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        // Required Fields
        if (!isset($input['distance_km']) || !isset($input['battery_drained'])) {
            throw new Exception("Missing trip data");
        }

        $userId = $input['user_id'] ?? 1;
        $dist = $input['distance_km'];
        $drain = $input['battery_drained'];
        $startAddr = $input['origin'] ?? 'Unknown';
        $endAddr = $input['destination'] ?? 'Unknown';

        // Insert into DB (Assuming you have a 'trip_logs' table)
        // If this table doesn't exist, you'll need to create it (SQL below)
        $sql = "INSERT INTO trip_logs (user_id, distance_km, battery_drained, origin, destination, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$userId, $dist, $drain, $startAddr, $endAddr]);

        echo json_encode(['ok' => true, 'message' => 'Trip saved successfully']);
        exit;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>