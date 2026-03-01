<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// --- Rate Limiting (same window as login) ---
const REG_MAX_ATTEMPTS = 5;
const REG_WINDOW_SECS  = 900; // 15 minutes

$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ip = trim(explode(',', $ip)[0]);

try {
    $pdo->prepare("DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL :secs SECOND")
        ->execute([':secs' => REG_WINDOW_SECS]);

    $countStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM login_attempts WHERE ip = :ip AND attempted_at >= NOW() - INTERVAL :secs SECOND"
    );
    $countStmt->execute([':ip' => $ip, ':secs' => REG_WINDOW_SECS]);
    $regAttempts = (int) $countStmt->fetchColumn();

    if ($regAttempts >= REG_MAX_ATTEMPTS) {
        http_response_code(429);
        echo json_encode(['error' => 'Demasiadas solicitudes. Intente nuevamente en 15 minutos.']);
        exit();
    }
} catch (PDOException $e) {
    error_log('[REG RATE LIMIT ERROR] ' . $e->getMessage());
}
// --- End Rate Limiting ---

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit();
}

$email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato de email inválido']);
    exit();
}
$password = $data['password'];

try {
    // Check if system is already initialized (has users)
    $stmtCount = $pdo->query("SELECT COUNT(*) FROM users");
    $userCount = $stmtCount->fetchColumn();

    if ($userCount > 0) {
        // System initialized: Public registration is closed
        // Allow authenticated admins to add users
        require_once 'auth_middleware.php';
        $currentUser = authenticate();

        if ($currentUser['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Registration is closed. Only administrators can add new users.']);
            exit();
        }
    }

    // Check if user already exists (redundant if count is 0 but good for safety if logic changes)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'User already exists']);
        exit();
    }

    // Process Registration
    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    // Default role logic
    $role = 'admin';
    if ($userCount > 0) {
        // If system is already initialized, new users are cashiers by default 
        // unless specified otherwise (and the registrar is an admin)
        $role = (isset($data['role']) && in_array($data['role'], ['admin', 'cashier'])) ? $data['role'] : 'cashier';
    }

    // Optional: Check if it's the first user to make them admin, others cashier
    // $stmtCount = $pdo->query("SELECT COUNT(*) FROM users");
    // $count = $stmtCount->fetchColumn();
    // $role = ($count == 0) ? 'admin' : 'cashier';

    // Determine tenant: first user gets tenant 1, subsequent users inherit admin's tenant
    $tenantId = 1;
    if ($userCount > 0 && isset($currentUser)) {
        $tenantId = $currentUser['tenant_id'] ?? 1;
    }

    $stmt = $pdo->prepare("INSERT INTO users (tenant_id, email, password_hash, role, name) VALUES (:tenant_id, :email, :hash, :role, :name)");
    $stmt->execute([
        ':tenant_id' => $tenantId,
        ':email' => $email,
        ':hash' => $password_hash,
        ':role' => $role,
        ':name' => isset($data['name']) ? trim($data['name']) : explode('@', $email)[0]
    ]);

    $userId = $pdo->lastInsertId();

    // Generate JWT (Same logic as login)
    require_once 'SimpleJWT.php';
    $token = SimpleJWT::encode([
        'id'        => $userId,
        'email'     => $email,
        'role'      => $role,
        'tenant_id' => $tenantId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'user' => [
            'id'        => $userId,
            'email'     => $email,
            'role'      => $role,
            'tenant_id' => $tenantId,
            'name'      => isset($data['name']) ? trim($data['name']) : explode('@', $email)[0]
        ],
        'token' => $token
    ]);

} catch (PDOException $e) {
    api_error('Error al registrar usuario', $e);
}
