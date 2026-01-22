<?php
/* ===========================
   BACKEND/API/AUTH/register.php
   =========================== */

// 1. PATH FIX: If auth_middleware is in the SAME folder (AUTH)
require_once __DIR__ . '/auth_middleware.php'; 

// 2. DATABASE FIX: Looking for Database.php in the CORE folder
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/AuthHelper.php'; // Required for OTP

// Set header to JSON so the browser understands the response
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. CAPTURE DATA
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$fName = trim($input['firstName'] ?? '');
$lName = trim($input['lastName'] ?? '');
$fullName = trim("$fName $lName");

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
    $db->beginTransaction(); // Start Transaction

    // 1. Check if user exists (Verified or Unverified)
    $stmt = $db->prepare("SELECT id, is_verified FROM users WHERE email = ? OR username = ?");
    $stmt->execute([$email, $customUsername]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

    $userId = 0;
    $hashed = password_hash($password, PASSWORD_DEFAULT);

    if ($existingUser) {
        if ($existingUser['is_verified'] == 1) {
            // Account exists and is verified -> Conflict
            $db->rollBack();
            http_response_code(409);
            echo json_encode(['ok' => false, 'error' => 'This account is already registered and verified. Please Sign In.']);
            exit;
        } else {
            // Account exists but is UNVERIFIED -> Overwrite/Update it (Retry Registration)
            $userId = $existingUser['id'];
            
            // Check Rate Limit before updating to prevent spamming OTPs
            if (!AuthHelper::canSendOTP($db, $userId, 'register')) {
                $db->rollBack();
                echo json_encode(['ok' => true, 'require_verification' => true, 'message' => 'Verification code already sent. Please check your email.', 'temp_user_id' => $userId, 'email' => $email]);
                exit;
            }

            $db->prepare("UPDATE users SET username = ?, name = ?, password_hash = ?, email = ?, updated_at = NOW() WHERE id = ?")
               ->execute([$customUsername, $fullName, $hashed, $email, $userId]);
        }
    } else {
        // New User -> Insert
        $sql = "INSERT INTO users (username, name, email, password_hash, is_verified, created_at, updated_at) 
                VALUES (?, ?, ?, ?, 0, NOW(), NOW())";
        $stmt = $db->prepare($sql);
        $stmt->execute([$customUsername, $fullName, $email, $hashed]);
        $userId = $db->lastInsertId();
    }

    // 2. Generate and Send OTP
    $otp = AuthHelper::generateOTP();
    AuthHelper::storeOTP($db, $userId, 'register', $otp);
    
    if (!AuthHelper::sendEmail($email, "Energo Account Verification Code", "Your Energo verification code is: $otp")) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Failed to send verification code. Please check your email.']);
        exit;
    }

    $db->commit();

    echo json_encode([
        'ok' => true,
        'require_verification' => true,
        'message' => 'Verification code sent to email.',
        'temp_user_id' => $userId,
        'email' => $email
    ]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}