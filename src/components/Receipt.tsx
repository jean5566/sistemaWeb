import React from 'react';

import { CartItem } from '../context/CartContext';

interface ReceiptProps {
    company: {
        name: string;
        address: string;
        taxId: string;
        phone: string;
    };
    saleId: string | number;
    date: string;
    customer: {
        id: string | number | null;
        name: string;
        docId: string;
        email?: string;
        phone?: string;
        cedula?: string;
    };
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    docType?: string;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({
    company,
    saleId,
    date,
    customer,
    items,
    subtotal,
    tax,
    total,
    currency,
    docType = 'ticket' // 'ticket' or 'factura'
}, ref) => {

    const isTicket = docType === 'ticket';
    const docTitle = isTicket ? 'NOTA DE VENTA' : 'FACTURA ELECTRÓNICA';

    const styles = `
        @media screen {
            .receipt-preview {
                background: white;
                width: 300px;
                padding: 1rem;
                margin: 0 auto;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                color: #000;
            }
        }
        @media print {
            body * {
                visibility: hidden;
            }
            #printable-receipt,
            #printable-receipt * {
                visibility: visible;
            }
            #printable-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm;
                padding: 2mm;
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                color: #000;
                background: white;
            }
            @page {
                margin: 0;
                size: auto;
            }
        }
        .receipt-header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
        }
        .receipt-header h2 {
            font-size: 16px;
            margin: 0;
            text-transform: uppercase;
        }
        .receipt-info {
            margin-bottom: 10px;
            font-size: 11px;
        }
        .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .receipt-table th {
            text-align: left;
            border-bottom: 1px dashed #000;
            font-size: 11px;
        }
        .receipt-table td {
            padding: 4px 0;
            font-size: 11px;
        }
        .receipt-footer {
            border-top: 1px dashed #000;
            padding-top: 10px;
            text-align: right;
            font-size: 12px;
        }
        .receipt-footer .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
        }
        .receipt-footer .total {
            font-weight: bold;
            font-size: 16px;
            margin-top: 5px;
        }
        .receipt-message {
            text-align: center;
            margin-top: 15px;
            font-size: 10px;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div id="printable-receipt" ref={ref} className="receipt-preview">
                <div className="receipt-header">
                    <h2>{company.name || 'Empresa'}</h2>
                    <div>{company.address}</div>
                    <div>RUC: {company.taxId}</div>
                    <div>Telf: {company.phone}</div>
                    <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>{docTitle}</div>
                </div>

                <div className="receipt-info">
                    <div><strong>Series: {isTicket ? 'NV01' : 'F001'} - {saleId}</strong></div>
                    <div>Fecha: {date}</div>

                    <div style={{ borderTop: '1px dashed #000', margin: '5px 0', paddingTop: '5px' }}>
                        <div style={{ fontWeight: 'bold' }}>DATOS DEL CLIENTE:</div>
                        <div>Nombre: {customer.name}</div>
                        <div>CI/RUC: {customer.cedula || customer.docId || '9999999999'}</div>
                        {customer.email && customer.email !== '-' && (
                            <div>Email: {customer.email}</div>
                        )}
                        {customer.phone && (
                            <div>Telf: {customer.phone}</div>
                        )}
                    </div>
                </div>

                <table className="receipt-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Desc</th>
                            <th style={{ width: '10%' }}>Cant</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>P.Unit</th>
                            <th style={{ width: '30%', textAlign: 'right' }}>Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td>
                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>{currency || '$'}{Number(item.price).toFixed(2)}</td>
                                <td style={{ textAlign: 'right' }}>{currency || '$'}{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="receipt-footer">
                    {!isTicket && (
                        <>
                            <div className="row">
                                <span>Subtotal:</span>
                                <span>{currency || '$'}{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="row">
                                <span>Impuestos:</span>
                                <span>{currency || '$'}{tax.toFixed(2)}</span>
                            </div>
                        </>
                    )}
                    <div className="row total">
                        <span>TOTAL:</span>
                        <span>{currency || '$'}{total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="receipt-message">
                    {isTicket && (
                        <p style={{ fontWeight: 'bold', margin: '10px 0', textTransform: 'uppercase' }}>
                            * NO VÁLIDO PARA CRÉDITO FISCAL *
                        </p>
                    )}
                    <p>¡Gracias por su preferencia!</p>
                    <p>Conserve este documento.</p>
                </div>
            </div>
        </>
    );
});
