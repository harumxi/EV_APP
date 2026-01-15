<?php
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../../CORE/Response.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Only POST allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    Response::error('Email and password required', 400);
}

try {
    $db = Database::conn();
    
    // 1. Check if user exists
    $stmt = $db->prepare("SELECT user_id, username, password FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch();

    // 2. If no user is found, send a specific error for your frontend to show
    if (!$user) {
        Response::error('This email is not registered. Please create an account.', 404);
    }

    // 3. Verify password
    if (password_verify($input['password'], $user['password'])) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];

        Response::ok([
            'message' => 'Login successful',
            'user' => ['id' => $user['user_id'], 'username' => $user['username']]
        ]);
    } else {
        Response::error('Incorrect password. Please try again.', 401);
    }

} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}