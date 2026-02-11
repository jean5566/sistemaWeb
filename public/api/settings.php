<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = authenticate();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getSettings($pdo);
        break;
    case 'POST': // Use POST for update/upsert to simplify
    case 'PUT':
        updateSettings($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getSettings($pdo)
{
    try {
        $stmt = $pdo->query("SELECT * FROM company_settings LIMIT 1");
        $settings = $stmt->fetch();
        if (!$settings) {
            // Return defaults if empty
            echo json_encode(['name' => '', 'tax_rate' => 0]);
        } else {
            echo json_encode($settings);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function updateSettings($pdo)
{
    $data = json_decode(file_get_contents("php://input"), true);

    // Check if record exists
    $stmt = $pdo->query("SELECT id FROM company_settings LIMIT 1");
    $exists = $stmt->fetch();

    $fields = [];
    $params = [];
    $allowed = ['name', 'address', 'phone', 'tax_id', 'email', 'currency', 'tax_rate'];

    foreach ($data as $key => $value) {
        if (in_array($key, $allowed)) {
            // For PDO names
            $fields[] = "$key = :$key";
            $params[":$key"] = $value;
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields']);
        return;
    }

    try {
        if ($exists) {
            $sql = "UPDATE company_settings SET " . implode(', ', $fields) . " WHERE id = :id";
            $params[':id'] = $exists['id'];
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        } else {
            // INSERT logic
            $cols = [];
            $vals = [];
            foreach ($params as $k => $v) {
                $cols[] = substr($k, 1);
                $vals[] = $k;
            }
            $sql = "INSERT INTO company_settings (" . implode(',', $cols) . ") VALUES (" . implode(',', $vals) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        // Return updated
        $stmt = $pdo->query("SELECT * FROM company_settings LIMIT 1");
        echo json_encode($stmt->fetch());

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}