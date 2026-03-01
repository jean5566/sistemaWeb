<?php
// Remove closing tag to prevent whitespace issues
require_once 'cors.php';
require_once 'SimpleJWT.php';
require_once 'config.php';

function authenticate()
{
    global $pdo;

    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = SimpleJWT::decode($token);

        if ($payload) {
            // Check token blacklist (revoked tokens from logout)
            if (isset($payload['jti'])) {
                try {
                    $stmt = $pdo->prepare("SELECT id FROM token_blacklist WHERE jti = :jti LIMIT 1");
                    $stmt->execute([':jti' => $payload['jti']]);
                    if ($stmt->fetch()) {
                        http_response_code(401);
                        echo json_encode(['error' => 'Unauthorized', 'message' => 'Token revocado. Inicia sesión nuevamente.']);
                        exit();
                    }
                } catch (PDOException $e) {
                    error_log('[BLACKLIST CHECK ERROR] ' . $e->getMessage());
                    // If blacklist check fails, log but allow through to avoid locking out users
                }
            }
            return $payload;
        }
    }

    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized', 'message' => 'Valid token required']);
    exit();
}

function require_auth()
{
    $payload = authenticate();
    if (!isset($payload['tenant_id'])) {
        $payload['tenant_id'] = 1;
    }
    return $payload;
}

function require_admin($caller)
{
    if (!$caller || ($caller['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden', 'message' => 'Se requieren permisos de administrador']);
        exit();
    }
}