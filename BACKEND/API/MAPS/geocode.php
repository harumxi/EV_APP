<?php
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/HttpClient.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  Response::error('Method not allowed', 405);
}

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if ($q === '') {
  Response::error('q is required', 400);
}

try {
  $cfg = require __DIR__ . '/../../config/maps.php';

  // Nominatim search (Philippines bias)
  $url = $cfg['geocode']['base_url'] . '/search?format=jsonv2'
      . '&q=' . urlencode($q . ', Philippines')
      . '&limit=5';

  $data = HttpClient::getJson($url, [
    // Nominatim requires a User-Agent
    'User-Agent: WEBPROG_PROJ/1.0 (local dev)'
  ]);

  $results = [];
  foreach ($data as $item) {
    $results[] = [
      'name' => $item['display_name'] ?? null,
      'lat'  => isset($item['lat']) ? (float)$item['lat'] : null,
      'lng'  => isset($item['lon']) ? (float)$item['lon'] : null,
    ];
  }

  Response::ok(['results' => $results]);

} catch (Throwable $e) {
  Response::error($e->getMessage(), 500);
}
