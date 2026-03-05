import { useState } from 'react';
import { Search, ShoppingCart, X, Trash2 } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useCart } from '../context/CartContext';
import { useCustomers } from '../hooks/useCustomers';
import { useSales } from '../hooks/useSales';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '../components/ProductCard';
import { CartPanel } from '../components/CartPanel';
import { CheckoutModal } from '../components/CheckoutModal';

import { useCompanyData } from '../hooks/useCompanyData';
import { Category } from '../types/models';

export default function POS() {
    const { products, loading: loadingProducts } = useInventory();
    const { categories } = useCategories();
    // Assuming companyData is an object with currency, taxRate, etc.
    const { companyData } = useCompanyData();

    // Add 'Todo' option for filter
    const displayCategories: Category[] = [{ id: 'all', name: 'Todo' }, ...categories];
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { customers } = useCustomers();
    const { registerSale } = useSales();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | number>('all');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [pendingPaymentMethod, setPendingPaymentMethod] = useState<string | null>(null);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Filter Logic
    const filteredProducts = (searchQuery.trim() === '' && selectedCategory === 'all') ? [] : products.filter(product => {
        let matchesCategory = selectedCategory === 'all';

        if (!matchesCategory) {
            // Check direct ID match (loose equality handles string/number differences)
            matchesCategory = product.category == selectedCategory ||
                (product as any).category_id == selectedCategory;

            // Fallback: Match by name if strictly ID match failed and product.category is a string
            if (!matchesCategory) {
                const selectedCatName = categories.find(c => String(c.id) === String(selectedCategory))?.name;
                if (selectedCatName && typeof product.category === 'string') {
                    matchesCategory = product.category.toLowerCase() === selectedCatName.toLowerCase();
                }
            }
        }

        const searchLower = searchQuery.trim().toLowerCase();
        // Si no hay búsqueda pero hay categoría seleccionada, asumimos true para el search
        const matchesSearch = searchLower === '' ? true : (product.name && product.name.toLowerCase().includes(searchLower)) ||
            (product.code && typeof product.code === 'string' && product.code.toLowerCase().includes(searchLower));

        return matchesCategory && matchesSearch;
    });

    const handleCheckoutRequest = (paymentMethod: string) => {
        if (cart.length === 0) return;
        setPendingPaymentMethod(paymentMethod);
        setIsCheckoutOpen(true);
        setIsCartOpen(false); // Close cart panel on mobile when checkout starts
    };

    const handleFinalizeCheckout = async ({ customer, type, finalTotal }: { customer: any, type: string, finalTotal: number }) => {
        try {
            // customer is the full customer object selected in modal
            const customerId = customer?.id ?? null;
            const docType = type || 'boleta';

            const saleId = await registerSale(cart, finalTotal, pendingPaymentMethod, customerId, docType);

            clearCart();
            // setIsCheckoutOpen(false); // Handled by CheckoutModal to allow printing
            setPendingPaymentMethod(null);
            return saleId;
        } catch (error) {
            console.error("Sale failed", error);
            return undefined;
        }
    };

    if (loadingProducts) return <div className="p-8">Cargando inventario...</div>;

    const taxRate = Number(companyData?.taxRate) || 0;
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="flex h-full bg-content-bg overflow-hidden relative">
            {/* Main Product Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="p-4 md:p-6 pb-2">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative w-full max-w-md group">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-primary' : 'text-gray-400'}`} size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o código de producto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm placeholder:text-gray-400 font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-400 transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-[22px] flex gap-1 overflow-x-auto scrollbar-hide w-max max-w-full">
                        {displayCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 sm:px-7 sm:py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 whitespace-nowrap ${selectedCategory === cat.id
                                    ? 'bg-primary text-white z-10'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-2">
                    <div className="flex flex-col gap-3 pb-24">
                        {filteredProducts.map(product => {
                            const categoryName = categories.find(c => String(c.id) === String(product.category_id || product.category))?.name || product.category || 'General';
                            const isInCart = cart.some(item => String(item.id) === String(product.id));
                            return (
                                <ProductCard
                                    key={product.id}
                                    product={{ ...product, category: categoryName }}
                                    onAdd={addToCart}
                                    currency={companyData?.currency || '$'}
                                    isDisabled={isInCart}
                                />
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 md:p-20 text-gray-400 text-center">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p className="text-lg md:text-xl font-medium">
                                    {searchQuery.trim() === ''
                                        ? 'Comienza a escribir para buscar productos'
                                        : 'No se encontraron productos'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile View Cart Button */}
            {cartCount > 0 && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="md:hidden fixed bottom-20 right-6 z-40 bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 animate-bounce-subtle"
                >
                    <ShoppingCart size={24} />
                    <span className="bg-white text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                        {cartCount}
                    </span>
                </button>
            )}

            {/* Cart Panel - Overlay on mobile */}
            <div className={`
                fixed inset-0 z-[60] md:relative md:inset-auto md:z-30 md:flex
                ${isCartOpen ? 'flex' : 'hidden'}
            `}>
                <div
                    className="absolute inset-0 bg-black/50 md:hidden"
                    onClick={() => setIsCartOpen(false)}
                />
                <CartPanel
                    cart={cart}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    onCheckout={handleCheckoutRequest}
                    onClear={() => setShowClearConfirm(true)}
                    taxRate={taxRate}
                    currency={companyData?.currency || '$'}
                    onClose={() => setIsCartOpen(false)}
                />
            </div>

            {/* Checkout Modal */}
            {isCheckoutOpen && (
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    onConfirm={handleFinalizeCheckout}
                    cart={cart}
                    taxRate={taxRate}
                    currency={companyData?.currency || '$'}
                    companyData={companyData}
                    customers={customers}
                />
            )}

            {/* Clear Cart Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={26} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">¿Vaciar Carrito?</h3>
                            <p className="text-sm text-gray-400 font-medium">Se eliminarán todos los productos seleccionados.</p>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
                            >
                                <X size={16} />
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    clearCart();
                                    setShowClearConfirm(false);
                                }}
                                className="flex-1 py-3 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all text-sm shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                Vaciar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
