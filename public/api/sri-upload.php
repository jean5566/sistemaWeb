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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$saleId = $data['sale_id'] ?? null;

if (!$saleId) {
    http_response_code(400);
    echo json_encode(['error' => 'No se proporcionó el ID de la venta']);
    exit();
}

try {
    // A. Fetch Full Sale Data
    $stmtSale = $pdo->prepare("
        SELECT s.*, c.name, c.document_id, c.email, c.phone 
        FROM sales s 
        LEFT JOIN customers c ON s.customer_id = c.id 
        WHERE s.id = :id AND s.tenant_id = :tid
    ");
    $stmtSale->execute([':id' => $saleId, ':tid' => $tid]);
    $saleData = $stmtSale->fetch(PDO::FETCH_ASSOC);

    if (!$saleData) {
        http_response_code(404);
        echo json_encode(['error' => 'Venta no encontrada o no pertenece a la empresa']);
        exit();
    }

    if ($saleData['sri_status'] === 'AUTHORIZED') {
        http_response_code(400);
        echo json_encode(['error' => 'Esta factura ya se encuentra autorizada por el SRI']);
        exit();
    }

    if ($saleData['document_type'] !== 'factura') {
        http_response_code(400);
        echo json_encode(['error' => 'Solo se pueden subir al SRI comprobantes de tipo factura']);
        exit();
    }

    $stmtItems = $pdo->prepare("
        SELECT si.*,
               COALESCE(NULLIF(si.product_name,''), p.name, 'Producto') as product_name
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = :sale_id
    ");
    $stmtItems->execute([':sale_id' => $saleId]);
    $itemsData = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

    // B. Prepare Customer Data
    $customerData = [
        'name' => $saleData['name'] ?? 'CONSUMIDOR FINAL',
        'document_id' => $saleData['document_id'] ?? '9999999999999',
        'email' => $saleData['email'] ?? '',
        'phone' => $saleData['phone'] ?? ''
    ];

    // C. Call SRI Service
    require_once __DIR__ . '/classes/SriService.php';

    // Fetch Company Data for XML
    $stmtCompany = $pdo->prepare("SELECT * FROM company_settings WHERE tenant_id = :tid LIMIT 1");
    $stmtCompany->execute([':tid' => $tid]);
    $companySettings = $stmtCompany->fetch(PDO::FETCH_ASSOC);

    // C1. Assign SRI secuencial — reuse existing one on retry, otherwise get next
    if (!empty($saleData['sri_secuencial'])) {
        // Retry: reuse the same secuencial already assigned to this sale
        $saleData['sri_secuencial'] = (int) $saleData['sri_secuencial'];
    } else {
        // First attempt: atomically increment counter and assign to this sale
        $pdo->beginTransaction();
        $pdo->prepare("UPDATE company_settings SET sri_secuencial = sri_secuencial + 1 WHERE tenant_id = :tid")
            ->execute([':tid' => $tid]);
        $secStmt = $pdo->prepare("SELECT sri_secuencial FROM company_settings WHERE tenant_id = :tid");
        $secStmt->execute([':tid' => $tid]);
        $nuevoSecuencial = (int) $secStmt->fetchColumn();
        $pdo->prepare("UPDATE sales SET sri_secuencial = :sec WHERE id = :id")
            ->execute([':sec' => $nuevoSecuencial, ':id' => $saleId]);
        $pdo->commit();
        $saleData['sri_secuencial'] = $nuevoSecuencial;
    }

    // SRI Configuration from Environment
    $envSri = $_ENV['SRI_ENV'] ?? getenv('SRI_ENV') ?: 1;
    $pathFirma = $_ENV['SRI_FIRMA_PATH'] ?? getenv('SRI_FIRMA_PATH') ?: __DIR__ . '/../../firma.p12';
    $passFirma = $_ENV['SRI_FIRMA_PASS'] ?? getenv('SRI_FIRMA_PASS') ?: '';
    if (empty($passFirma)) {
        throw new Exception('SRI_FIRMA_PASS no está configurada en el servidor');
    }

    $sri = new SriService($envSri, $pathFirma, $passFirma);

    // Reset status to pending before attempt
    $pdo->prepare("UPDATE sales SET sri_status = 'PENDING', sri_message = null WHERE id = :id")
        ->execute([':id' => $saleId]);

    $result = $sri->procesarVenta($saleData, $itemsData, $customerData, $companySettings);

    // D. Update Database with SRI Result
    $status = ($result['status'] === 'SUCCESS') ? 'AUTHORIZED' : 'REJECTED';
    $authDate = null;
    $mensaje = null;

    if ($status === 'AUTHORIZED') {
        if (isset($result['autorizacion']->autorizaciones->autorizacion)) {
            $auth = $result['autorizacion']->autorizaciones->autorizacion;
            if (is_array($auth)) $auth = $auth[0];
            $authDate = $auth->fechaAutorizacion ?? date('Y-m-d H:i:s');
        }
    } else {
        // Extraer mensajes legibles del objeto de respuesta del SRI
        $mensajeObj = $result['mensaje'] ?? null;
        if ($mensajeObj && isset($mensajeObj->mensaje)) {
            $msgs = is_array($mensajeObj->mensaje) ? $mensajeObj->mensaje : [$mensajeObj->mensaje];
            $textos = array_map(fn($m) => '[' . ($m->identificador ?? '') . '] ' . ($m->mensaje ?? '') . ($m->informacionAdicional ? ' - ' . $m->informacionAdicional : ''), $msgs);
            $mensaje = implode(' | ', $textos);
        } else {
            $mensaje = is_string($mensajeObj) ? $mensajeObj : json_encode($mensajeObj ?? 'Error desconocido');
        }
    }

    $updateSql = "UPDATE sales SET sri_access_key = :key, sri_status = :status, sri_auth_date = :date, sri_xml = :xml, sri_message = :msg WHERE id = :id AND tenant_id = :tid";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([
        ':key' => $result['clave_acceso'] ?? null,
        ':status' => $status,
        ':date' => $authDate,
        ':xml' => $result['xml_signed'] ?? null,
        ':msg' => $mensaje,
        ':id' => $saleId,
        ':tid' => $tid
    ]);

    if ($status === 'AUTHORIZED') {
        echo json_encode(['message' => 'Factura autorizada exitosamente', 'sri' => $result]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'El SRI rechazó el comprobante', 'details' => $result]);
    }

} catch (Exception $e) {
    http_response_code(500);
    error_log('[SRI UPLOAD ERROR] sale_id=' . ($saleId ?? 'N/A') . ' tenant_id=' . $tid . ' | ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    echo json_encode(['error' => 'Error al procesar con el SRI. Revise los logs del servidor para más detalles.']);
}
