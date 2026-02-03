<?php
/**
 * Get All Users with their details
 * Fetches all users from database with EV count and status
 * Status: Active = verified + activity in last 30 days
 *         Inactive = verified + no activity in last 30 days
 *         Unverified = not verified
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../CORE/Database.php';

try {
    $db = Database::conn();
    
    // Get all users with their EV count and activity status
    $sql = "
        SELECT 
            u.id,
            u.username,
            u.name,
            u.email,
            u.created_at,
            u.is_verified,
            COUNT(ug.garage_id) as evs,
            MAX(GREATEST(
                COALESCE((SELECT MAX(created_at) FROM trip_logs WHERE user_id = u.id), '2000-01-01'),
                COALESCE((SELECT MAX(recorded_at) FROM battery_logs WHERE user_id = u.id), '2000-01-01'),
                COALESCE((SELECT MAX(created_at) FROM auth_sessions WHERE user_id = u.id), '2000-01-01')
            )) as last_activity
        FROM users u
        LEFT JOIN user_garage ug ON u.id = ug.user_id
        GROUP BY u.id, u.username, u.name, u.email, u.created_at, u.is_verified
        ORDER BY u.created_at DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute();
    
    $users = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Determine status based on verification and activity
        if (!$row['is_verified']) {
            $status = 'Unverified';
        } else {
            // Check if user had activity in last 30 days
            $lastActivity = new DateTime($row['last_activity']);
            $thirtyDaysAgo = new DateTime('now', new DateTimeZone('UTC'));
            $thirtyDaysAgo->modify('-30 days');
            
            $status = ($lastActivity >= $thirtyDaysAgo) ? 'Active' : 'Inactive';
        }
        
        // Format the joined date
        $joinedDate = new DateTime($row['created_at']);
        $joined = $joinedDate->format('M d, Y');
        
        $users[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'username' => $row['username'],
            'email' => $row['email'],
            'evs' => (int)$row['evs'],
            'status' => $status,
            'joined' => $joined,
            'is_verified' => (bool)$row['is_verified'],
            'efficiency' => null,
            'saved' => null,
            'used' => null
        ];
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode($users);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch users',
        'message' => $e->getMessage()
    ]);
}
?>
