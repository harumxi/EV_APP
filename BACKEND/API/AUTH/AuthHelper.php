<?php
/* ===========================
   BACKEND/API/AUTH/AuthHelper.php
   =========================== */

// Import PHPMailer classes into the global namespace
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load Composer's autoloader
require_once __DIR__ . '/../../vendor/autoload.php';

class AuthHelper {
    
    // Rate Limit: 60 seconds between OTPs
    const OTP_COOLDOWN_SECONDS = 60; // Spec: 60 seconds
    const OTP_EXPIRY_MINUTES = 10;   // Spec: 10 minutes

    public static function generateOTP() {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    public static function canSendOTP($db, $userId, $purpose) {
        $stmt = $db->prepare("SELECT created_at FROM auth_otps WHERE user_id = ? AND purpose = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$userId, $purpose]);
        $last = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($last) {
            // Use PHP time for comparison to avoid DB timezone mismatch
            $lastTime = strtotime($last['created_at']);
            $secondsSince = time() - $lastTime;
            if ($secondsSince < self::OTP_COOLDOWN_SECONDS) {
                return false;
            }
        }
        return true;
    }

    public static function storeOTP($db, $userId, $purpose, $otpRaw) {
        // 1. Invalidate Old OTPs (Strict Security)
        $db->prepare("DELETE FROM auth_otps WHERE user_id = ? AND purpose = ?")->execute([$userId, $purpose]);

        // Hash OTP for security
        $otpHash = password_hash($otpRaw, PASSWORD_DEFAULT);
        $expires = date('Y-m-d H:i:s', strtotime('+' . self::OTP_EXPIRY_MINUTES . ' minutes'));
        $now = date('Y-m-d H:i:s'); // Explicit PHP time for created_at

        $stmt = $db->prepare("INSERT INTO auth_otps (user_id, purpose, otp_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $purpose, $otpHash, $expires, $now]);
    }

    public static function verifyOTP($db, $userId, $purpose, $otpInput) {
        // Use PHP time to avoid MySQL timezone mismatches
        $now = date('Y-m-d H:i:s');

        $stmt = $db->prepare("SELECT id, otp_hash, expires_at, attempts FROM auth_otps WHERE user_id = ? AND purpose = ? AND expires_at > ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$userId, $purpose, $now]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$record) return ['ok' => false, 'error' => 'OTP expired or not found.'];
        if ($record['attempts'] >= 5) return ['ok' => false, 'error' => 'Too many failed attempts. Request a new code.']; // Spec: Max 5 attempts

        if (password_verify((string)$otpInput, $record['otp_hash'])) {
            // Success: Delete used OTP
            $db->prepare("DELETE FROM auth_otps WHERE id = ?")->execute([$record['id']]);
            return ['ok' => true];
        } else {
            // Increment attempts
            $db->prepare("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?")->execute([$record['id']]);
            return ['ok' => false, 'error' => 'Invalid code.'];
        }
    }

    public static function sendEmail($to, $subject, $body) {
        // 1. SIMULATION LOGGING (Default for Localhost)
        // This saves the OTP to a file named 'otp_debug.txt' in this same folder.
        // Open this file to see your codes.
        $debugFile = __DIR__ . '/otp_debug.txt';
        file_put_contents($debugFile, date('Y-m-d H:i:s') . " - To: $to | $body" . PHP_EOL, FILE_APPEND);
        
        // Also log to XAMPP error log
        error_log(" [EMAIL SIMULATION] To: $to | Subject: $subject | Body: $body ");

        // 2. REAL GMAIL SENDING (Optional - Requires PHPMailer)
        // To use this:
        // 1. Install PHPMailer via Composer or download it.
        // 2. Get a Google App Password (https://myaccount.google.com/apppasswords)
        // 3. Uncomment the lines below and fill in your details.
        
        try {
            $mail = new PHPMailer(true);
            // Uncomment the next line to see detailed error messages in your XAMPP logs if email fails
            $mail->SMTPDebug = 2; $mail->Debugoutput = 'error_log'; // Enabled for debugging

            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            
            // FIX: Bypass SSL certificate checks for Localhost/XAMPP
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
            
            // SENDER SETTINGS (This is the account SENDING the email)
            $mail->Username = 'energo.noreply@gmail.com'; 
            $mail->Password = 'ljtnxczhqeanwkdq'; // Your App Password (No spaces)
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;
            $mail->setFrom('energo.noreply@gmail.com', 'EnerGo');
            
            // RECIPIENT (This sends to the user's input email)
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            
            // Create a nice HTML Email Template
            $otpCode = preg_replace('/[^0-9]/', '', $body); // Extract just the numbers
            $mail->Body = "
                <div style='font-family: sans-serif; padding: 20px; background: #f3f4f6; text-align: center;'>
                    <div style='background: white; padding: 30px; border-radius: 15px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'>
                        <h2 style='color: #1e293b; margin-top: 0;'>Energo Verification</h2>
                        <p style='color: #64748b; font-size: 14px;'>Your Energo verification code is:</p>
                        <div style='font-size: 36px; font-weight: 900; color: #2563eb; letter-spacing: 4px; margin: 20px 0;'>$otpCode</div>
                        <p style='color: #94a3b8; font-size: 12px;'>This code expires in 10 minutes.</p>
                    </div>
                </div>";
            $mail->AltBody = "Your Energo verification code is: $otpCode\nThis code expires in 10 minutes.";
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Mail Error: " . $mail->ErrorInfo);
            return false;
        }
    }
}
?>