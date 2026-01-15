<?php
class WeatherService {
    // Rule: Weather impact must be reproducible using stored snapshots [cite: 344]
    public function getImpactFactor($snapshotData) {
        $temp = $snapshotData['temperature'];
        $wind = $snapshotData['wind_speed'] ?? 0;

        $factor = 1.0;
        if ($temp < 10) $factor += 0.20; // Cold weather rule [cite: 198]
        if ($wind > 20) $factor += 0.05; // Wind resistance rule [cite: 199]
        
        return $factor;
    }
}