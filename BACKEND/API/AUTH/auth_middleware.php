<?php
// ==========================================
// 1. GLOBAL CORS HANDLING (The "Connection Error" Fix)
// ==========================================
// This allows your Frontend (127.0.0.1) to talk to this Backend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY");

// Handle Browser "Preflight" Checks automatically
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// 2. AUTHENTICATION HELPER
// ==========================================
// Call this function at the top of files you want to protect.
function checkAuth() {
    // 1. Get Headers
    $headers = null;
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    } else {
        $headers = $_SERVER;
    }

    // 2. Look for 'Authorization' header
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    // 3. Validate (Basic Example)
    // If you strictly require login, uncomment the lines below:
    
    /*
    if (!$auth) {
        http_response_code(401); // Unauthorized
        echo json_encode(['ok' => false, 'error' => 'Access Denied: No Token Provided']);
        exit();
    }
    */

    return true; // Allow access for now (until you implement Login)
}
?>