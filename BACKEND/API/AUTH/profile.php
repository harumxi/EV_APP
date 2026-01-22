<?php
/* ============================================================
   BACKEND/api/USER/profile.php
   ============================================================ */

// 1. FIX CORS ERRORS: Allows your Live Server to access XAMPP
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// 2. Handle the Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    $method = $_SERVER['REQUEST_METHOD'];

    // --- GET: Fetch Profile for Specific Logged-in User ---
    if ($method === 'GET') {
        $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        
        if (!$user_id) {
            echo json_encode(['ok' => false, 'error' => 'No User ID provided']);
            exit;
        }

        $stmt = $db->prepare("SELECT id, username, email, pref_dark, pref_units FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(['ok' => false, 'error' => 'User not found']);
            exit;
        }

        echo json_encode([
            'ok' => true,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['username'],
                'email' => $user['email'],
                'pref_dark' => (bool)$user['pref_dark'],
                'pref_units' => $user['pref_units'] ?? 'km'
            ]
        ]);
    }

    // --- POST: Update ONLY Preferences ---
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $user_id = isset($input['user_id']) ? (int)$input['user_id'] : null;

        if (!$user_id) {
            echo json_encode(['ok' => false, 'error' => 'User ID missing']);
            exit;
        }

        $stmt = $db->prepare("UPDATE users SET pref_dark = ?, pref_units = ? WHERE id = ?");
        $stmt->execute([
            $input['pref_dark'] ? 1 : 0,
            $input['pref_units'],
            $user_id
        ]);

        echo json_encode(['ok' => true, 'message' => 'Preferences updated']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}