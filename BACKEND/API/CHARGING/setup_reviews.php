<?php
/* BACKEND/API/CHARGING/setup_reviews.php */
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    $db->exec("CREATE TABLE IF NOT EXISTS station_reviews (
        review_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        station_id VARCHAR(100) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    echo "✅ Table 'station_reviews' created successfully.";
} catch (Exception $e) { echo "❌ Error: " . $e->getMessage(); }
?>