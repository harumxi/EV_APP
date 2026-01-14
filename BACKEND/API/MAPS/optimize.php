<?php
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/HttpClient.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  Response::error('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (
  !is_array($input) ||
  !isset($input['start'], $input['stops']) ||
  !is_array($input['stops']) ||
  !isset($input['start']['lat'], $input['start']['lng'])
) {
  Response::error('start{lat,lng} and stops[] required', 400);
}

try {
  $cfg = require __DIR__ . '/../../config/maps.php';

  $jobs = [];
  foreach ($input['stops'] as $i => $s) {
    if (!is_array($s) || !isset($s['lat'], $s['lng'])) continue;

    $jobs[] = [
      'id' => $i + 1,
      'location' => [(float)$s['lng'], (float)$s['lat']]
    ];
  }

  if (count($jobs) === 0) {
    Response::error('No valid stops provided', 400);
  }

  $payload = [
    'vehicles' => [[
      'id' => 1,
      'start' => [
        (float)$input['start']['lng'],
        (float)$input['start']['lat']
      ]
    ]],
    'jobs' => $jobs
  ];

  $data = HttpClient::postJson(
    $cfg['ors']['base_url'] . '/optimization',
    $payload,
    [
      'Authorization: ' . $cfg['ors']['api_key'],
      'Accept: application/json'
    ]
  );

  Response::ok(['result' => $data]);
} catch (Throwable $e) {
  Response::error($e->getMessage(), 500);
}
