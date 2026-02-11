<?php
require_once 'cors.php';
require_once 'auth_middleware.php';
require_once 'config.php';

$user = authenticate();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    getSales($pdo);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// Validation
if (!isset($data['total']) || !isset($data['items']) || !is_array($data['items'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid sale data']);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Create Sale Record
    $sql = "INSERT INTO sales (customer_id, total, payment_method, document_type) VALUES (:customer_id, :total, :payment_method, :document_type)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':customer_id' => $data['customer_id'] ?? null,
        ':total' => $data['total'],
        ':payment_method' => $data['payment_method'] ?? 'cash',
        ':document_type' => $data['document_type'] ?? 'ticket'
    ]);

    $saleId = $pdo->lastInsertId();

    // 2. Process Items
    $itemSql = "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (:sale_id, :product_id, :quantity, :unit_price)";
    $itemStmt = $pdo->prepare($itemSql);

    $stockSql = "UPDATE products SET stock = stock - :quantity WHERE id = :product_id";
    $stockStmt = $pdo->prepare($stockSql);

    foreach ($data['items'] as $item) {
        // Insert Item
        $itemStmt->execute([
            ':sale_id' => $saleId,
            ':product_id' => $item['product_id'],
            ':quantity' => $item['quantity'],
            ':unit_price' => $item['unit_price']
        ]);

        // Deduct Stock
        $stockStmt->execute([
            ':quantity' => $item['quantity'],
            ':product_id' => $item['product_id']
        ]);
    }

    $pdo->commit();
    echo json_encode(['id' => $saleId, 'message' => 'Sale processed successfully']);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Transaction failed: ' . $e->getMessage()]);
}

function getSales($pdo)
{
    try {
        // Fetch all sales with customer info
        $sql = "
            SELECT s.*, c.name as c_name, c.document_id as c_doc, c.email as c_email, c.phone as c_phone
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.created_at DESC
        ";
        $stmt = $pdo->query($sql);
        $sales = $stmt->fetchAll();

        // Populate items for each sale
        foreach ($sales as &$sale) {
            $itemSql = "
                SELECT si.quantity, si.unit_price, p.name as product_name
                FROM sale_items si
                LEFT JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = :sale_id
            ";
            $stmtItem = $pdo->prepare($itemSql);
            $stmtItem->execute([':sale_id' => $sale['id']]);
            $sale['items'] = $stmtItem->fetchAll();

            // Structure customer key to match expected JSON
            if ($sale['c_name']) {
                $sale['customers'] = [
                    'name' => $sale['c_name'],
                    'document_id' => $sale['c_doc'],
                    'email' => $sale['c_email'],
                    'phone' => $sale['c_phone']
                ];
            } else {
                $sale['customers'] = null;
            }
        }

        echo json_encode($sales);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error fetching sales: ' . $e->getMessage()]);
    }
}