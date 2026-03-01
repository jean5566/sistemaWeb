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
        getSettings($pdo, $tid);
        break;
    case 'POST': // Use POST for update/upsert to simplify
    case 'PUT':
        require_admin($caller);
        updateSettings($pdo, $tid);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getSettings($pdo, $tid)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM company_settings WHERE tenant_id = :tid LIMIT 1");
        $stmt->execute([':tid' => $tid]);
        $settings = $stmt->fetch();
        if (!$settings) {
            // Return defaults if empty
            echo json_encode(['name' => '', 'tax_rate' => 0]);
        } else {
            echo json_encode($settings);
        }
    } catch (PDOException $e) {
        api_error('Error al obtener configuración', $e);
    }
}

function updateSettings($pdo, $tid)
{
    $data = json_decode(file_get_contents("php://input"), true);

    // Check if record exists for this tenant
    $stmt = $pdo->prepare("SELECT id FROM company_settings WHERE tenant_id = :tid LIMIT 1");
    $stmt->execute([':tid' => $tid]);
    $exists = $stmt->fetch();

    $fields = [];
    $params = [];
    $allowed = ['name', 'address', 'phone', 'tax_id', 'email', 'currency', 'tax_rate', 'logo', 'sri_regime', 'sri_environment', 'accounting_obligated', 'sri_establecimiento', 'sri_punto_emision'];

    foreach ($data as $key => $value) {
        if (in_array($key, $allowed)) {
            // For PDO names
            if (is_bool($value)) {
                $value = $value ? 1 : 0;
            }
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
            $sql = "UPDATE company_settings SET " . implode(', ', $fields) . " WHERE id = :id AND tenant_id = :tid";
            $params[':id'] = $exists['id'];
            $params[':tid'] = $tid;
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        } else {
            // INSERT logic
            $params[':tid'] = $tid; // Add tenant_id parameter manually for insert
            $cols = ['tenant_id'];
            $vals = [':tid'];
            foreach ($data as $key => $value) {
                if (in_array($key, $allowed)) {
                    $cols[] = $key;
                    $vals[] = ":$key";
                }
            }
            $sql = "INSERT INTO company_settings (" . implode(',', $cols) . ") VALUES (" . implode(',', $vals) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        // Return updated
        $stmt = $pdo->prepare("SELECT * FROM company_settings WHERE tenant_id = :tid LIMIT 1");
        $stmt->execute([':tid' => $tid]);
        echo json_encode($stmt->fetch());

    } catch (PDOException $e) {
        api_error('Error al guardar configuración', $e);
    }
}