<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

header('Content-Type: application/json');

$user = null;
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $user = authenticate();
}

// Read SRI config from environment
$envSri     = $_ENV['SRI_ENV']        ?? getenv('SRI_ENV')        ?: 1;
$ruc        = $_ENV['SRI_RUC']        ?? getenv('SRI_RUC')        ?: '';
$firmaPath  = $_ENV['SRI_FIRMA_PATH'] ?? getenv('SRI_FIRMA_PATH') ?: '';
$firmaPass  = $_ENV['SRI_FIRMA_PASS'] ?? getenv('SRI_FIRMA_PASS') ?: '';

$firmaExists     = !empty($firmaPath) && file_exists($firmaPath);
$firmaConfigured = !empty($firmaPath);
$passConfigured  = !empty($firmaPass);
$rucConfigured   = !empty($ruc);

// Overall readiness
$listo = $firmaExists && $passConfigured && $rucConfigured;

echo json_encode([
    'success'           => true,
    'environment'       => ($envSri == 2) ? 'PRODUCCION' : 'PRUEBAS',
    'ambiente_num'      => (int)$envSri,
    'ruc'               => $ruc,
    'ruc_configured'    => $rucConfigured,
    'firma_exists'      => $firmaExists,
    'firma_configured'  => $firmaConfigured,
    'pass_configured'   => $passConfigured,
    'listo'             => $listo,
]);
