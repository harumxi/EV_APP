<?php
// BACKEND/api/TRIPS/calculate.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); echo json_encode(["ok"=>true]); exit; }

require_once __DIR__ . "/../../CORE/Database.php";
require_once __DIR__ . "/../../services/RouteService.php";
require_once __DIR__ . "/../../services/BatteryService.php";

$keys = require __DIR__ . "/../../CONFIG/api_keys.php";

function fail($msg, $code=400, $extra=[]) {
    http_response_code($code);
    echo json_encode(array_merge(["ok"=>false,"error"=>$msg], $extra));
    exit;
}

try {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) fail("Invalid JSON");

    $userId = (int)($input["user_id"] ?? 0);
    $originText = trim((string)($input["origin"] ?? ""));
    $destText   = trim((string)($input["destination"] ?? ""));
    $startPct   = (float)($input["battery_percent"] ?? 0);

    if ($userId <= 0) fail("Missing user_id");
    if ($originText === "" || $destText === "") fail("Origin and destination required");
    if ($startPct <= 0 || $startPct > 100) fail("battery_percent must be 1-100");

    $db = Database::conn();
    $battery = new BatteryService($db);
    $car = $battery->getActiveCar($userId);
    if (!$car) fail("No active EV found. Select an active vehicle in Garage.");

    $routeService = new RouteService($keys);

    // 1) Geocode origin first (no bias)
    $origin = $routeService->geocode($originText);
    if (!$origin) fail("Could not find origin. Try adding city/province.");

    // 2) Geocode destination with origin bias
    $dest = $routeService->geocode($destText, (float)$origin["lat"], (float)$origin["lng"]);
    if (!$dest) fail("Could not find destination. Try adding 'Quezon City' etc.");

    // 3) Directions
    $dir = $routeService->directions($origin, $dest);
    if (!$dir || empty($dir["routes"])) fail("No drivable route found.", 502);

    // 4) Build route options + battery results
    $routesOut = [];
    foreach ($dir["routes"] as $idx => $r) {
        $sum = $r["summary"];
        $distanceKm = (float)$sum["distance"];
        $durationMin = round(((float)$sum["duration"]) / 60, 0);

        $usage = $battery->calcUsageKm($distanceKm, $car, $startPct);

        $routesOut[] = [
            "id" => $idx,
            "distance_km" => round($distanceKm, 1),
            "duration_min" => (int)$durationMin,
            "geometry" => $r["geometry"] ?? null,
            "est_usage" => $usage["usage_pct"],
            "end_battery" => $usage["end_battery"],
            "energy_needed_kwh" => $usage["energy_needed_kwh"],
            "feasible" => $usage["feasible"]
        ];
    }

    // Sort by least usage (best)
    usort($routesOut, fn($a,$b) => $a["est_usage"] <=> $b["est_usage"]);
    if (!empty($routesOut)) $routesOut[0]["recommended"] = true;

    echo json_encode([
        "ok" => true,
        "car" => $car["nickname"] ?: "Active Vehicle",
        "origin_label" => $origin["label"],
        "destination_label" => $dest["label"],
        "origin_coords" => ["lat"=>$origin["lat"], "lng"=>$origin["lng"]],
        "destination_coords" => ["lat"=>$dest["lat"], "lng"=>$dest["lng"]],
        "routes" => $routesOut
    ]);

} catch (Throwable $e) {
    fail("Server Error: " . $e->getMessage(), 500);
}
