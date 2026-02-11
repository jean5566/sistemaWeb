<?php
// Remove closing tag to prevent whitespace issues
require_once 'cors.php';
require_once 'SimpleJWT.php';

function authenticate()
{
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = SimpleJWT::decode($token);

        if ($payload) {
            return $payload;
        }
    }

    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized', 'message' => 'Valid token required']);
    exit();
}