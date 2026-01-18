<?php
// FORCE DISPLAY ERRORS
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: text/html");

// 1. Connect
$possiblePaths = [
    __DIR__ . '/../../../CORE/Database.php',
    __DIR__ . '/../../CORE/Database.php'
];
$dbPath = null;
foreach ($possiblePaths as $path) { if (file_exists($path)) { $dbPath = $path; break; } }
require_once $dbPath;
$db = Database::conn();

echo "<h1>🕵️ Garage Detective</h1>";

// 2. CHECK ALL USERS
echo "<h3>1. Who is in the database?</h3>";
$stmt = $db->query("SELECT * FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
if(!$users) echo "No users found.<br>";
else {
    echo "<table border='1'><tr><th>ID</th><th>Email</th></tr>";
    foreach($users as $u) echo "<tr><td>{$u['user_id']}</td><td>{$u['email']}</td></tr>";
    echo "</table>";
}

// 3. CHECK ALL CARS (Raw)
echo "<h3>2. What cars are in the Garage Table? (Raw Data)</h3>";
$stmt = $db->query("SELECT * FROM user_garage");
$cars = $stmt->fetchAll(PDO::FETCH_ASSOC);

if(!$cars) {
    echo "<h2 style='color:red'>THE GARAGE TABLE IS EMPTY!</h2>";
} else {
    echo "<table border='1'><tr><th>Garage ID</th><th>User ID</th><th>Variant ID</th><th>Nickname</th></tr>";
    foreach($cars as $c) {
        echo "<tr>
                <td>{$c['garage_id']}</td>
                <td style='color:blue; font-weight:bold;'>{$c['user_id']}</td>
                <td>{$c['variant_id']}</td>
                <td>{$c['nickname']}</td>
              </tr>";
    }
    echo "</table>";
}

// 4. CHECK VARIANTS
echo "<h3>3. EV Variants Table</h3>";
$stmt = $db->query("SELECT variant_id, make, model FROM ev_variants LIMIT 5");
$vars = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "<pre>" . json_encode($vars, JSON_PRETTY_PRINT) . "</pre>";

?>