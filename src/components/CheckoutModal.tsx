import { useState, useRef, useMemo, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Check, Search, CheckCircle, Printer, FileText } from 'lucide-react';
import { Modal } from './Modal';
import { Receipt } from './Receipt';
import { CartItem } from '../context/CartContext';
import { Customer } from '../types/models';

interface CheckoutConfirmData {
    customer: { id: string | number | null; name: string; docId: string };
    type: string;
    paymentMethod: string;
    finalTotal: number;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: CheckoutConfirmData) => Promise<string | number | undefined>;
    cart: CartItem[];
    taxRate: number;
    currency: string;
    companyData: any;
    customers: Customer[];
}

export function CheckoutModal({
    isOpen,
    onClose,
    onConfirm,
    cart,
    taxRate,
    currency,
    companyData,
    customers
}: CheckoutModalProps) {
    const [step, setStep] = useState<'checkout' | 'success'>('checkout');
    const [selectedCustomerId, setSelectedCustomerId] = useState('0');
    const [docType, setDocType] = useState('ticket');
    const [searchTerm, setSearchTerm] = useState('');
    const [finalCart, setFinalCart] = useState<CartItem[]>([]);
    const [committedSaleId, setCommittedSaleId] = useState<string | number | null>(null);
    const [finalTotals, setFinalTotals] = useState({ subtotal: 0, tax: 0, total: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const receiptRef = useRef<HTMLDivElement>(null);

    // Reset state every time the modal opens fresh
    useEffect(() => {
        if (isOpen) {
            setStep('checkout');
            setSelectedCustomerId('0');
            setDocType('ticket');
            setSearchTerm('');
            setCommittedSaleId(null);
            setFinalCart([]);
            setFinalTotals({ subtotal: 0, tax: 0, total: 0 });
            setIsProcessing(false);
        }
    }, [isOpen]);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Ticket_${Date.now()}`,
        onAfterPrint: onClose
    });

    const baseTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
    const taxAmount = docType === 'factura' ? baseTotal * (taxRate / 100) : 0;
    const finalTotal = baseTotal + taxAmount;

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return [];
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.cedula && c.cedula.includes(searchTerm))
        );
    }, [customers, searchTerm]);

    const getCustomer = () => {
        if (selectedCustomerId === '0') {
            return { id: null, name: 'Cliente General', docId: '-' };
        }
        const found = customers.find(c => c.id.toString() === selectedCustomerId);
        return found ? { id: found.id, name: found.name, docId: found.cedula || '-' } : { id: null, name: 'Desconocido', docId: '-' };
    };

    const handleRegisterSale = async () => {
        setIsProcessing(true);
        const capturedCart = [...cart];
        const capturedTotals = { subtotal: baseTotal, tax: taxAmount, total: finalTotal };

        const saleId = await onConfirm({
            customer: getCustomer(),
            type: docType,
            paymentMethod: 'Efectivo/Tarjeta',
            finalTotal: finalTotal
        });

        setIsProcessing(false);

        if (saleId) {
            setFinalCart(capturedCart);
            setFinalTotals(capturedTotals);
            setCommittedSaleId(saleId);
            setStep('success');
        }
    };

    const displayDate = new Date().toLocaleString();

    return (
        <Modal
            title={step === 'checkout' ? 'Confirmar Venta' : 'Venta Registrada'}
            isOpen={isOpen}
            onClose={onClose}
            size="large"
        >
            {/* Hidden receipt — always in DOM so react-to-print ref works */}
            <div style={{ display: 'none' }}>
                <Receipt
                    ref={receiptRef}
                    company={companyData}
                    saleId={committedSaleId || ''}
                    date={displayDate}
                    customer={getCustomer()}
                    items={finalCart}
                    subtotal={finalTotals.subtotal}
                    tax={finalTotals.tax}
                    total={finalTotals.total}
                    currency={currency}
                    docType={docType}
                />
            </div>

            {step === 'checkout' ? (
                /* ── PASO 1: Formulario de venta ── */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda: tipo de comprobante + cliente */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                Tipo de Comprobante
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDocType('ticket')}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-0.5 ${docType === 'ticket'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="text-sm font-bold">Ticket</span>
                                    <span className="text-[10px] opacity-75">Sin validez fiscal</span>
                                </button>
                                <button
                                    onClick={() => setDocType('factura')}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-0.5 ${docType === 'factura'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="text-sm font-bold">Factura</span>
                                    <span className="text-[10px] opacity-75">
                                        {taxRate === 0 ? 'Sin IVA (RIMPE)' : `IVA (${taxRate}%)`}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                Cliente
                            </label>
                            <div className="relative">
                                <Search size={16} className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o cédula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white text-sm placeholder:text-gray-400"
                                />
                            </div>
                            <div className="max-h-[220px] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div
                                    onClick={() => setSelectedCustomerId('0')}
                                    className={`p-2.5 px-4 cursor-pointer border-b border-gray-50 dark:border-gray-700 flex items-center justify-between transition-colors ${selectedCustomerId === '0'
                                        ? 'bg-primary/10'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">Cliente General</span>
                                    {selectedCustomerId === '0' && <Check size={16} className="text-primary" />}
                                </div>
                                {filteredCustomers.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedCustomerId(c.id.toString())}
                                        className={`p-2.5 px-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors ${selectedCustomerId === c.id.toString()
                                            ? 'bg-primary/10'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{c.name}</div>
                                        {selectedCustomerId === c.id.toString() && <Check size={16} className="text-primary" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha: totales + acción */}
                    <div className="flex flex-col gap-4 justify-center bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl">
                        <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-600">
                            {taxAmount > 0 && (
                                <>
                                    <div className="flex justify-between text-sm text-gray-400 font-bold">
                                        <span>Subtotal</span>
                                        <span>{currency}{baseTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-400 font-bold">
                                        <span>IVA ({taxRate}%)</span>
                                        <span>{currency}{taxAmount.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-black text-xs uppercase tracking-widest">Total a pagar</span>
                                <span className="font-black text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                    {currency}{finalTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-3 mt-auto">
                            <button
                                onClick={handleRegisterSale}
                                disabled={isProcessing}
                                className="p-4 bg-primary hover:brightness-110 text-white font-black rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-95 uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Check size={20} />
                                <span>{isProcessing ? 'Procesando...' : 'Registrar Venta'}</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                Cancelar operación
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* ── PASO 2: Venta confirmada — generar comprobante ── */
                <div className="flex flex-col items-center gap-6 py-4 max-w-sm mx-auto">
                    {/* Indicador de éxito */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle size={48} className="text-emerald-500" strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">¡Venta Registrada!</p>
                            <p className="text-sm text-gray-400 font-bold mt-1">
                                Venta #{committedSaleId} &middot; {getCustomer().name}
                            </p>
                        </div>
                    </div>

                    <div className="w-full border-t border-gray-100 dark:border-gray-700" />

                    {/* Opciones de comprobante */}
                    <div className="w-full space-y-3">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">
                            ¿Generar comprobante?
                        </p>
                        <button
                            onClick={() => handlePrint()}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
                        >
                            <Printer size={18} />
                            <span>Imprimir {docType === 'factura' ? 'Factura' : 'Ticket'}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                        >
                            <FileText size={18} />
                            <span>Sin comprobante</span>
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
