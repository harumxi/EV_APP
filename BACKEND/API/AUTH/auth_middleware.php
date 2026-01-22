<?php
// No spaces or lines before this tag!
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// This handles the browser handshake
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(); 
}

require_once __DIR__ . '/../../CORE/Database.php';

// 1. Get Authorization Header
$headers = null;
if (function_exists('getallheaders')) {
    $headers = getallheaders();
}
$authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

// 2. Validate Bearer Token
if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Unauthorized: Token missing']);
    exit;
}

$token = $matches[1];
$tokenHash = hash('sha256', $token);

try {
    $db = Database::conn();
    // Check if token exists and is not expired
    $stmt = $db->prepare("SELECT u.id, u.username, u.email FROM auth_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token_hash = ? AND s.expires_at > NOW() LIMIT 1");
    $stmt->execute([$tokenHash]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Unauthorized: Invalid or expired token']);
        exit;
    }
    // $currentUser is now available to the script that included this file
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Auth check failed']);
    exit;
}
?>