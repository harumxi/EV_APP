<?php
// Database Config
define('DB_HOST', 'localhost');
define('DB_NAME', 'ev_app_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Security Constants
define('OTP_SECRET', 'your_super_secret_hmac_key');
define('OTP_EXPIRY_REGISTER', 10); // Minutes
define('OTP_EXPIRY_MFA', 5);
define('MAX_ATTEMPTS', 5);

// Provider Config (Example: PHPMailer/SMTP)
define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_USER', 'your-email@gmail.com');
define('MAIL_PASS', 'your-app-password');