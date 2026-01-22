<?php
/* BACKEND/API/AUTH/fix_otp_db.php */
header("Access-Control-Allow-Origin: *");
require_once __DIR__ . '/../../CORE/Database.php';

try {
    $db = Database::conn();
    // Ensure otp_hash is long enough for bcrypt (60 chars)
    $db->exec("ALTER TABLE auth_otps MODIFY otp_hash VARCHAR(255) NOT NULL");
    echo "✅ Database fixed! 'otp_hash' column is now VARCHAR(255). Please request a NEW code and try again.";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>