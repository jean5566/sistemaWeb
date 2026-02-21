<?php
// Remove closing tag to prevent whitespace issues
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = authenticate();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getProducts($pdo);
        break;
    case 'POST':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin access required']);
            exit();
        }
        addProduct($pdo);
        break;
    case 'PUT':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin access required']);
            exit();
        }
        updateProduct($pdo);
        break;
    case 'DELETE':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin access required']);
            exit();
        }
        deleteProduct($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getProducts($pdo)
{
    try {
        // Cap at 2000 to prevent accidental full-table dumps
        $limit = max(1, min(2000, (int)($_GET['limit'] ?? 2000)));
        $stmt  = $pdo->prepare("SELECT * FROM products ORDER BY name ASC LIMIT :limit");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        api_error('Error al obtener productos', $e);
    }
}

function addProduct($pdo)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['name']) || !isset($data['price'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    $sql = "INSERT INTO products (name, price, stock, min_stock, category, code, category_id) VALUES (:name, :price, :stock, :min_stock, :category, :code, :category_id)";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $data['name'],
            ':price' => $data['price'],
            ':stock' => $data['stock'] ?? 0,
            ':min_stock' => $data['min_stock'] ?? 0,
            ':category' => $data['category'] ?? null,
            ':code' => $data['code'] ?? null,
            ':category_id' => $data['category_id'] ?? null
        ]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        api_error('Error al agregar producto', $e);
    }
}

function updateProduct($pdo)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }

    $fields = [];
    $params = [];
    $allowed = ['name', 'price', 'stock', 'min_stock', 'category', 'code', 'category_id'];

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

    $params[':id'] = $data['id'];
    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        api_error('Error al actualizar producto', $e);
    }
}

function deleteProduct($pdo)
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

    try {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Product deleted']);
    } catch (PDOException $e) {
        api_error('Error al eliminar producto', $e);
    }
}