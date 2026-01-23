<?php
/* ===========================
   BACKEND/API/AUTH/reset_users.php
   =========================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    // 1. Robust Path Finder for Database.php
    $possiblePaths = [
        __DIR__ . '/../../CORE/Database.php',
        __DIR__ . '/../../core/Database.php',
        $_SERVER['DOCUMENT_ROOT'] . '/WEBPROG_PROJ/BACKEND/CORE/Database.php'
    ];

    $dbPath = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $dbPath = $path;
            break;
        }
    }

    if (!$dbPath) {
        throw new Exception("Database.php not found. Checked paths: " . implode(", ", $possiblePaths));
    }

    require_once $dbPath;

    $db = Database::conn();
    
    // 2. Disable Foreign Key Checks (Allows us to clear tables with relationships)
    $db->query("SET FOREIGN_KEY_CHECKS = 0");

    // 3. List of tables to clear (User Data Only)
    $tables = ['auth_sessions', 'auth_otps', 'user_garage', 'users'];

    foreach ($tables as $table) {
        // Silent try-catch in case a table doesn't exist yet
        try { $db->query("TRUNCATE TABLE $table"); } catch (Exception $ex) {}
    }

    // 4. Re-enable Foreign Key Checks
    $db->query("SET FOREIGN_KEY_CHECKS = 1");

    echo json_encode(['ok' => true, 'message' => 'All users deleted. IDs reset to 1.']);
} catch (Throwable $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>