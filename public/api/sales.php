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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    getSales($pdo, $tid);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// Validation — total is NOT accepted from the client, it is calculated server-side
if (!isset($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Se requieren items para procesar la venta']);
    exit();
}

$documentType = $data['document_type'] ?? 'ticket';

try {
    $pdo->beginTransaction();

    // 1. Load real prices and stock from DB — never trust client-sent prices
    $productIds   = array_map('intval', array_column($data['items'], 'product_id'));
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $productStmt  = $pdo->prepare("SELECT id, name, price, stock FROM products WHERE id IN ($placeholders) AND tenant_id = ?");
    
    $productParams = $productIds;
    $productParams[] = $tid;
    $productStmt->execute($productParams);
    
    $productsMap  = [];
    foreach ($productStmt->fetchAll() as $p) {
        $productsMap[(int)$p['id']] = $p;
    }

    // Validate all products exist
    foreach ($data['items'] as $item) {
        if (!isset($productsMap[(int)$item['product_id']])) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => "Producto #" . (int)$item['product_id'] . " no encontrado en el inventario de esta empresa"]);
            exit();
        }
    }

    // 2. Fetch tax rate from DB — never trust client-sent tax rate
    $taxRateStmt = $pdo->prepare("SELECT tax_rate FROM company_settings WHERE tenant_id = :tid LIMIT 1");
    $taxRateStmt->execute([':tid' => $tid]);
    $taxRateRow  = $taxRateStmt->fetch();
    $taxRate     = $taxRateRow ? (float)$taxRateRow['tax_rate'] : 0;

    // 3. Calculate server-side subtotal and total
    $serverSubtotal = 0;
    foreach ($data['items'] as $item) {
        $productId = (int) $item['product_id'];
        $quantity  = (int) $item['quantity'];
        if ($quantity <= 0) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'La cantidad debe ser mayor a cero']);
            exit();
        }
        $serverSubtotal += $productsMap[$productId]['price'] * $quantity;
    }

    $taxAmount   = ($documentType === 'factura') ? round($serverSubtotal * ($taxRate / 100), 2) : 0;
    $serverTotal = round($serverSubtotal + $taxAmount, 2);

    // 4. Create Sale Record using server-calculated total
    $sql  = "INSERT INTO sales (tenant_id, customer_id, total, subtotal, tax_amount, payment_method, document_type) VALUES (:tenant_id, :customer_id, :total, :subtotal, :tax_amount, :payment_method, :document_type)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':tenant_id'      => $tid,
        ':customer_id'    => $data['customer_id'] ?? null,
        ':total'          => $serverTotal,
        ':subtotal'       => $serverSubtotal,
        ':tax_amount'     => $taxAmount,
        ':payment_method' => $data['payment_method'] ?? 'cash',
        ':document_type'  => $documentType
    ]);

    $saleId = $pdo->lastInsertId();

    // 5. Process Items using real DB prices
    $itemSql  = "INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, tax_rate, discount) VALUES (:sale_id, :product_id, :product_name, :quantity, :unit_price, :tax_rate, :discount)";
    $itemStmt = $pdo->prepare($itemSql);

    // Atomic stock deduction — WHERE stock >= :quantity_check prevents race conditions
    $stockSql  = "UPDATE products SET stock = stock - :quantity
                  WHERE id = :product_id AND tenant_id = :tid AND stock >= :quantity_check";
    $stockStmt = $pdo->prepare($stockSql);

    foreach ($data['items'] as $item) {
        $productId   = (int) $item['product_id'];
        $quantity    = (int) $item['quantity'];
        $realPrice   = (float) $productsMap[$productId]['price'];
        $available   = (int) $productsMap[$productId]['stock'];
        $productName = $productsMap[$productId]['name'];

        // Check stock availability
        if ($available < $quantity) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode([
                'error' => "Stock insuficiente para \"$productName\". Disponible: $available, solicitado: $quantity"
            ]);
            exit();
        }

        // Insert sale item with real DB price and frozen product name
        $itemStmt->execute([
            ':sale_id'      => $saleId,
            ':product_id'   => $productId,
            ':product_name' => $productName,
            ':quantity'     => $quantity,
            ':unit_price'   => $realPrice,
            ':tax_rate'     => $taxRate,
            ':discount'     => 0
        ]);

        // Atomic stock deduction
        $stockStmt->execute([
            ':quantity'       => $quantity,
            ':product_id'     => $productId,
            ':tid'            => $tid,
            ':quantity_check' => $quantity
        ]);

        // If 0 rows affected, another transaction consumed the stock first
        if ($stockStmt->rowCount() === 0) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode([
                'error' => "Stock insuficiente para \"$productName\". Intente nuevamente."
            ]);
            exit();
        }
    }

    $pdo->commit();

    // SRI Integration removed from sale creation.
    // It will be done manually from the Facturas section.
    echo json_encode([
        'id'      => $saleId,
        'total'   => $serverTotal,
        'message' => 'Sale processed successfully',
        'document_type' => $documentType
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    api_error('Error al procesar la venta', $e);
}

function getSales($pdo, $tid)
{
    try {
        $limit  = max(1, min(200, (int)($_GET['limit'] ?? 50)));
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');

        $whereClause = "WHERE s.tenant_id = :tid";
        $params      = [':tid' => $tid];

        if ($search !== '') {
            $whereClause .= " AND (c.name LIKE :search OR CAST(s.id AS CHAR) = :id)";
            $params[':search'] = '%' . $search . '%';
            $params[':id']     = $search;
        }

        $docType = trim($_GET['document_type'] ?? '');
        if ($docType !== '') {
            $whereClause .= " AND s.document_type = :doc_type";
            $params[':doc_type'] = $docType;
        }

        $dateFrom = trim($_GET['date_from'] ?? '');
        $dateTo   = trim($_GET['date_to'] ?? '');
        if ($dateFrom !== '') {
            $whereClause .= " AND DATE(s.created_at) >= :date_from";
            $params[':date_from'] = $dateFrom;
        }
        if ($dateTo !== '') {
            $whereClause .= " AND DATE(s.created_at) <= :date_to";
            $params[':date_to'] = $dateTo;
        }

        // Total count for pagination metadata
        $countSql = "
            SELECT COUNT(*) FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            $whereClause
        ";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Query 1: paginated sales with customer info
        $sql = "
            SELECT s.*, c.name as c_name, c.document_id as c_doc, c.email as c_email, c.phone as c_phone
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            $whereClause
            ORDER BY s.created_at DESC
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $sales = $stmt->fetchAll();

        if (empty($sales)) {
            echo json_encode(['data' => [], 'total' => $total, 'page' => $page, 'limit' => $limit]);
            return;
        }

        // Query 2: all items for this page's sales in one query — no N+1
        $saleIds      = array_column($sales, 'id');
        $placeholders = implode(',', array_fill(0, count($saleIds), '?'));
        $itemStmt     = $pdo->prepare("
            SELECT si.sale_id, si.quantity, si.unit_price, si.discount,
                   COALESCE(NULLIF(si.product_name,''), p.name) as product_name
            FROM sale_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.sale_id IN ($placeholders)
        ");
        $itemStmt->execute($saleIds);

        $itemsBySale = [];
        foreach ($itemStmt->fetchAll() as $row) {
            $itemsBySale[$row['sale_id']][] = [
                'quantity'     => $row['quantity'],
                'unit_price'   => $row['unit_price'],
                'discount'     => $row['discount'],
                'product_name' => $row['product_name']
            ];
        }

        foreach ($sales as &$sale) {
            $sale['items']     = $itemsBySale[$sale['id']] ?? [];
            $sale['customers'] = $sale['c_name'] ? [
                'name'        => $sale['c_name'],
                'document_id' => $sale['c_doc'],
                'email'       => $sale['c_email'],
                'phone'       => $sale['c_phone']
            ] : null;
        }

        echo json_encode([
            'data'  => $sales,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
            'pages' => (int) ceil($total / $limit)
        ]);
    } catch (PDOException $e) {
        api_error('Error al obtener ventas', $e);
    }
}
