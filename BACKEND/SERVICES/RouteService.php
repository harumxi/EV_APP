<?php
class RouteService {
    // Rule: The recommended route is selected based on minimum energy consumption 
    public function getRecommendedRoute($routes) {
        if (empty($routes)) return null;

        usort($routes, function($a, $b) {
            return $a['predicted_energy_usage'] <=> $b['predicted_energy_usage'];
        });

        return $routes[0]; // Returns the most energy-efficient route 
    }
}