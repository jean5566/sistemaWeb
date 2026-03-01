<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = null;
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $user = authenticate();
}

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit();
    }

    $tenantId = $user['tenant_id'] ?? 1;
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, role, created_at FROM users WHERE tenant_id = ? ORDER BY id DESC");
        $stmt->execute([$tenantId]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
        exit();
    } catch (PDOException $e) {
        api_error('Error al obtener usuarios', $e);
    }
}

if ($method === 'DELETE') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit();
    }

    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit();
    }

    // Prevent deleting self? (Optional but good)
    if ($id == $user['id']) {
        http_response_code(400);
        echo json_encode(['error' => 'No puedes eliminarte a ti mismo']);
        exit();
    }

    $tenantId = $user['tenant_id'] ?? 1;
    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tenantId]);
        echo json_encode(['success' => true, 'message' => 'Usuario eliminado correctamente']);
        exit();
    } catch (PDOException $e) {
        api_error('Error al eliminar usuario', $e);
    }
}

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

$tenantId = $user['tenant_id'] ?? 1;
try {
    // 1. Verify User and Current Password (scoped to own tenant)
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND tenant_id = ?");
    $stmt->execute([$data['id'], $tenantId]);
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
    if (isset($data['email']) && !empty(trim($data['email']))) {
        $newEmail = trim($data['email']);
        if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'El correo electrónico no es válido']);
            exit();
        }
        // Check email not taken by another user in the same tenant
        $emailCheck = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ? AND tenant_id = ?");
        $emailCheck->execute([$newEmail, $data['id'], $tenantId]);
        if ($emailCheck->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Ese correo ya está en uso por otro usuario']);
            exit();
        }
        $fields[] = "email = :email";
        $params[':email'] = $newEmail;
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
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id AND tenant_id = :tenant_id";
    $params[':tenant_id'] = $tenantId;

    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);

    // 3. Return Updated User (sans password)
    $fetchStmt = $pdo->prepare("SELECT id, name, email, role, tenant_id, created_at FROM users WHERE id = ? AND tenant_id = ?");
    $fetchStmt->execute([$data['id'], $tenantId]);
    $updatedUser = $fetchStmt->fetch();

    echo json_encode([
        'success' => true,
        'message' => 'Perfil actualizado correctamente',
        'user' => $updatedUser
    ]);

} catch (PDOException $e) {
    api_error('Error al actualizar usuario', $e);
}