<?php
class ForecastService {
    // Rule: Forecast outputs must include predicted arrival percentage and energy [cite: 333, 334, 335]
    public function predictArrival($currentKWh, $distance, $efficiencyWhKm, $weatherImpact, $totalCapacityKWh) {
        $efficiencyKWhKm = $efficiencyWhKm / 1000;
        $predictedConsumption = ($distance * $efficiencyKWhKm) * $weatherImpact; // [cite 330, 332]
        
        $arrivalKWh = max(0, $currentKWh - $predictedConsumption);
        $arrivalPercentage = ($arrivalKWh / $totalCapacityKWh) * 100;

        return [
            'arrival_kwh' => round($arrivalKWh, 2),
            'arrival_percentage' => round($arrivalPercentage, 1),
            'consumption' => round($predictedConsumption, 2)
        ];
    }
}