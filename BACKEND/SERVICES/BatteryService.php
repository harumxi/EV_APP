<?php
class BatteryService {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getActiveCar(int $userId): ?array {
        $stmt = $this->db->prepare("
            SELECT g.garage_id, g.nickname,
                   v.battery_capacity_kwh, v.efficiency_wh_per_km
            FROM user_garage g
            JOIN ev_variants v ON g.variant_id = v.variant_id
            WHERE g.user_id = ? AND g.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $car = $stmt->fetch(PDO::FETCH_ASSOC);
        return $car ?: null;
    }

    public function calcUsageKm(float $distanceKm, array $car, float $startPct): array {
        $capacity = (float)$car["battery_capacity_kwh"];
        $effWhKm  = (float)$car["efficiency_wh_per_km"];

        $energyNeededKwh = ($distanceKm * $effWhKm) / 1000.0;
        $usagePct = ($energyNeededKwh / $capacity) * 100.0;
        $endPct = max(0.0, $startPct - $usagePct);

        return [
            "energy_needed_kwh" => round($energyNeededKwh, 2),
            "usage_pct" => round($usagePct, 1),
            "end_battery" => round($endPct, 1),
            "feasible" => $endPct > 0
        ];
    }
}
