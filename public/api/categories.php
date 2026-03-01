<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = authenticate();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getCategories($pdo, $user);
        break;
    case 'POST':
        addCategory($pdo, $user);
        break;
    case 'DELETE':
        deleteCategory($pdo, $user);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getCategories($pdo, $user)
{
    try {
        $tenantId = $user['tenant_id'] ?? 1;
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE tenant_id = :tenant_id ORDER BY name ASC");
        $stmt->execute([':tenant_id' => $tenantId]);
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        api_error('Error al obtener categorías', $e);
    }
}

function addCategory($pdo, $user)
{
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required']);
        return;
    }

    $tenantId = $user['tenant_id'] ?? 1;
    try {
        $stmt = $pdo->prepare("INSERT INTO categories (tenant_id, name) VALUES (:tenant_id, :name)");
        $stmt->execute([':tenant_id' => $tenantId, ':name' => $data['name']]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        api_error('Error en categorías', $e);
    }
}

function deleteCategory($pdo, $user)
{
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }

    $tenantId = $user['tenant_id'] ?? 1;
    try {
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tenantId]);
        echo json_encode(['message' => 'Category deleted']);
    } catch (PDOException $e) {
        api_error('Error en categorías', $e);
    }
}