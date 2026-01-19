<?php
class ChargingService {
    public function calculateChargeTime($currentBatt, $targetBatt, $carCapacity, $chargerKW) {
        $energyNeeded = (($targetBatt - $currentBatt) / 100) * $carCapacity;
        
        // Time = Energy / Power (adding 10% for charging curve slowdown)
        $hours = ($energyNeeded / $chargerKW) * 1.1;
        
        return [
            'hours' => floor($hours),
            'minutes' => round(($hours - floor($hours)) * 60),
            'energy_added_kwh' => $energyNeeded
        ];
    }
}
?>