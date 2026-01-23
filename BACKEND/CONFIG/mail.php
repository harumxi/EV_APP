<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Adjust this path if your vendor folder is elsewhere
require_once __DIR__ . '/../vendor/autoload.php';

function getMailer() {
    $mail = new PHPMailer(true);

    // 1. Load .env manually (Simple parser so you don't need extra libraries)
    $envPath = __DIR__ . '/../.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $_ENV[trim($parts[0])] = trim($parts[1]);
            }
        }
    }

    // 2. Server Settings (SMTP)
    $mail->isSMTP();
    $mail->Host       = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['SMTP_USER'] ?? '';
    $mail->Password   = $_ENV['SMTP_PASS'] ?? '';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $_ENV['SMTP_PORT'] ?? 587;

    // 3. Default Sender
    $mail->setFrom($_ENV['SMTP_FROM_EMAIL'] ?? $_ENV['SMTP_USER'], $_ENV['SMTP_FROM_NAME'] ?? 'EnerGo');

    return $mail;
}
?>