<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = authenticate();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// Basic validation
if (!isset($data['id']) || !isset($data['currentPassword'])) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID and Current Password are required']);
    exit();
}

try {
    // 1. Verify User and Current Password
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$data['id']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($data['currentPassword'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Contraseña actual incorrecta']);
        exit();
    }

    // 2. Build Update Query
    $fields = [];
    $params = [];

    // Update Name
    if (isset($data['name'])) {
        $fields[] = "name = :name";
        $params[':name'] = $data['name'];
    }

    // Update Email/Username
    if (isset($data['email'])) {
        $fields[] = "email = :email";
        $params[':email'] = $data['email'];
    }

    // Update Password (if provided and not empty)
    if (!empty($data['newPassword'])) {
        $fields[] = "password_hash = :hash";
        $params[':hash'] = password_hash($data['newPassword'], PASSWORD_BCRYPT);
    }

    if (empty($fields)) {
        echo json_encode(['message' => 'No changes to save']);
        exit();
    }

    $params[':id'] = $data['id'];
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";

    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);

    // 3. Return Updated User (sans password)
    $stmt->execute([$data['id']]);
    $updatedUser = $stmt->fetch();
    unset($updatedUser['password_hash']);

    echo json_encode([
        'success' => true,
        'message' => 'Perfil actualizado correctamente',
        'user' => $updatedUser
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}