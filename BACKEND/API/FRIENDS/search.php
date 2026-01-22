<?php
// Prevent HTML error output from breaking JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents('php://input'), true);
$query = trim($input['query'] ?? '');
$userId = $input['user_id'] ?? 0;

// Allow 2 characters for easier testing
if(strlen($query) < 2) { echo json_encode(['ok'=>true, 'users'=>[]]); exit; }

try {
    $db = Database::conn();

    // SIMPLIFIED QUERY: Just search users table. 
    // This avoids errors if 'friendships' table is missing or malformed.
    $sql = "SELECT id, username, name, email FROM users 
            WHERE (email LIKE ? OR username LIKE ?) 
            AND id != ? 
            LIMIT 10";

    $stmt = $db->prepare($sql);
    $term = "%$query%";
    $stmt->execute([$term, $term, $userId]);
    
    echo json_encode(['ok'=>true, 'users'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
