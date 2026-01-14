<?php
class BatteryService {
    // Rule: Battery percentage inputs must be between 0 and 100 [cite: 325]
    public function validatePercentage($percentage) {
        return $percentage >= 0 && $percentage <= 100;
    }

    // Rule: Convert percentage to energy using the active EV's capacity [cite: 326]
    public function calculateKWh($percentage, $totalCapacityKWh) {
        if (!$this->validatePercentage($percentage)) return 0;
        return ($percentage / 100) * $totalCapacityKWh;
    }

    // Rule: Energy consumption must consider vehicle efficiency (Wh/km) and distance [cite: 327, 328, 329]
    public function calculateTripEnergyNeeded($distanceKm, $efficiencyWhKm) {
        $totalWh = $distanceKm * $efficiencyWhKm;
        return $totalWh / 1000; // Convert to kWh
    }
}