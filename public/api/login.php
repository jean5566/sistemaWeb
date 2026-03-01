<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// --- Rate Limiting ---
const MAX_ATTEMPTS  = 5;   // max failed attempts
const WINDOW_SECS   = 900; // 15 minutes

$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
// Take only the first IP if there are multiple (proxy chains)
$ip = trim(explode(',', $ip)[0]);

try {
    // Clean up old attempts (keeps the table small)
    $pdo->prepare("DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL :secs SECOND")
        ->execute([':secs' => WINDOW_SECS]);

    // Count recent failed attempts from this IP
    $countStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM login_attempts WHERE ip = :ip AND attempted_at >= NOW() - INTERVAL :secs SECOND"
    );
    $countStmt->execute([':ip' => $ip, ':secs' => WINDOW_SECS]);
    $attempts = (int) $countStmt->fetchColumn();

    if ($attempts >= MAX_ATTEMPTS) {
        http_response_code(429);
        echo json_encode([
            'error' => 'Demasiados intentos fallidos. Intente nuevamente en 15 minutos.'
        ]);
        exit();
    }
} catch (PDOException $e) {
    // If rate limiting table fails, log but allow login to proceed
    error_log('[RATE LIMIT ERROR] ' . $e->getMessage());
}
// --- End Rate Limiting ---

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit();
}

$email    = $data['email'];
$password = $data['password'];

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Success — clear failed attempts for this IP
        $pdo->prepare("DELETE FROM login_attempts WHERE ip = :ip")
            ->execute([':ip' => $ip]);

        unset($user['password_hash']);

        require_once 'SimpleJWT.php';
        $token = SimpleJWT::encode([
            'id'        => $user['id'],
            'email'     => $user['email'],
            'role'      => $user['role'],
            'tenant_id' => $user['tenant_id'] ?? 1
        ]);

        echo json_encode([
            'success' => true,
            'user'    => $user,
            'token'   => $token
        ]);
    } else {
        // Failed attempt — record it
        try {
            $pdo->prepare("INSERT INTO login_attempts (ip) VALUES (:ip)")
                ->execute([':ip' => $ip]);
        } catch (PDOException $e) {
            error_log('[RATE LIMIT INSERT ERROR] ' . $e->getMessage());
        }

        $remaining = MAX_ATTEMPTS - $attempts - 1;
        http_response_code(401);
        echo json_encode([
            'error'     => 'Credenciales incorrectas',
            'attempts_left' => max(0, $remaining)
        ]);
    }
} catch (PDOException $e) {
    api_error('Error al iniciar sesión', $e);
}
