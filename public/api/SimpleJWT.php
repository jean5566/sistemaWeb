<?php
class SimpleJWT
{
    private static $algo = 'SHA256';

    private static function getSecret(): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: '';
        if (empty($secret)) {
            error_log('[SECURITY CRITICAL] JWT_SECRET no está configurado en .env. El sistema no puede arrancar de forma segura.');
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Error de configuración del servidor']);
            exit();
        }
        if (strlen($secret) < 32) {
            error_log('[SECURITY WARNING] JWT_SECRET es demasiado corto (mínimo 32 caracteres recomendados).');
        }
        return $secret;
    }

    public static function encode($payload)
    {
        $secret = self::getSecret();
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['jti'] = bin2hex(random_bytes(16)); // Unique token ID for revocation
        $payload['iat'] = time();
        $payload['exp'] = time() + (60 * 60 * 24); // 24 hours expiration

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

        $signature = hash_hmac(self::$algo, $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($jwt)
    {
        $secret = self::getSecret();
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) != 3)
            return null;

        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
        $signature_provided = $tokenParts[2];

        // Check signature
        $signature = hash_hmac(self::$algo, $tokenParts[0] . "." . $tokenParts[1], $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if (!hash_equals($base64UrlSignature, $signature_provided)) {
            return null; // Invalid signature
        }

        $decodedPayload = json_decode($payload, true);

        // Check expiration
        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            return null; // Expired
        }

        return $decodedPayload;
    }
}
?>