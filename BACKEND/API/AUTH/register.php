<?php
/* ===========================
   BACKEND/api/AUTH/register.php
   Full working file:
   - Strong password rules
   - Uses users(username,email,password_hash)
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
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($name === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'All fields (name, email, password) are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email format']);
    exit;
}

// Strong password: 8+ chars, 1 uppercase, 1 number, 1 special
if (!preg_match('/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/', $password)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Password must be 8+ chars and include 1 uppercase, 1 number, and 1 special character.']);
    exit;
}

try {
    $db = Database::conn();

    $check = $db->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
    $check->execute([$email]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'Email already registered.']);
        exit;
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $db->prepare("INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
    $stmt->execute([$name, $email, $hashed]);

    http_response_code(201);
    echo json_encode([
        'ok' => true,
        'message' => 'Your account has been successfully created.',
        'user_id' => (int)$db->lastInsertId()
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database Error']);
}
