<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $count = $stmt->fetchColumn();

    echo json_encode(['initialized' => $count > 0]);

} catch (PDOException $e) {
    api_error('Error al verificar inicialización', $e);
}
