<?php
/* BACKEND/API/BATTERY/setup_logs.php */
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    $db->exec("CREATE TABLE IF NOT EXISTS trip_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        origin VARCHAR(255),
        destination VARCHAR(255),
        distance_km DECIMAL(10, 2),
        battery_drained DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    echo "✅ Table 'trip_logs' created successfully.";
} catch (Exception $e) { echo "❌ Error: " . $e->getMessage(); }
?>