<?php
// === CRITICAL CORS HEADERS (Same as register.php) ===
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle Preflight Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'], $input['password'])) {
    echo json_encode(['ok' => false, 'error' => 'Email and password required']);
    exit;
}

try {
    $db = Database::conn();

    // 1. Fetch user by email
    // We select 'password_hash' because that's what your DB calls it
    $stmt = $db->prepare("SELECT user_id, username, password_hash FROM users WHERE email = ?");
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch();

    // 2. Verify Password
    if ($user && password_verify($input['password'], $user['password_hash'])) {
        // Success! Return user info (excluding password)
        echo json_encode([
            'ok' => true, 
            'message' => 'Login successful',
            'user' => [
                'id' => $user['user_id'],
                'name' => $user['username'],
                'email' => $input['email']
            ]
        ]);
    } else {
        echo json_encode(['ok' => false, 'error' => 'Invalid email or password']);
    }

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => 'Server Error: ' . $e->getMessage()]);
}
?>