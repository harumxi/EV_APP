<?php
/* ===========================
   BACKEND/API/AUTH/login.php
   =========================== */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/AuthHelper.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email and password are required']);
    exit;
}

try {
    $db = Database::conn();
<<<<<<< Updated upstream
    
    // Fetch user
    $stmt = $db->prepare("SELECT id, username, name, email, password_hash, is_verified FROM users WHERE email = ?");
=======

    // ✅ FIXED: Added 'name' to the SELECT query
    $stmt = $db->prepare("SELECT id, username, name, email, password_hash, is_verified, mfa_enabled FROM users WHERE email = ? LIMIT 1");
>>>>>>> Stashed changes
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify Password
    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(['ok' => false, 'error' => 'Invalid email or password']);
        exit;
    }

<<<<<<< Updated upstream
    // Check Verification
    if ($user['is_verified'] == 0) {
        // Return specific flag for frontend to trigger OTP flow
        echo json_encode([
            'ok' => false,
            'require_verification' => true,
            'user_id' => $user['id'],
            'email' => $user['email'],
            'error' => 'Account not verified'
        ]);
        exit;
    }
=======
    // 1. Check Verification
    if ($user['is_verified'] == 0) {
        // Send OTP for verification (reuse 'register' purpose)
        if (AuthHelper::canSendOTP($db, $user['id'], 'register')) {
            $otp = AuthHelper::generateOTP();
            AuthHelper::storeOTP($db, $user['id'], 'register', $otp);
            if (!AuthHelper::sendEmail($user['email'], "Verify Your Account", "Your verification code is: $otp")) {
                http_response_code(500);
                echo json_encode(['ok' => false, 'error' => 'Failed to send verification code.']);
                exit;
            }
        } else {
            // Cooldown active: Don't send new code, just prompt to verify
            // This prevents invalidating the previous code if user clicks login twice
        }

        http_response_code(200);
        echo json_encode([
            'ok' => true,
            'require_verification' => true,
            'temp_user_id' => $user['id'],
            'message' => 'Please verify your email. Code sent.'
        ]);
        exit;
    }

    // 2. Trigger MFA (If enabled)
    if ($user['mfa_enabled'] == 1) {
        if (AuthHelper::canSendOTP($db, $user['id'], 'login_mfa')) {
            $otp = AuthHelper::generateOTP();
            AuthHelper::storeOTP($db, $user['id'], 'login_mfa', $otp);
            if (!AuthHelper::sendEmail($user['email'], "Login Verification", "Your login code is: $otp")) {
                http_response_code(500);
                echo json_encode(['ok' => false, 'error' => 'Failed to send MFA code.']);
                exit;
            }
        }
        
        echo json_encode([
            'ok' => true,
            'mfa_required' => true,
            'temp_user_id' => $user['id'],
            'message' => 'Verification code sent to email.'
        ]);
        exit;
    }

    // Fallback for non-MFA users (if any)
    // Create a session token since MFA is not required
    $sessionToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $sessionToken);
    $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

    $stmt = $db->prepare("INSERT INTO auth_sessions (user_id, session_token_hash, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $tokenHash, $expires]);

    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'message' => 'Login successful',
        'token' => $sessionToken, // Return the token to the client
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'email' => $user['email']
        ]
    ]);
>>>>>>> Stashed changes

    // Success
    unset($user['password_hash']); // Security: Remove hash
    
    echo json_encode(['ok' => true, 'user' => $user]);

} catch (Exception $e) {
    http_response_code(500);
<<<<<<< Updated upstream
    echo json_encode(['ok' => false, 'error' => 'Database connection error']);
}
?>
=======
    error_log($e->getMessage()); // Log the actual error for debugging
    echo json_encode(['ok' => false, 'error' => 'A server error occurred.']);
}
>>>>>>> Stashed changes
