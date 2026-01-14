<?php
// BACKEND/api/auth/register.php
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../../CORE/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Only POST allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['email'], $input['password'])) {
    Response::error('Missing required fields', 400);
}

try {
    $db = Database::conn();

    // Check if email already exists
    $check = $db->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
    $check->execute([$input['email']]);
    if ($check->fetch()) {
        Response::error('Email is already registered', 409);
    }

    // Hash password and insert user
    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->execute([
        $input['name'],
        $input['email'],
        $hashedPassword
    ]);

    Response::ok(['message' => 'Account created successfully'], 201);

} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}