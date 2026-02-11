import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Product } from '../types/models';

export interface CartItem extends Product {
    quantity: number;
    subtotal: number;
}

interface CartContextType {
    cart: CartItem[];
    total: number;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string | number) => void;
    updateQuantity: (productId: string | number, newQuantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const newTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
        setTotal(newTotal);
    }, [cart]);

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => String(item.id) === String(product.id));

        if (existingItem) {
            if (existingItem.quantity + 1 > product.stock) {
                toast.error(`Stock insuficiente para ${product.name}`, { id: 'stock-error' });
                return;
            }
            toast.success('Producto agregado', { id: 'cart-success' });
            setCart(prevCart => prevCart.map((item) =>
                String(item.id) === String(product.id)
                    ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                    : item
            ));
        } else {
            if (product.stock < 1) {
                toast.error('Producto sin stock', { id: 'stock-error' });
                return;
            }
            const price = Number(product.price);
            toast.success('Producto agregado', { id: 'cart-success' });
            setCart(prevCart => [...prevCart, { ...product, price, quantity: 1, subtotal: price }]);
        }
    };

    const removeFromCart = (productId: string | number) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
        toast.success('Producto eliminado');
    };

    const updateQuantity = (productId: string | number, newQuantity: number) => {
        if (newQuantity < 1) return;

        const item = cart.find(i => i.id === productId);
        if (!item) return;

        // Verify stock
        if (newQuantity > item.stock) {
            toast.error(`Stock máximo alcanzado para ${item.name}`);
            return;
        }

        setCart(prevCart => prevCart.map(i =>
            i.id === productId
                ? { ...i, quantity: newQuantity, subtotal: newQuantity * i.price }
                : i
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    const value = {
        cart,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
