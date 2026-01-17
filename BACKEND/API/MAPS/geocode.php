<?php
// VERSION: FINAL FIX (If you don't see this line, you didn't save the file!)

// 1. Force CORS & JSON Headers immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Disable HTML Error Printing (Crucial!)
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // 3. Get Input (Supports both GET URL and POST JSON)
    $q = '';
    if (isset($_GET['q'])) {
        $q = $_GET['q'];
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $q = $input['text'] ?? '';
    }

    if (empty($q)) {
        echo json_encode(['ok' => true, 'results' => []]); 
        exit;
    }

    // 4. HARDCODED URL (This fixes your "Undefined array key" error)
    $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query([
        'format' => 'jsonv2',
        'q' => $q,
        'limit' => 5,
        'countrycodes' => 'ph',
        'addressdetails' => 1
    ]);

    // 5. Use cURL (Fixes connection issues on XAMPP)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, "EV_Student_Project/1.0");
    
    // IGNORE SSL CERTIFICATE ERRORS (Fixes "Failed to fetch")
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        throw new Exception("cURL Connection Failed: " . $curlError);
    }

    // 6. Return Data
    $data = json_decode($response, true);
    $results = [];

    if (is_array($data)) {
        foreach ($data as $item) {
            $results[] = [
                'label' => $item['display_name'],
                'lat' => $item['lat'],
                'lng' => $item['lon']
            ];
        }
    }

    echo json_encode(['ok' => true, 'results' => $results]);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>