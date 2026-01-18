<?php
// 1. Force Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // 2. Database Connection (Smart Path)
    $possiblePaths = [
        __DIR__ . '/../../../CORE/Database.php',
        __DIR__ . '/../../../core/Database.php',
        __DIR__ . '/../../CORE/Database.php'
    ];

    $dbPath = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $dbPath = $path;
            break;
        }
    }

    if (!$dbPath) throw new Exception("Database.php not found");
    require_once $dbPath;
    $db = Database::conn();

    // 3. Get Input
    $input = json_decode(file_get_contents('php://input'), true);
    $garageId = $input['garage_id'] ?? null;
    $userId = $input['user_id'] ?? null;

    if (!$garageId || !$userId) {
        throw new Exception("Missing garage_id or user_id");
    }

    // 4. TRANSACTION: Reset all, then Set One
    $db->beginTransaction();

    // Step A: Set ALL cars for this user to inactive (0)
    $stmt1 = $db->prepare("UPDATE user_garage SET is_active = 0 WHERE user_id = ?");
    $stmt1->execute([$userId]);

    // Step B: Set the SELECTED car to active (1)
    $stmt2 = $db->prepare("UPDATE user_garage SET is_active = 1 WHERE garage_id = ? AND user_id = ?");
    $stmt2->execute([$garageId, $userId]);

    $db->commit();

    echo json_encode(['ok' => true, 'message' => 'Car activated successfully']);

} catch (Exception $e) {
    if (isset($db)) $db->rollBack();
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>