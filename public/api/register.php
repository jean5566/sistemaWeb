<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit();
}

$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
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

    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, role, name) VALUES (:email, :hash, :role, :name)");
    $stmt->execute([
        ':email' => $email,
        ':hash' => $password_hash,
        ':role' => $role,
        ':name' => explode('@', $email)[0] // Default name from email
    ]);

    $userId = $pdo->lastInsertId();

    // Generate JWT (Same logic as login)
    require_once 'SimpleJWT.php';
    $token = SimpleJWT::encode([
        'id' => $userId,
        'email' => $email,
        'role' => $role
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'user' => [
            'id' => $userId,
            'email' => $email,
            'role' => $role,
            'name' => explode('@', $email)[0]
        ],
        'token' => $token
    ]);

} catch (PDOException $e) {
    api_error('Error al registrar usuario', $e);
}
