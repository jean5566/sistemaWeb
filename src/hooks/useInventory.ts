import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Product, ProductBase } from '../types/models';
import { api } from '../api/http';

// Helper to ensure types
const mapProductTypes = (p: any): Product => ({
    ...p,
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    min_stock: Number(p.min_stock) || 0,
    // Ensure these fields exist if API doesn't return them to satisfy type
    name: p.name || '',
    category: p.category || '',
    code: p.code || '',
    created_at: p.created_at
});

export const useInventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get<Product[]>('/inventory.php');
            if (Array.isArray(data)) {
                setProducts(data.map(mapProductTypes));
            } else {
                console.error('Inventory format invalid:', data);
                setProducts([]);
            }
        } catch (err: any) {
            setError(err.message);
            toast.error('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const addProduct = async (productData: ProductBase | any) => {
        try {
            // Ensure numeric values
            const payload = {
                ...productData,
                price: parseFloat(productData.price),
                stock: parseInt(productData.stock),
                min_stock: parseInt(productData.min_stock || 0),
                code: productData.code
            };

            const data = await api.post<Product>('/inventory.php', payload);
            const safeData = mapProductTypes(data);

            setProducts((prev) => [...prev, safeData]);
            toast.success('Producto creado exitosamente');
            return safeData;
        } catch (err: any) {
            console.error(err);
            toast.error('Error al crear producto: ' + err.message);
            throw err;
        }
    };

    const updateProduct = async (id: string | number, updates: Partial<Product>) => {
        try {
            const payload = { ...updates, id };

            const data = await api.put<Product>('/inventory.php', payload);
            const safeData = mapProductTypes(data);

            setProducts((prev) =>
                prev.map((p) => (p.id === id ? safeData : p))
            );
            toast.success('Producto actualizado');
            return safeData;
        } catch (err: any) {
            console.error(err);
            toast.error('Error al actualizar: ' + err.message);
            throw err;
        }
    };

    const deleteProduct = async (id: string | number) => {
        try {
            await api.delete(`/inventory.php?id=${id}`);

            setProducts((prev) => prev.filter(p => p.id !== id));
            toast.success('Producto eliminado');
        } catch (err: any) {
            console.error(err);
            toast.error('Error al eliminar: ' + err.message);
            throw err;
        }
    };

    return {
        products,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        refresh: fetchProducts
    };
};
