<?php
class RouteService {
    private string $orsKey;

    public function __construct(array $keys) {
        $this->orsKey = $keys["ors"]["api_key"];
    }

    private function parseLatLng(string $text): ?array {
        $text = trim($text);
        if (!preg_match('/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/', $text, $m)) return null;
        $lat = (float)$m[1];
        $lng = (float)$m[2];
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) return null;
        return ["lat" => $lat, "lng" => $lng, "label" => "GPS Coordinates", "confidence" => 1.0];
    }

    private function httpGetJson(string $url, array $headers = []): ?array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => $headers
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($resp === false || $code < 200 || $code >= 300) return null;
        $json = json_decode($resp, true);
        return is_array($json) ? $json : null;
    }

    // ✅ Main: typed text -> best coords (with origin bias + PH boundary)
    public function geocode(string $query, ?float $biasLat = null, ?float $biasLng = null): ?array {
        // GPS fast path
        $gps = $this->parseLatLng($query);
        if ($gps) return $gps;

        $base = "https://api.openrouteservice.org/geocode/search";
        $url = $base
            . "?api_key=" . urlencode($this->orsKey)
            . "&text=" . urlencode($query)
            . "&boundary.country=PH"
            . "&layers=venue,address,street"
            . "&size=10";

        if ($biasLat !== null && $biasLng !== null) {
            $url .= "&focus.point.lat=" . $biasLat . "&focus.point.lon=" . $biasLng;
        }

        $data = $this->httpGetJson($url);
        if (!$data || empty($data["features"])) return null;

        $cleanQ = strtolower(preg_replace('/[^a-zA-Z0-9 ]/', ' ', $query));
        $cleanQ = preg_replace('/\s+/', ' ', trim($cleanQ));
        $words = array_values(array_filter(explode(' ', $cleanQ)));

        // Context rules for PH common ambiguous places (Fairview vs Dasma etc.)
        $mustHave = [];
        $reject = [];

        if (strpos($cleanQ, "fairview") !== false) {
            $mustHave = ["fairview", "quezon", "qc", "novaliches", "lagro", "metro manila"];
            $reject = ["cavite", "dasmari", "imus", "bacoor", "general trias", "gen tri"];
        }

        $best = null;
        $bestScore = -1e9;

        foreach ($data["features"] as $f) {
            $p = $f["properties"] ?? [];
            $label = strtolower($p["label"] ?? "");
            $name  = strtolower($p["name"] ?? "");
            $layer = strtolower($p["layer"] ?? "");
            $conf  = (float)($p["confidence"] ?? 0);

            $score = $conf * 10;

            foreach ($reject as $bad) {
                if (strpos($label, $bad) !== false) $score -= 1000;
            }

            if (!empty($mustHave)) {
                $ok = false;
                foreach ($mustHave as $need) {
                    if (strpos($label, $need) !== false) { $ok = true; break; }
                }
                if (!$ok) $score -= 300;
            }

            foreach ($words as $w) {
                if (strlen($w) < 3) continue;
                if (strpos($label, $w) !== false) $score += 8;
                else $score -= 1;
            }

            if ($cleanQ && strpos($label, $cleanQ) !== false) $score += 25;
            if ($cleanQ && strpos($name, $cleanQ) !== false)  $score += 25;
            if ($layer === "venue") $score += 10;

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = [
                    "lng" => (float)$f["geometry"]["coordinates"][0],
                    "lat" => (float)$f["geometry"]["coordinates"][1],
                    "label" => $p["label"] ?? "Unknown",
                    "confidence" => $conf
                ];
            }
        }

        return $best;
    }

    public function directions(array $origin, array $dest): ?array {
        $url = "https://api.openrouteservice.org/v2/directions/driving-car";

        $body = json_encode([
            "coordinates" => [
                [$origin["lng"], $origin["lat"]],
                [$dest["lng"], $dest["lat"]]
            ],
            "alternative_routes" => ["target_count" => 2],
            "units" => "km"
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json",
                "Authorization: " . $this->orsKey
            ]
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($resp === false || $code !== 200) return null;

        $json = json_decode($resp, true);
        if (!isset($json["routes"])) return null;

        return $json;
    }
}
