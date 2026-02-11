import { useState } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
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

    // Filter Logic
    const filteredProducts = products.filter(product => {
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

        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
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
            const customerId = customer?.id;
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
                                placeholder="Buscar por nombre de producto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm placeholder:text-gray-400 font-medium"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-[22px] flex gap-1 overflow-x-auto scrollbar-hide w-max max-w-full">
                        {displayCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-7 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 whitespace-nowrap ${selectedCategory === cat.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105 z-10'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 pb-24">
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
                            <div className="col-span-full flex flex-col items-center justify-center p-20 text-gray-400">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p className="text-xl font-medium">No se encontraron productos</p>
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
        </div>
    );
}
