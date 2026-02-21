<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

header('Content-Type: application/json');

$user = authenticate();

// Read SRI config from environment
$envSri = $_ENV['SRI_ENV'] ?? getenv('SRI_ENV') ?: 1;
$ruc = $_ENV['SRI_RUC'] ?? getenv('SRI_RUC');
$firmaPath = $_ENV['SRI_FIRMA_PATH'] ?? getenv('SRI_FIRMA_PATH') ?: __DIR__ . '/../../firma.p12';

// Check if signature file exists
$firmaExists = file_exists($firmaPath);

echo json_encode([
    'success' => true,
    'environment' => ($envSri == 1) ? 'PRUEBAS' : 'PRODUCCIÓN',
    'ruc' => $ruc,
    'firma_path' => $firmaPath,
    'firma_exists' => $firmaExists,
    'rimpe' => 'Negocio Popular' // Hardcoded as per current logic
]);
