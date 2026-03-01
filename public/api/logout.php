<?php
require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$payload = require_auth();

// Add the token's unique ID (jti) to the blacklist so it can't be reused
if (isset($payload['jti']) && isset($payload['exp'])) {
    try {
        $stmt = $pdo->prepare(
            "INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (:jti, FROM_UNIXTIME(:exp))"
        );
        $stmt->execute([':jti' => $payload['jti'], ':exp' => $payload['exp']]);

        // Purge already-expired entries to keep the table small
        $pdo->exec("DELETE FROM token_blacklist WHERE expires_at < NOW()");
    } catch (PDOException $e) {
        error_log('[LOGOUT ERROR] ' . $e->getMessage());
        // Proceed with logout even if blacklisting fails
    }
}

echo json_encode(['success' => true, 'message' => 'Sesión cerrada correctamente']);
