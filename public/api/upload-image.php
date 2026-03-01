<?php
require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$caller = require_auth();

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No se proporcionó una imagen válida']);
    exit();
}

$file = $_FILES['image'];

$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$detectedType = $finfo->file($file['tmp_name']);

if (!in_array($detectedType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de archivo no permitido. Use JPEG, PNG, GIF o WebP.']);
    exit();
}

$maxSize = 2 * 1024 * 1024; // 2 MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'La imagen no debe pesar más de 2MB.']);
    exit();
}

$uploadDir = __DIR__ . '/../../uploads/products/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear directorio de subida']);
        exit();
    }
}

$ext = match ($detectedType) {
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
    'image/webp' => 'webp',
    default      => 'jpg'
};

$filename = 'product_' . (int)$caller['tenant_id'] . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$filePath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar la imagen en el servidor']);
    exit();
}

echo json_encode([
    'success' => true,
    'path'    => '/uploads/products/' . $filename
]);
