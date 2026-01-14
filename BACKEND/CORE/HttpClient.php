<?php
class HttpClient {

  public static function getJson(string $url, array $headers = [], int $timeout = 20): array {
    return self::request('GET', $url, null, $headers, $timeout);
  }

  public static function postJson(string $url, array $body, array $headers = [], int $timeout = 20): array {
    return self::request('POST', $url, $body, $headers, $timeout);
  }

  private static function request(string $method, string $url, ?array $body, array $headers, int $timeout): array {
    $ch = curl_init($url);

    if ($method === 'POST') {
      curl_setopt($ch, CURLOPT_POST, true);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
      $headers[] = 'Content-Type: application/json';
    }

    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => $timeout,
      CURLOPT_HTTPHEADER => $headers,
    ]);

    $response = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($response === false) throw new Exception($err ?: 'Unknown cURL error');
    if ($status < 200 || $status >= 300) throw new Exception("HTTP $status: $response");

    $json = json_decode($response, true);
    if (!is_array($json)) throw new Exception("Invalid JSON response");

    return $json;
  }
}
