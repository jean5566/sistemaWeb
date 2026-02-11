import { Plus, Trash2, ShoppingCart, Banknote, CreditCard, X } from 'lucide-react';

import { CartItem } from '../context/CartContext';

interface CartPanelProps {
    cart: CartItem[];
    onUpdateQuantity: (id: string | number, delta: number) => void;
    onRemove: (id: string | number) => void;
    onCheckout: (method: string) => void;
    taxRate?: number;
    currency?: string;
    onClose?: () => void;
}

export function CartPanel({ cart, onUpdateQuantity, onRemove, onCheckout, taxRate = 18, currency = '$', onClose }: CartPanelProps) {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = cartTotal * (taxRate / 100);
    const totalAmount = cartTotal + taxAmount;

    return (
        <div className="w-full md:w-[400px] flex flex-col h-full bg-white dark:bg-gray-800 shadow-sm z-30 border-l border-gray-100 overflow-hidden">
            <div className="p-6 pb-2 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Orden Actual</h2>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 block">Resumen de Venta</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                        <X size={24} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 space-y-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                            <ShoppingCart size={32} strokeWidth={1.5} className="text-gray-300" />
                        </div>
                        <p className="font-semibold text-gray-400 uppercase text-[10px] tracking-widest">Sin productos seleccionados</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 dark:bg-gray-700/30 group hover:border-primary/20 transition-all shadow-sm">

                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-gray-900 dark:text-white text-sm leading-snug uppercase tracking-tight">{item.name}</h4>
                                <div className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{currency}{item.price.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-700 rounded-xl p-1">
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-400 transition-all font-bold"
                                    >
                                        <X size={14} className="rotate-45" />
                                    </button>
                                    <span className="font-black text-sm min-w-[1.25rem] text-center text-gray-700">{item.quantity}</span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 transition-all font-bold"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                    title="Quitar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 pt-2 bg-white dark:bg-gray-800 border-t border-gray-50">
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-400 dark:text-gray-400 text-sm font-black uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="text-gray-700 dark:text-gray-200">{currency}{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 dark:text-gray-400 text-sm font-black uppercase tracking-widest">
                        <span>Impuesto ({taxRate}%)</span>
                        <span className="text-gray-700 dark:text-gray-200">{currency}{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-emerald-600 dark:text-emerald-400 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <span>TOTAL</span>
                        <span>{currency}{totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        className="flex flex-row items-center justify-center gap-3 p-4 bg-primary text-white rounded-2xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 active:scale-95 font-bold"
                        disabled={cart.length === 0}
                        onClick={() => onCheckout('Efectivo')}
                    >
                        <Banknote size={20} />
                        <span>Efectivo</span>
                    </button>
                    <button
                        className="flex flex-row items-center justify-center gap-3 p-4 bg-slate-900 text-white rounded-2xl transition-all shadow-md shadow-slate-900/10 active:scale-95 font-bold"
                        disabled={cart.length === 0}
                        onClick={() => onCheckout('Tarjeta')}
                    >
                        <CreditCard size={20} />
                        <span>Tarjeta</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
