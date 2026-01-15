<?php
class ChargingService {
    // Filters charging stations to find those that are free or nearby 
    public function filterStations($stations, $onlyFree = false) {
        if ($onlyFree) {
            return array_filter($stations, fn($s) => $s['is_free'] === true);
        }
        return $stations;
    }
}