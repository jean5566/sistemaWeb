<?php

require_once __DIR__ . '/../../../vendor/autoload.php'; // Adjust path to vendor

use RobRichards\XMLSecLibs\XMLSecurityDSig;
use RobRichards\XMLSecLibs\XMLSecurityKey;

class SriService
{
    private $ambiente; // 1: Pruebas, 2: Producción
    private $tipoEmision = '1'; // 1: Normal
    private $pathFirma;
    private $passFirma;

    // RIMPE Negocio Popular specific constants
    const RIMPE_LEYENDA = 'Contribuyente Negocio Popular - Régimen RIMPE';

    // WSDL URLs
    const WSDL_RECEPCION_PRUEBAS = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
    const WSDL_AUTORIZACION_PRUEBAS = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
    const WSDL_RECEPCION_PRODUCCION = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
    const WSDL_AUTORIZACION_PRODUCCION = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';

    public function __construct($ambiente = 1, $pathFirma = '', $passFirma = '')
    {
        $this->ambiente = $ambiente;
        $this->pathFirma = $pathFirma;
        $this->passFirma = $passFirma;
    }

    /**
     * Main method to process a sale
     */
    public function procesarVenta($saleData, $items, $customer, $company)
    {
        try {
            // 1. Generate XML
            $xml = $this->generarXML($saleData, $items, $customer, $company);

            // 2. Sign XML
            $signedXml = $this->firmarXML($xml);

            // 3. Send to SRI (Recepcion)
            $recepcion = $this->enviarRecepcion($signedXml);

            if ($recepcion->estado === 'RECIBIDA') {
                // 4. Request Authorization
                // Wait a bit? Usually immediate in offline scheme test, but good to separate.
                sleep(1); // Optional, but sometimes helps
                $autorizacion = $this->solicitarAutorizacion($this->getAccessKey($xml));

                return [
                    'status' => 'SUCCESS',
                    'clave_acceso' => $this->getAccessKey($xml),
                    'xml_signed' => $signedXml,
                    'autorizacion' => $autorizacion
                ];
            } else {
                return [
                    'status' => 'ERROR',
                    'clave_acceso' => $this->getAccessKey($xml),
                    'xml_signed' => $signedXml,
                    'mensaje' => $recepcion->mensajes
                ];
            }

        } catch (Exception $e) {
            return ['status' => 'EXCEPTION', 'message' => $e->getMessage()];
        }
    }

    private function getAccessKey($xmlString)
    {
        $dom = new DOMDocument();
        $dom->loadXML($xmlString);
        return $dom->getElementsByTagName('claveAcceso')->item(0)->nodeValue;
    }

    private function generarXML($sale, $items, $customer, $company)
    {
        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;
        $dom->preserveWhiteSpace = false;

        $factura = $dom->createElement('factura');
        $factura->setAttribute('id', 'comprobante');
        $factura->setAttribute('version', '2.1.0');
        $dom->appendChild($factura);

        // --- InfoTributaria ---
        // Get RUC from ENV or DB, fallback to placeholder if missing (but should not happen)
        $ruc = $_ENV['SRI_RUC'] ?? getenv('SRI_RUC');
        if (!$ruc && isset($company['tax_id']))
            $ruc = $company['tax_id'];
        if (!$ruc)
            $ruc = '9999999999999'; // Fallback

        $razonSocial = $company['name'] ?? 'RAZON SOCIAL DEFAULT';
        $nombreComercial = $company['name'] ?? 'NOMBRE COMERCIAL';
        $dirMatriz = $company['address'] ?? 'Direccion Matriz';

        $infoTributaria = $dom->createElement('infoTributaria');
        $infoTributaria->appendChild($dom->createElement('ambiente', $this->ambiente));
        $infoTributaria->appendChild($dom->createElement('tipoEmision', $this->tipoEmision));
        $infoTributaria->appendChild($dom->createElement('razonSocial', substr($razonSocial, 0, 300)));
        $infoTributaria->appendChild($dom->createElement('nombreComercial', substr($nombreComercial, 0, 300)));
        $infoTributaria->appendChild($dom->createElement('ruc', $ruc));

        // Clave Acceso Generation
        $fechaEmision = date('dmY'); // ddmmyyyy
        $tipoComprobante = '01'; // Factura
        $estab   = str_pad($company['sri_establecimiento'] ?? '001', 3, '0', STR_PAD_LEFT);
        $ptoEmi  = str_pad($company['sri_punto_emision']   ?? '001', 3, '0', STR_PAD_LEFT);
        $serie   = $estab . $ptoEmi;
        $secuencial = str_pad($sale['sri_secuencial'] ?? $sale['id'], 9, '0', STR_PAD_LEFT);
        $codigoNumerico = str_pad((string)random_int(0, 99999999), 8, '0', STR_PAD_LEFT);

        $claveAcceso = $this->generarClaveAcceso($fechaEmision, $tipoComprobante, $ruc, $this->ambiente, $serie, $secuencial, $codigoNumerico, $this->tipoEmision);

        $infoTributaria->appendChild($dom->createElement('claveAcceso', $claveAcceso));
        $infoTributaria->appendChild($dom->createElement('codDoc', $tipoComprobante));
        $infoTributaria->appendChild($dom->createElement('estab', substr($serie, 0, 3)));
        $infoTributaria->appendChild($dom->createElement('ptoEmi', substr($serie, 3, 3)));
        $infoTributaria->appendChild($dom->createElement('secuencial', $secuencial));
        $infoTributaria->appendChild($dom->createElement('dirMatriz', substr($dirMatriz, 0, 300)));

        // RIMPE FIELD — solo para contribuyentes RIMPE
        $regime = strtoupper($company['sri_regime'] ?? 'GENERAL');
        if ($regime === 'RIMPE_NEGOCIO_POPULAR') {
            $infoTributaria->appendChild($dom->createElement('contribuyenteRimpe', 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE'));
        } elseif ($regime === 'RIMPE_EMPRENDEDOR') {
            $infoTributaria->appendChild($dom->createElement('contribuyenteRimpe', 'EMPRENDEDOR - RÉGIMEN RIMPE'));
        }

        $factura->appendChild($infoTributaria);

        // --- InfoFactura ---
        $infoFactura = $dom->createElement('infoFactura');
        $infoFactura->appendChild($dom->createElement('fechaEmision', date('d/m/Y')));
        $infoFactura->appendChild($dom->createElement('dirEstablecimiento', substr($dirMatriz, 0, 300)));
        $obligado = !empty($company['accounting_obligated']) ? 'SI' : 'NO';
        $infoFactura->appendChild($dom->createElement('obligadoContabilidad', $obligado));

        // Customer Info
        $tipoId = '05'; // Cedula default
        // Logic for tipoIdentificacion based on length/type
        if (strlen($customer['document_id']) == 13)
            $tipoId = '04'; // RUC
        elseif ($customer['document_id'] == '9999999999999')
            $tipoId = '07'; // Consumidor Final

        $infoFactura->appendChild($dom->createElement('tipoIdentificacionComprador', $tipoId));
        $infoFactura->appendChild($dom->createElement('razonSocialComprador', $customer['name']));
        $infoFactura->appendChild($dom->createElement('identificacionComprador', $customer['document_id']));
        // Use stored subtotal/tax_amount if available; fallback to recalculate
        $taxRate = (float)($company['tax_rate'] ?? 0);
        if (!empty($sale['subtotal']) && !empty($sale['tax_amount'])) {
            $subtotalFromItems = (float)$sale['subtotal'];
            $taxAmount         = (float)$sale['tax_amount'];
        } else {
            $subtotalFromItems = 0;
            foreach ($items as $item) {
                $subtotalFromItems += (float)$item['unit_price'] * (int)$item['quantity'];
            }
            $taxAmount = round($subtotalFromItems * ($taxRate / 100), 2);
        }
        $importeTotal = round($subtotalFromItems + $taxAmount, 2);

        [$codigoPorcentaje, $tarifa] = $this->mapCodigoIVA($taxRate);

        $infoFactura->appendChild($dom->createElement('totalSinImpuestos', number_format($subtotalFromItems, 2, '.', '')));
        $infoFactura->appendChild($dom->createElement('totalDescuento', '0.00'));

        // Total con impuestos
        $totalConImpuestos = $dom->createElement('totalConImpuestos');
        $totalImpuesto = $dom->createElement('totalImpuesto');
        $totalImpuesto->appendChild($dom->createElement('codigo', '2')); // IVA
        $totalImpuesto->appendChild($dom->createElement('codigoPorcentaje', $codigoPorcentaje));
        $totalImpuesto->appendChild($dom->createElement('baseImponible', number_format($subtotalFromItems, 2, '.', '')));
        $totalImpuesto->appendChild($dom->createElement('valor', number_format($taxAmount, 2, '.', '')));
        $totalConImpuestos->appendChild($totalImpuesto);
        $infoFactura->appendChild($totalConImpuestos);

        $infoFactura->appendChild($dom->createElement('propina', '0.00'));
        $infoFactura->appendChild($dom->createElement('importeTotal', number_format($importeTotal, 2, '.', '')));
        $infoFactura->appendChild($dom->createElement('moneda', 'DOLAR'));

        // Pagos
        $pagos = $dom->createElement('pagos');
        $pago  = $dom->createElement('pago');
        $pago->appendChild($dom->createElement('formaPago', $this->mapFormaPago($sale['payment_method'] ?? 'efectivo')));
        $pago->appendChild($dom->createElement('total', number_format($importeTotal, 2, '.', '')));
        $pagos->appendChild($pago);
        $infoFactura->appendChild($pagos);

        $factura->appendChild($infoFactura);

        // --- Detalles ---
        $detalles = $dom->createElement('detalles');
        foreach ($items as $item) {
            $detalle = $dom->createElement('detalle');
            $desc    = (float)($item['discount'] ?? 0);
            $itemBase = (float)$item['unit_price'] * (int)$item['quantity'] - $desc;

            $detalle->appendChild($dom->createElement('codigoPrincipal', $item['product_id'] ?? '000'));
            $detalle->appendChild($dom->createElement('descripcion', substr($item['product_name'] ?? 'Producto', 0, 300)));
            $detalle->appendChild($dom->createElement('cantidad', number_format($item['quantity'], 2, '.', '')));
            $detalle->appendChild($dom->createElement('precioUnitario', number_format($item['unit_price'], 6, '.', '')));
            $detalle->appendChild($dom->createElement('descuento', number_format($desc, 2, '.', '')));
            $detalle->appendChild($dom->createElement('precioTotalSinImpuesto', number_format($itemBase, 2, '.', '')));
            $itemIva  = round($itemBase * ($taxRate / 100), 2);

            $impuestos = $dom->createElement('impuestos');
            $imp = $dom->createElement('impuesto');
            $imp->appendChild($dom->createElement('codigo', '2')); // IVA
            $imp->appendChild($dom->createElement('codigoPorcentaje', $codigoPorcentaje));
            $imp->appendChild($dom->createElement('tarifa', $tarifa));
            $imp->appendChild($dom->createElement('baseImponible', number_format($itemBase, 2, '.', '')));
            $imp->appendChild($dom->createElement('valor', number_format($itemIva, 2, '.', '')));
            $impuestos->appendChild($imp);
            $detalle->appendChild($impuestos);

            $detalles->appendChild($detalle);
        }
        $factura->appendChild($detalles);

        // --- InfoAdicional ---
        $infoAdicional = $dom->createElement('infoAdicional');

        // Leyenda RIMPE — solo para contribuyentes RIMPE
        if ($regime === 'RIMPE_NEGOCIO_POPULAR') {
            $campoRegimen = $dom->createElement('campoAdicional', 'Contribuyente Negocio Popular - Régimen RIMPE');
            $campoRegimen->setAttribute('nombre', 'Regimen');
            $infoAdicional->appendChild($campoRegimen);
        } elseif ($regime === 'RIMPE_EMPRENDEDOR') {
            $campoRegimen = $dom->createElement('campoAdicional', 'Emprendedor - Régimen RIMPE');
            $campoRegimen->setAttribute('nombre', 'Regimen');
            $infoAdicional->appendChild($campoRegimen);
        }

        if (!empty($customer['email'])) {
            $campoEmail = $dom->createElement('campoAdicional', $customer['email']);
            $campoEmail->setAttribute('nombre', 'Email');
            $infoAdicional->appendChild($campoEmail);
        }

        $factura->appendChild($infoAdicional);

        return $dom->saveXML();
    }

    private function generarClaveAcceso($fechaEmision, $tipoComprobante, $ruc, $ambiente, $serie, $secuencial, $codigoNumerico, $tipoEmision)
    {
        $clave = $fechaEmision . $tipoComprobante . $ruc . $ambiente . $serie . $secuencial . $codigoNumerico . $tipoEmision;

        // Modulo 11
        $digits = array_reverse(str_split($clave));
        $total = 0;
        $pivote = 2;

        foreach ($digits as $digit) {
            $total += (int) $digit * $pivote;
            $pivote++;
            if ($pivote == 8)
                $pivote = 2;
        }

        $modulo = 11 - ($total % 11);
        if ($modulo == 11)
            $verificador = 0;
        elseif ($modulo == 10)
            $verificador = 1;
        else
            $verificador = $modulo;

        return $clave . $verificador;
    }

    private function firmarXML($xmlData)
    {
        if (!file_exists($this->pathFirma)) {
            throw new Exception("Firma file not found: " . $this->pathFirma);
        }

        // Load PKCS12 certificate
        $certs = array();
        if (!openssl_pkcs12_read(file_get_contents($this->pathFirma), $certs, $this->passFirma)) {
            throw new Exception("Error reading PKCS12 certificate");
        }

        $dom = new DOMDocument();
        $dom->loadXML($xmlData);

        $objDSig = new XMLSecurityDSig();
        $objDSig->setCanonicalMethod(XMLSecurityDSig::C14N);
        $objDSig->addReference(
            $dom,
            XMLSecurityDSig::SHA1,
            array('http://www.w3.org/2000/09/xmldsig#enveloped-signature'),
            array('force_uri' => true)
        );

        $objKey = new XMLSecurityKey(XMLSecurityKey::RSA_SHA1, array('type' => 'private'));
        $objKey->loadKey($certs['pkey']);

        $objDSig->sign($objKey);
        $objDSig->add509Cert($certs['cert']);
        $objDSig->appendSignature($dom->documentElement);

        return $dom->saveXML();
    }

    /**
     * Map a tax rate percentage to SRI's codigoPorcentaje and tarifa.
     * Returns [codigoPorcentaje, tarifa]
     */
    private function mapCodigoIVA($taxRate): array
    {
        $rate = (float) $taxRate;
        if ($rate == 0)  return ['0', '0'];   // 0%  — RIMPE Negocio Popular
        if ($rate == 8)  return ['3', '8'];   // 8%  — Ecuador (período especial)
        if ($rate == 12) return ['2', '12'];  // 12% — Ecuador (tasa anterior)
        return ['4', '15'];                   // 15% — Ecuador (tasa vigente 2024+)
    }

    /**
     * Map a sale's payment_method to SRI's formaPago code.
     */
    private function mapFormaPago($paymentMethod): string
    {
        $map = [
            'efectivo'     => '01',
            'cash'         => '01',
            'tarjeta'      => '19',
            'credito'      => '19',
            'tarjeta credito' => '19',
            'debito'       => '16',
            'tarjeta debito' => '16',
            'transferencia'=> '20',
            'cheque'       => '02',
            'electronico'  => '17',
        ];
        return $map[strtolower(trim($paymentMethod))] ?? '01';
    }

    private function soapOptions(): array
    {
        return [
            'trace'          => 1,
            'exceptions'     => true,
            'encoding'       => 'UTF-8',
            'connection_timeout' => 30,
            'stream_context' => stream_context_create([
                'ssl' => [
                    'verify_peer'       => false,
                    'verify_peer_name'  => false,
                    'allow_self_signed' => true,
                ],
            ]),
        ];
    }

    private function enviarRecepcion($xmlSigned)
    {
        $wsdl = ($this->ambiente == 1) ? self::WSDL_RECEPCION_PRUEBAS : self::WSDL_RECEPCION_PRODUCCION;

        try {
            $client   = new SoapClient($wsdl, $this->soapOptions());
            // El SRI exige el XML firmado en base64
            $response = $client->validarComprobante(['xml' => base64_encode($xmlSigned)]);
            return $response;
        } catch (SoapFault $e) {
            throw new Exception("Error SRI Recepcion: " . $e->getMessage());
        }
    }

    private function solicitarAutorizacion($claveAcceso)
    {
        $wsdl = ($this->ambiente == 1) ? self::WSDL_AUTORIZACION_PRUEBAS : self::WSDL_AUTORIZACION_PRODUCCION;

        try {
            $client   = new SoapClient($wsdl, $this->soapOptions());
            $response = $client->autorizacionComprobante(['claveAccesoComprobante' => $claveAcceso]);
            return $response;
        } catch (SoapFault $e) {
            throw new Exception("Error SRI Autorizacion: " . $e->getMessage());
        }
    }
}
