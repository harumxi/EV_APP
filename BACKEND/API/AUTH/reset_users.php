<?php
/* ===========================
   BACKEND/API/AUTH/reset_users.php
   =========================== */

<<<<<<< Updated upstream
// Force text output so you can see errors in the browser
header("Content-Type: text/plain");

// Enable Error Reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "--- STARTING RESET SCRIPT ---\n";

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
    echo "Database file loaded: $dbPath\n";

    $db = Database::conn();
    echo "Database connected successfully.\n";
    
    // 2. Disable Foreign Key Checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");

    // 3. Clear Tables
    $tables = ['auth_sessions', 'auth_otps', 'user_garage', 'users'];

    foreach ($tables as $table) {
        try { 
            $db->exec("TRUNCATE TABLE $table"); 
            echo "Cleared table: $table\n";
        } catch (Exception $ex) {
            echo "Skipped table $table (might not exist)\n";
        }
    }

    // 4. Re-enable Foreign Key Checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "\n✅ SUCCESS: All users deleted. IDs reset to 1.";
} catch (Throwable $e) {
    echo "\n❌ ERROR: " . $e->getMessage();
=======
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    
    // 1. Disable Foreign Key Checks (Allows us to clear tables with relationships)
    $db->query("SET FOREIGN_KEY_CHECKS = 0");

    // 2. List of tables to clear (User Data Only)
    $tables = [
        'auth_sessions', 
        'auth_otps', 
        'user_garage', 
        'users'
    ];

    foreach ($tables as $table) {
        // Silent try-catch in case a table doesn't exist yet
        try { $db->query("TRUNCATE TABLE $table"); } catch (Exception $ex) {}
    }

    // 3. Re-enable Foreign Key Checks
    $db->query("SET FOREIGN_KEY_CHECKS = 1");

    echo json_encode(['ok' => true, 'message' => 'All users deleted. IDs reset to 1.']);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
>>>>>>> Stashed changes
}
?>