<?php
class WeatherService {
    
    // Open-Meteo API (Free, No Key)
    private $baseUrl = "https://api.open-meteo.com/v1/forecast";

    public function getWeather($lat, $lng) {
        $url = $this->baseUrl . "?latitude=" . $lat . "&longitude=" . $lng . "&current_weather=true";

        // 1. USE cURL INSTEAD OF file_get_contents
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        
        // 2. TIMEOUT SETTINGS (Prevents infinite loading)
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3); // Wait only 3 seconds for connection
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);        // Wait only 5 seconds for data
        curl_setopt($ch, CURLOPT_USERAGENT, "EV_Student_Project/1.0");
        
        // 3. DISABLE SSL CHECKS (Crucial for XAMPP localhost)
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // 4. Handle Errors
        if (!$response || $httpCode >= 400) {
            return $this->fallback();
        }

        $data = json_decode($response, true);
        $current = $data['current_weather'] ?? null;

        if (!$current) return $this->fallback();

        // 5. Success! Format the data
        $code = $current['weathercode'];
        $condition = $this->getConditionText($code);
        
        return [
            'temp' => round($current['temperature']),
            'condition' => $condition['text'],
            'icon' => $condition['icon']
        ];
    }

    // Default values if API fails
    private function fallback() {
        return [
            'temp' => '--',
            'condition' => 'Offline',
            'icon' => '⚠️'
        ];
    }

    // Convert WMO codes to text/icons
    private function getConditionText($code) {
        if ($code === 0) return ['text' => 'Clear Sky', 'icon' => '☀️'];
        if ($code <= 3) return ['text' => 'Partly Cloudy', 'icon' => '⛅'];
        if ($code <= 48) return ['text' => 'Foggy', 'icon' => '🌫️'];
        if ($code <= 67) return ['text' => 'Rainy', 'icon' => '🌧️'];
        if ($code <= 77) return ['text' => 'Snow', 'icon' => '❄️'];
        if ($code <= 82) return ['text' => 'Showers', 'icon' => '🌦️'];
        if ($code <= 99) return ['text' => 'Thunderstorm', 'icon' => '⚡'];
        return ['text' => 'Unknown', 'icon' => '🌡️'];
    }
}
?>