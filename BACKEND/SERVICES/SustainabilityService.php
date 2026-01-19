<?php
class SustainabilityService {
    public function calculateTripSavings($distanceKm, $evEfficiencyWhKm) {
        // Average Gas Car: 120g CO2 per km
        // EV: Efficiency * local grid emission (approx 40g per km)
        $gasEmissions = $distanceKm * 120; 
        $evEmissions = $distanceKm * 40; 

        return [
            'co2_saved_kg' => round(($gasEmissions - $evEmissions) / 1000, 2),
            'trees_equivalent' => round(($gasEmissions - $evEmissions) / 20000, 4),
            'gas_money_saved' => round($distanceKm * 5.50, 2) // Approx 5.50 pesos per km
        ];
    }
}
?>