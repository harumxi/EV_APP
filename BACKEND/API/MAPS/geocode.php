<?php
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/HttpClient.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  Response::error('Method not allowed', 405);
}

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if ($q === '') Response::error('q is required', 400);

try {
  $cfg = require __DIR__ . '/../../config/maps.php';

  $url = $cfg['ors']['base_url'] . '/geocode/search'
       . '?text=' . urlencode($q)
       . '&boundary.country=PH';

  $data = HttpClient::getJson($url, [
    'Authorization: ' . $cfg['ors']['api_key'],
    'Accept: application/json'
  ]);

  $results = [];
  foreach (($data['features'] ?? []) as $f) {
    $coords = $f['geometry']['coordinates'] ?? [null, null]; // [lng, lat]
    $label  = $f['properties']['label'] ?? null;

    if ($coords[0] === null || $coords[1] === null) continue;

    $results[] = [
      'name' => $label,
      'lat' => (float)$coords[1],
      'lng' => (float)$coords[0],
    ];
  }

  Response::ok(['results' => $results]);
} catch (Throwable $e) {
  Response::error($e->getMessage(), 500);
}
