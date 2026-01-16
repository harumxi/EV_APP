<?php
// === CRITICAL CORS HEADERS ===
// Allow ANY origin (like your Live Server at 127.0.0.1:5500) to connect
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle Preflight (Browser checks permission before sending data)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';

// 1. Read Input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['email'], $input['password'])) {
    echo json_encode(['ok' => false, 'error' => 'All fields (name, email, password) are required']);
    exit;
}

try {
    $db = Database::conn();

    // 2. Check for Duplicate Email
    $check = $db->prepare("SELECT user_id FROM users WHERE email = ?");
    $check->execute([$input['email']]);
    if ($check->fetch()) {
        echo json_encode(['ok' => false, 'error' => 'Email already registered.']);
        exit;
    }

    // 3. Hash Password
    $hashed = password_hash($input['password'], PASSWORD_DEFAULT);

    // 4. Insert User (This works now because you added the 'username' column!)
    $stmt = $db->prepare("INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
    $stmt->execute([$input['name'], $input['email'], $hashed]);

    echo json_encode(['ok' => true, 'message' => 'Your account has been successfully created.']);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => 'Database Error: ' . $e->getMessage()]);
}
?>