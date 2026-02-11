<?php
class SimpleJWT
{
    // Secret key should be loaded from env in production
    private static $secret_key = 'CHANGE_THIS_TO_A_LONG_RANDOM_STRING_IN_PRODUCTION';
    private static $algo = 'SHA256';

    public static function encode($payload)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['iat'] = time();
        $payload['exp'] = time() + (60 * 60 * 24); // 24 hours expiration

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

        $signature = hash_hmac(self::$algo, $base64UrlHeader . "." . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($jwt)
    {
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) != 3)
            return null;

        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
        $signature_provided = $tokenParts[2];

        // Check signature
        $signature = hash_hmac(self::$algo, $tokenParts[0] . "." . $tokenParts[1], self::$secret_key, true);
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