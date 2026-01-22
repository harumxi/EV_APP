<?php
/* BACKEND/API/GARAGE/fix_garage_schema.php */

// Enable error reporting to see issues
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    
    echo "--- STARTING SCHEMA FIX ---\n";
    
    // 1. Drop existing tables to clear bad schema (Force cleanup)
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    $db->exec("DROP TABLE IF EXISTS user_garage");
    $db->exec("DROP TABLE IF EXISTS ev_variants");
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo "🗑️ Dropped old tables (user_garage, ev_variants).\n";

    // 2. Re-create ev_variants table with 'make' column
    $db->exec("CREATE TABLE ev_variants (
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
    echo "✅ Table 'ev_variants' created with 'make' column.\n";

    // 3. Re-create user_garage table
    $db->exec("CREATE TABLE user_garage (
        garage_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        variant_id INT NOT NULL,
        nickname VARCHAR(100),
        is_active TINYINT(1) DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES ev_variants(variant_id) ON DELETE CASCADE
    )");
    echo "✅ Table 'user_garage' created.\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>