<?php
/* BACKEND/API/GARAGE/setup_garage.php */
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    
    // 1. Create ev_variants table
    $db->exec("CREATE TABLE IF NOT EXISTS ev_variants (
        variant_id INT AUTO_INCREMENT PRIMARY KEY,
        make VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT NOT NULL DEFAULT 2024,
        battery_capacity_kwh DECIMAL(5,1) NOT NULL,
        efficiency_wh_per_km INT NOT NULL,
        plug_type VARCHAR(50) DEFAULT 'Type 2',
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_variant (make, model, year)
    )");
    echo "✅ Table 'ev_variants' checked/created.\n";

    // 2. Create user_garage table
    $db->exec("CREATE TABLE IF NOT EXISTS user_garage (
        garage_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        variant_id INT NOT NULL,
        nickname VARCHAR(100),
        is_active TINYINT(1) DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES ev_variants(variant_id) ON DELETE CASCADE
    )");
    echo "✅ Table 'user_garage' checked/created.\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>