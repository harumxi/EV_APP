<?php
class SustainabilityService {
    // Rule: Sustainability metrics calculated from completed trips only [cite: 366]
    public function calculateSavings($completedTripData) {
        $distance = $completedTripData['total_distance'];
        $iceEmissionFactor = 2.3; // Standard conversion factor [cite: 368]
        
        $co2Saved = $distance * $iceEmissionFactor;
        
        return [
            'co2_reduction_kg' => round($co2Saved, 2), // [cite: 280]
            'energy_saved_kwh' => $completedTripData['energy_saved'], // [cite: 279]
        ];
    }
}