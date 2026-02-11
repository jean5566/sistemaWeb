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
        addProduct($pdo);
        break;
    case 'PUT':
        updateProduct($pdo);
        break;
    case 'DELETE':
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
        $stmt = $pdo->query("SELECT * FROM products ORDER BY name ASC");
        $products = $stmt->fetchAll();
        echo json_encode($products);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
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
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
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
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
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
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}