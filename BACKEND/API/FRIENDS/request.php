<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../../CORE/Database.php';
require_once __DIR__ . '/../AUTH/AuthHelper.php';

$input = json_decode(file_get_contents('php://input'), true);
$requesterId = $input['requester_id'];
$receiverId = $input['receiver_id'];

try {
    $db = Database::conn();
    
    // Check if request already exists
    $check = $db->prepare("SELECT id, status FROM friendships WHERE (requester_id=? AND receiver_id=?) OR (requester_id=? AND receiver_id=?)");
    $check->execute([$requesterId, $receiverId, $receiverId, $requesterId]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);

    $friendshipId = null;

    if($existing) {
        if($existing['status'] === 'accepted') {
             echo json_encode(['ok'=>false, 'error'=>'You are already friends.']); 
             exit; 
        }
        $friendshipId = $existing['id']; // Reuse existing ID to resend
    } else {
        $stmt = $db->prepare("INSERT INTO friendships (requester_id, receiver_id) VALUES (?, ?)");
        $stmt->execute([$requesterId, $receiverId]);
        $friendshipId = $db->lastInsertId();
    }

    // Get User Details for Email
    $uStmt = $db->prepare("SELECT name FROM users WHERE id = ?");
    $uStmt->execute([$requesterId]);
    $reqName = $uStmt->fetchColumn();
    
    $rStmt = $db->prepare("SELECT email FROM users WHERE id = ?");
    $rStmt->execute([$receiverId]);
    $recEmail = $rStmt->fetchColumn();

    $debugLink = null;
    $emailSent = false;

    // Send Email Notification
    if($recEmail && $reqName) {
        $link = "http://localhost/WEBPROG_PROJ/FRONTEND/HTML/friends_map.html?accept_invite=" . $friendshipId;
        $debugLink = $link; // Return this to frontend for testing
        
        $body = "
            <h3>New Friend Request 👥</h3>
            <p><strong>$reqName</strong> wants to share their location with you on EnerGo.</p>
            <p><a href='$link' style='background:#2563eb; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;'>Accept Request</a></p>
            <p style='font-size:12px; color:#666;'>Or click: <a href='$link'>$link</a></p>";
            
        $emailSent = AuthHelper::sendEmail($recEmail, "Friend Request from $reqName", $body);
    }

    echo json_encode(['ok'=>true, 'debug_link' => $debugLink, 'email_sent' => $emailSent, 'message' => 'Request sent.']);
} catch(Throwable $e) { echo json_encode(['ok'=>false, 'error'=>$e->getMessage()]); }
?>