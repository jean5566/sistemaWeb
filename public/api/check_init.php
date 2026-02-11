<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $count = $stmt->fetchColumn();

    echo json_encode(['initialized' => $count > 0]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
