<?php
/* BACKEND/API/CHARGING/setup_favorites.php */
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    $db->exec("CREATE TABLE IF NOT EXISTS user_favorites (
        fav_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        station_id VARCHAR(100) NOT NULL,
        station_name VARCHAR(255),
        address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_fav (user_id, station_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    echo "✅ Table 'user_favorites' created successfully.";
} catch (Exception $e) { echo "❌ Error: " . $e->getMessage(); }
?>