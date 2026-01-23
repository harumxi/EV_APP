<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function getMailer() {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    
    // ENTER YOUR EMAIL ADDRESS HERE
    $mail->Username   = 'energo.noreply@gmail.com'; 
    $mail->Password   = 'deyzpcgbslnkyebz'; // App Password
    
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    
    $mail->setFrom($mail->Username, 'Energo Security');
    return $mail;
}
?>