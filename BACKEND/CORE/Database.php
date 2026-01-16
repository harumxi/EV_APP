<?php
class Database {
    // 1. CONNECTION SETTINGS
    // Change 'localhost' to '127.0.0.1' to fix the [2002] error
    private static $host = '127.0.0.1'; 
    private static $db_name = 'ev_app_db';
    private static $username = 'root';
    private static $password = ''; // Default XAMPP password is empty
    private static $conn = null;

    public static function conn() {
        if (self::$conn === null) {
            try {
                $dsn = "mysql:host=" . self::$host . ";dbname=" . self::$db_name . ";charset=utf8mb4";
                
                self::$conn = new PDO($dsn, self::$username, self::$password, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                // Return a clean JSON error if connection fails
                header('Content-Type: application/json');
                echo json_encode([
                    'ok' => false, 
                    'error' => 'Database Connection Failed: ' . $e->getMessage()
                ]);
                exit;
            }
        }
        return self::$conn;
    }
}
?>