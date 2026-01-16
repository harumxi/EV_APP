<?php
// FILE: BACKEND/api/GARAGE/add.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['make'], $input['model'])) {
    exit(json_encode(['ok' => false, 'error' => 'Missing car data']));
}

try {
    $db = Database::conn();
    $userId = $input['user_id'] ?? 1;
    $year = $input['year'] ?? '2023';
    
    // Unique ID for API Ninjas lookup later
    $apiId = $input['make'] . '|' . $input['model'] . '|' . $year;

    // 1. Check if Car exists in master table, else insert
    $stmt = $db->prepare("SELECT car_id FROM cars WHERE api_car_id = ?");
    $stmt->execute([$apiId]);
    $car = $stmt->fetch();

    if ($car) {
        $carId = $car['car_id'];
    } else {
        $ins = $db->prepare("INSERT INTO cars (api_car_id, naming_make, naming_model) VALUES (?, ?, ?)");
        $ins->execute([$apiId, $input['make'], $input['model']]);
        $carId = $db->lastInsertId();
    }

    // 2. Add to User's Garage (Active by default)
    // First, deactivate others
    $db->prepare("UPDATE user_garage SET is_active = 0 WHERE user_id = ?")->execute([$userId]);
    // Then add new one
    $db->prepare("INSERT INTO user_garage (user_id, car_id, is_active) VALUES (?, ?, 1)")->execute([$userId, $carId]);

    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>