<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = authenticate();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

try {
    $pdo->beginTransaction();

    // Order matters due to Foreign Keys
    $pdo->exec("DELETE FROM sale_items");
    $pdo->exec("DELETE FROM sales");
    $pdo->exec("DELETE FROM products");
    $pdo->exec("DELETE FROM customers");
    $pdo->exec("DELETE FROM categories");
    // Optional: Keep company settings?
    // $pdo->exec("DELETE FROM company_settings");

    $pdo->commit();
    echo json_encode(['message' => 'System reset successful']);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}