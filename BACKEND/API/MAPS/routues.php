<?php
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/HttpClient.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  Response::error('Method not allowed', 405);
}

$olat = isset($_GET['origin_lat']) ? (float)$_GET['origin_lat'] : null;
$olng = isset($_GET['origin_lng']) ? (float)$_GET['origin_lng'] : null;
$dlat = isset($_GET['dest_lat']) ? (float)$_GET['dest_lat'] : null;
$dlng = isset($_GET['dest_lng']) ? (float)$_GET['dest_lng'] : null;

if ($olat === null || $olng === null || $dlat === null || $dlng === null) {
  Response::error('origin_lat, origin_lng, dest_lat, dest_lng required', 400);
}

try {
  $cfg = require __DIR__ . '/../../config/maps.php';

  $url = $cfg['ors']['base_url']
       . '/v2/directions/' . $cfg['ors']['default_profile'] . '/geojson';

  $body = [
    'coordinates' => [
      [$olng, $olat],
      [$dlng, $dlat],
    ]
  ];

  $data = HttpClient::postJson($url, $body, [
    'Authorization: ' . $cfg['ors']['api_key'],
    'Accept: application/geo+json'
  ]);

  $routes = [];
  foreach (($data['features'] ?? []) as $r) {
    $sum = $r['properties']['summary'] ?? null;
    if (!is_array($sum)) continue;

    $routes[] = [
      'distance_km' => isset($sum['distance']) ? round(((float)$sum['distance']) / 1000, 2) : null,
      'duration_min' => isset($sum['duration']) ? (int)round(((float)$sum['duration']) / 60) : null,
      'geometry' => $r['geometry'] ?? null
    ];
  }

  Response::ok(['routes' => $routes]);
} catch (Throwable $e) {
  Response::error($e->getMessage(), 500);
}
