<?php
// Remove closing tag to prevent whitespace issues

// Load .env if not already loaded (cors.php can be included before config.php)
if (!function_exists('loadEnv')) {
    $envPath = __DIR__ . '/../../.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $name = trim($parts[0]);
                $value = trim($parts[1]);
                if (!getenv($name)) {
                    putenv("$name=$value");
                    $_ENV[$name] = $value;
                }
            }
        }
    }
}

$allowedOriginsRaw = $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?: 'https://www.pernosycauchosjm.com';
$allowedOrigins = array_map('trim', explode(',', $allowedOriginsRaw));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Vary: Origin");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}