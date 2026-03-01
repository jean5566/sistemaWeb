<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = authenticate();
require_admin($user);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

// Require confirmation token to prevent accidental resets
$data = json_decode(file_get_contents("php://input"), true);
if (($data['confirm'] ?? '') !== 'RESET_CONFIRMADO') {
    http_response_code(400);
    echo json_encode(['error' => 'Se requiere confirmación explícita: {"confirm":"RESET_CONFIRMADO"}']);
    exit();
}

$tenantId = $user['tenant_id'] ?? 1;

try {
    $pdo->beginTransaction();

    // Only delete data belonging to the current tenant
    $pdo->prepare("DELETE si FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.tenant_id = ?")->execute([$tenantId]);
    $pdo->prepare("DELETE FROM sales WHERE tenant_id = ?")->execute([$tenantId]);
    $pdo->prepare("DELETE FROM products WHERE tenant_id = ?")->execute([$tenantId]);
    $pdo->prepare("DELETE FROM customers WHERE tenant_id = ?")->execute([$tenantId]);
    $pdo->prepare("DELETE FROM categories WHERE tenant_id = ?")->execute([$tenantId]);

    $pdo->commit();

    error_log("[RESET] tenant_id=$tenantId borrado por user_id={$user['id']} email={$user['email']}");
    echo json_encode(['message' => 'Reset del sistema exitoso']);
} catch (PDOException $e) {
    $pdo->rollBack();
    api_error('Error al resetear el sistema', $e);
}