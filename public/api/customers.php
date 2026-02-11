<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = authenticate();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getCustomers($pdo);
        break;
    case 'POST':
        addCustomer($pdo);
        break;
    case 'PUT':
        updateCustomer($pdo);
        break;
    case 'DELETE':
        deleteCustomer($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getCustomers($pdo)
{
    try {
        // Calculate total sales per customer
        $sql = "
            SELECT c.*,
            (SELECT SUM(total) FROM sales s WHERE s.customer_id = c.id) as total_purchases
            FROM customers c
            ORDER BY c.name ASC
        ";
        $stmt = $pdo->query($sql);
        $customers = $stmt->fetchAll();
        echo json_encode($customers);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error fetching customers: ' . $e->getMessage()]);
    }
}

function addCustomer($pdo)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required']);
        return;
    }

    $sql = "INSERT INTO customers (name, document_id, email, phone, address) VALUES (:name, :document_id, :email, :phone, :address)";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $data['name'],
            ':document_id' => $data['document_id'] ?? null,
            ':email' => $data['email'] ?? null,
            ':phone' => $data['phone'] ?? null,
            ':address' => $data['address'] ?? null
        ]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function updateCustomer($pdo)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }

    $fields = [];
    $params = [];
    $allowed = ['name', 'document_id', 'email', 'phone', 'address'];

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
    $sql = "UPDATE customers SET " . implode(', ', $fields) . " WHERE id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function deleteCustomer($pdo)
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
        $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Customer deleted']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}