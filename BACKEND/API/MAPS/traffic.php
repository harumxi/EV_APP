<?php
require_once __DIR__ . '/../../core/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  Response::error('Method not allowed', 405);
}

$distance = isset($_GET['distance_km']) ? (float)$_GET['distance_km'] : 0;
$duration = isset($_GET['duration_min']) ? (float)$_GET['duration_min'] : 0;

if ($distance <= 0 || $duration <= 0) {
  Response::error('distance_km and duration_min required', 400);
}

$speed = $distance / ($duration / 60.0);

if ($speed >= 35) $level = 'low';
elseif ($speed >= 20) $level = 'medium';
else $level = 'high';

Response::ok([
  'avg_speed_kph' => round($speed, 2),
  'traffic_level' => $level
]);
