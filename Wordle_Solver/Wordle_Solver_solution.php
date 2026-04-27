<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$solutionDate = $_GET['solutionDate'] ?? '';

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $solutionDate)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid date format. Expected YYYY-MM-DD.']);
  exit;
}

$url = 'https://www.nytimes.com/svc/wordle/v2/' . $solutionDate . '.json';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;
