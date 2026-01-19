<?php
/* ===========================
   BACKEND/api/AUTH/login.php
   =========================== */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email and password required']);
    exit;
}

try {
    $db = Database::conn();

    // ✅ FIXED: Added 'name' to the SELECT query
    $stmt = $db->prepare("SELECT user_id, username, name, email, password_hash FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Invalid email or password']);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => (int)$user['user_id'],
            'username' => $user['username'], // @venven
            'name' => $user['name'],         // Alexa Baldueza
            'email' => $user['email']        // email address
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server Error']);
}