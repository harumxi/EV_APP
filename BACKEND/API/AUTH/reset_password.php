<?php
/* BACKEND/API/AUTH/reset_password.php */
require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/AuthHelper.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($input['email'] ?? '');
$resetToken = $input['reset_token'] ?? '';
$newPassword = $input['new_password'] ?? '';

try {
    $db = Database::conn();
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['ok' => false, 'error' => 'Invalid request']);
        exit;
    }

    // Verify the Reset Token
    $result = AuthHelper::verifyOTP($db, $user['id'], 'reset_token', $resetToken);

    if (!$result['ok']) {
        echo json_encode(['ok' => false, 'error' => 'Invalid or expired reset session.']);
        exit;
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$newHash, $user['id']]);

    echo json_encode(['ok' => true, 'message' => 'Password updated successfully.']);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>