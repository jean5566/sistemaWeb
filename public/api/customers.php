<?php
require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

$caller = null;
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $caller = require_auth();
}
$tid = $caller ? (int) $caller['tenant_id'] : 1;

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getCustomers($pdo, $tid);
        break;
    case 'POST':
        addCustomer($pdo, $tid);
        break;
    case 'PUT':
        updateCustomer($pdo, $tid);
        break;
    case 'DELETE':
        deleteCustomer($pdo, $tid);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getCustomers($pdo, $tid)
{
    try {
        // Calculate total sales per customer filtered by tenant
        $sql = "
            SELECT c.*,
            (SELECT SUM(total) FROM sales s WHERE s.customer_id = c.id AND s.tenant_id = :tid1) as total_purchases
            FROM customers c
            WHERE c.tenant_id = :tid2
            ORDER BY c.name ASC
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':tid1' => $tid, ':tid2' => $tid]);
        $customers = $stmt->fetchAll();
        echo json_encode($customers);
    } catch (PDOException $e) {
        api_error('Error al obtener clientes', $e);
    }
}

function addCustomer($pdo, $tid)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required']);
        return;
    }

    $sql = "INSERT INTO customers (tenant_id, name, document_id, email, phone, address) VALUES (:tenant_id, :name, :document_id, :email, :phone, :address)";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':tenant_id' => $tid,
            ':name' => $data['name'],
            ':document_id' => $data['document_id'] ?? null,
            ':email' => $data['email'] ?? null,
            ':phone' => $data['phone'] ?? null,
            ':address' => $data['address'] ?? null
        ]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tid]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'El documento del cliente ya existe para esta empresa']);
        } else {
            api_error('Error en clientes', $e);
        }
    }
}

function updateCustomer($pdo, $tid)
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
    $params[':tid'] = $tid;
    $sql = "UPDATE customers SET " . implode(', ', $fields) . " WHERE id = :id AND tenant_id = :tid";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$data['id'], $tid]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        api_error('Error en actualización de clientes', $e);
    }
}

function deleteCustomer($pdo, $tid)
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
        $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tid]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Cliente no encontrado']);
            return;
        }
        
        echo json_encode(['message' => 'Customer deleted']);
    } catch (PDOException $e) {
        api_error('Error al borrar el cliente', $e);
    }
}
