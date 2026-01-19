<?php
/* ===========================
   BACKEND/API/AUTH/register.php
   =========================== */

// 1. PATH FIX: If auth_middleware is in the SAME folder (AUTH)
require_once __DIR__ . '/auth_middleware.php'; 

// 2. DATABASE FIX: Looking for Database.php in the CORE folder
require_once __DIR__ . '/../../CORE/Database.php';

// Set header to JSON so the browser understands the response
header('Content-Type: application/json');

// 3. CAPTURE DATA
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Combine split names from frontend
// Inside register.php
$fName = trim($input['firstName'] ?? '');
$lName = trim($input['lastName'] ?? '');
$fullName = trim("$fName $lName"); // This merges them into one string

// Insert into the 'name' column
$sql = "INSERT INTO users (username, name, email, password_hash, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())";
$stmt = $db->prepare($sql);
$stmt->execute([$customUsername, $fullName, $email, $hashed]); 

$customUsername = trim($input['username'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$confirmPass = $input['confirmPassword'] ?? '';

// 4. VALIDATION
if (empty($customUsername) || empty($fullName) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'All fields are required.']);
    exit;
}

if ($password !== $confirmPass) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Passwords do not match.']);
    exit;
}

try {
    $db = Database::conn();
    $hashed = password_hash($password, PASSWORD_DEFAULT);

    // SQL matches your 'username' and 'name' columns
    $sql = "INSERT INTO users (username, name, email, password_hash, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$customUsername, $fullName, $email, $hashed]);

    echo json_encode([
        'ok' => true,
        'user' => [
            'id' => $db->lastInsertId(),
            'username' => $customUsername,
            'full_name' => $fullName
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}