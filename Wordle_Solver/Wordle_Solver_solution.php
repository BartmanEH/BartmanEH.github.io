<?php
	//================================================================================
	// Wordle Solver: get answer (solution) for a given date in YYYY-mm-dd format
	// use PHP for cURL (JS fetch() on Wordle API doesn't work due to CORS etc.)
	//================================================================================
	header('Access-Control-Allow-Origin: *');
	header('Content-Type: application/json');

	$date = $_GET['solutionDate'] ?? '';
	if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
		http_response_code(400);
		echo json_encode(['error' => 'Invalid date format. Expected YYYY-MM-DD.']);
		exit;
	}

	$url = "https://www.nytimes.com/svc/wordle/v2/{$date}.json";
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
	curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
	curl_setopt($ch, CURLOPT_TIMEOUT, 10);
	$curlResponse = curl_exec($ch);
	http_response_code(curl_getinfo($ch, CURLINFO_HTTP_CODE));
	curl_close($ch);

	echo $curlResponse;		//Output response (already JSON — do not json_encode again)
