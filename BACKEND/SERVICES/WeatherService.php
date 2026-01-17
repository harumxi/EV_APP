<?php
class WeatherService {
    
    // Open-Meteo is free and needs no key!
    private $baseUrl = "https://api.open-meteo.com/v1/forecast";

    public function getWeather($lat, $lng) {
        // We request current weather: temperature and weathercode
        $url = $this->baseUrl . "?latitude=" . $lat . "&longitude=" . $lng . "&current_weather=true";

        // Fetch data
        $response = @file_get_contents($url);
        
        if (!$response) {
            // Fallback if API fails
            return [
                'temp' => '--',
                'condition' => 'Unknown',
                'icon' => '❓'
            ];
        }

        $data = json_decode($response, true);
        $current = $data['current_weather'] ?? null;

        if (!$current) return null;

        // Interpret WMO Weather Codes
        $code = $current['weathercode'];
        $condition = $this->getConditionText($code);
        
        return [
            'temp' => round($current['temperature']),
            'condition' => $condition['text'],
            'icon' => $condition['icon']
        ];
    }

    // Helper: Convert WMO codes to human text/icons
    private function getConditionText($code) {
        // 0: Clear sky
        if ($code === 0) return ['text' => 'Clear Sky', 'icon' => '☀️'];
        
        // 1, 2, 3: Mainly clear, partly cloudy, and overcast
        if ($code <= 3) return ['text' => 'Partly Cloudy', 'icon' => '⛅'];
        
        // 45, 48: Fog
        if ($code <= 48) return ['text' => 'Foggy', 'icon' => '🌫️'];
        
        // 51-67: Drizzle / Rain
        if ($code <= 67) return ['text' => 'Rainy', 'icon' => '🌧️'];
        
        // 71-77: Snow
        if ($code <= 77) return ['text' => 'Snow', 'icon' => '❄️'];
        
        // 80-82: Rain showers
        if ($code <= 82) return ['text' => 'Showers', 'icon' => '🌦️'];
        
        // 95-99: Thunderstorm
        if ($code <= 99) return ['text' => 'Thunderstorm', 'icon' => '⚡'];

        return ['text' => 'Unknown', 'icon' => '🌡️'];
    }
}
?>