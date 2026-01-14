<?php
class Database {
    private static $instance = null;

    public static function conn() {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../CONFIG/database.php';
            try {
                $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['db']};charset={$config['charset']}";
                self::$instance = new PDO($dsn, $config['user'], $config['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                die(json_encode(["ok" => false, "error" => "Database Error: " . $e->getMessage()]));
            }
        }
        return self::$instance;
    }
}