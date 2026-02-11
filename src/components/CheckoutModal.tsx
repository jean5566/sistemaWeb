import { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Check, User, Search } from 'lucide-react';
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
    const [selectedCustomerId, setSelectedCustomerId] = useState('0');
    const [docType, setDocType] = useState('ticket');
    const [searchTerm, setSearchTerm] = useState('');
    const [shouldPrint, setShouldPrint] = useState(true);
    const [finalCart, setFinalCart] = useState<CartItem[]>([]);
    const [committedSaleId, setCommittedSaleId] = useState<string | number | null>(null);

    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Ticket_${Date.now()}`,
        onAfterPrint: onClose
    });

    const baseTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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

    const handleSelectCustomer = (id: string) => {
        setSelectedCustomerId(id);
    };

    const handleConfirm = async () => {
        setFinalCart([...cart]);

        const saleId = await onConfirm({
            customer: getCustomer(),
            type: docType,
            paymentMethod: 'Efectivo/Tarjeta', // This is overridden by pendingPaymentMethod in parent usually, or we should pass it in? 
            // The parent 'handleFinalizeCheckout' takes { type, finalTotal, customer }
            // The parent uses 'pendingPaymentMethod' from its own state.
            finalTotal: finalTotal
        });

        if (saleId) {
            if (shouldPrint) {
                setCommittedSaleId(saleId);
                setTimeout(() => {
                    handlePrint();
                }, 500);
            } else {
                onClose();
            }
        }
    };

    const previewSaleId = Date.now().toString().slice(-6);
    const displaySaleId = committedSaleId || previewSaleId;
    const previewDate = new Date().toLocaleString();

    return (
        <Modal title="Confirmar Venta" isOpen={isOpen} onClose={onClose} size="large">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Options */}
                <div className="space-y-4">
                    {/* Doc Type Selector */}
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
                                <span className="text-[10px] opacity-75">Impuesto ({taxRate}%)</span>
                            </button>
                        </div>
                    </div>

                    {/* Customer Selection */}
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
                                onClick={() => handleSelectCustomer('0')}
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
                                    onClick={() => handleSelectCustomer(c.id.toString())}
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

                {/* RIGHT COLUMN: Totals & Actions */}
                <div className="flex flex-col gap-4 justify-center bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-600">
                        <span className="text-gray-500 font-black text-xs uppercase tracking-widest">Total a pagar</span>
                        <span className="font-black text-3xl text-emerald-600 dark:text-emerald-400 tracking-tighter">{currency}{finalTotal.toFixed(2)}</span>
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={shouldPrint}
                            onChange={(e) => setShouldPrint(e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary/20 accent-primary"
                        />
                        <span className="font-bold text-xs text-gray-700 dark:text-gray-200">
                            Imprimir comprobante
                        </span>
                    </label>

                    <div className="grid gap-3 mt-auto">
                        <button
                            onClick={handleConfirm}
                            className="p-4 bg-primary hover:brightness-110 text-white font-black rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-95 uppercase tracking-widest"
                        >
                            <Check size={20} /> <span>Confirmar Venta</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            Cancelar operación
                        </button>
                    </div>
                </div>

                {/* Hidden receipt for printing only */}
                <div style={{ display: 'none' }}>
                    <Receipt
                        ref={receiptRef}
                        company={companyData}
                        saleId={displaySaleId}
                        date={previewDate}
                        customer={getCustomer()}
                        items={finalCart.length > 0 ? finalCart : cart}
                        subtotal={baseTotal}
                        tax={taxAmount}
                        total={finalTotal}
                        currency={currency}
                        docType={docType}
                    />
                </div>
            </div>
        </Modal>
    );
}
