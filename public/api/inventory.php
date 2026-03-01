<?php
// Remove closing tag to prevent whitespace issues
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = null;
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $user = authenticate();
}
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getProducts($pdo, $user);
        break;
    case 'POST':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin access required']);
            exit();
        }
        addProduct($pdo, $user);
        break;
    case 'PUT':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin access required']);
            exit();
        }
        updateProduct($pdo, $user);
        break;
    case 'DELETE':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin access required']);
            exit();
        }
        deleteProduct($pdo, $user);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getProducts($pdo, $user)
{
    try {
        $tenantId = $user['tenant_id'] ?? 1;
        $limit = max(1, min(2000, (int)($_GET['limit'] ?? 2000)));
        $stmt  = $pdo->prepare("SELECT * FROM products WHERE tenant_id = :tenant_id ORDER BY name ASC LIMIT :limit");
        $stmt->bindValue(':tenant_id', $tenantId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        api_error('Error al obtener productos', $e);
    }
}

function addProduct($pdo, $user)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['name']) || !isset($data['price'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    $tenantId = $user['tenant_id'] ?? 1;
    $sql = "INSERT INTO products (tenant_id, name, price, stock, min_stock, category, code, category_id, image_path) VALUES (:tenant_id, :name, :price, :stock, :min_stock, :category, :code, :category_id, :image_path)";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':tenant_id'  => $tenantId,
            ':name'       => $data['name'],
            ':price'      => $data['price'],
            ':stock'      => $data['stock'] ?? 0,
            ':min_stock'  => $data['min_stock'] ?? 0,
            ':category'   => ($data['category'] ?? null) ?: null,
            ':code'       => ($data['code'] ?? null) ?: null,
            ':category_id'=> ($data['category_id'] ?? null) ?: null,
            ':image_path' => ($data['image_path'] ?? null) ?: null
        ]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        api_error('Error al agregar producto', $e);
    }
}

function updateProduct($pdo, $user)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }

    $fields = [];
    $params = [];
    $allowed = ['name', 'price', 'stock', 'min_stock', 'category', 'code', 'category_id', 'image_path'];

    foreach ($data as $key => $value) {
        if (in_array($key, $allowed)) {
            $fields[] = "$key = :$key";
            $params[":$key"] = $value;
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        return;
    }

    // Convert empty strings to NULL for nullable fields to avoid UNIQUE constraint violations
    foreach (['code', 'category', 'category_id', 'image_path'] as $field) {
        $key = ":$field";
        if (array_key_exists($key, $params) && $params[$key] === '') {
            $params[$key] = null;
        }
    }

    $tenantId = $user['tenant_id'] ?? 1;
    $params[':id'] = $data['id'];
    $params[':tenant_id'] = $tenantId;
    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id AND tenant_id = :tenant_id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$data['id'], $tenantId]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        api_error('Error al actualizar producto', $e);
    }
}

function deleteProduct($pdo, $user)
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
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tenantId]);
        echo json_encode(['message' => 'Product deleted']);
    } catch (PDOException $e) {
        api_error('Error al eliminar producto', $e);
    }
}