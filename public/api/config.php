<?php
// Remove closing tag to prevent whitespace issues

// Production: never show PHP errors to the browser
error_reporting(0);
ini_set('display_errors', 0);

// Load Composer dependencies
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../vendor/autoload.php';
}

/**
 * Log the real error server-side and return a safe JSON response.
 * In cPanel you can see these in: Logs > Error Log
 */
function api_error(string $publicMessage, Throwable $e = null, int $code = 500): void
{
    if ($e !== null) {
        error_log('[API ERROR] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    }
    http_response_code($code);
    echo json_encode(['error' => $publicMessage]);
    exit();
}

function loadEnv($path)
{
    // If DB_HOST is already set in the environment (e.g. via Docker), 
    // we don't want to overwrite it with values from .env
    if (getenv('DB_HOST')) {
        return;
    }

    if (!file_exists($path)) {
        // Try looking one level up just in case
        $altPath = __DIR__ . '/../../../.env';
        if (file_exists($altPath)) {
            $path = $altPath;
        } else {
            return;
        }
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0)
            continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $name = trim($parts[0]);
            $value = trim($parts[1]);
            // Only set if not already in system environment
            if (!getenv($name)) {
                putenv("$name=$value");
                $_ENV[$name] = $value;
            }
        }
    }
}

// Ensure error reporting is off for production, but can be useful for debugging
// error_reporting(0); 
// ini_set('display_errors', 0);

loadEnv(__DIR__ . '/../../.env');

$host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
$db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'pos_ferreteria';
$username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
$password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';

try {
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, $username, $password, $options);

    // Set Timezone to UTC-5 (America/Bogota, Lima, Guayaquil)
    date_default_timezone_set('America/Bogota');
    $pdo->exec("SET time_zone = '-05:00'");
} catch (PDOException $e) {
    header('Content-Type: application/json');
    error_log('[DB CONNECTION] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo conectar a la base de datos']);
    exit();
}