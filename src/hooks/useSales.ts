import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/http';
import { SaleTransaction } from '../types/models';

import { Sale } from '../types/models';

export function useSales() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            // Define a type for the raw API response if strictly needed, or use any for legacy shape
            const data = await api.get<any[]>('sales.php');

            if (Array.isArray(data)) {
                // Transform data to match UI expectations
                // Transform data to match UI expectations
                const formattedSales: Sale[] = data.map(sale => ({
                    id: sale.id,
                    date: new Date(sale.created_at).toLocaleDateString(),
                    total: parseFloat(sale.total),
                    payment_method: sale.payment_method,
                    document_type: sale.document_type,
                    created_at: sale.created_at,
                    customers: sale.customers ? {
                        id: 0, // ID not always returned in nested object, but required by interface
                        name: sale.customers.name,
                        document_id: sale.customers.document_id,
                        email: sale.customers.email,
                        phone: sale.customers.phone
                    } : undefined,
                    items: sale.items?.map((item: any) => ({
                        product_id: item.product_id || 0,
                        quantity: Number(item.quantity),
                        price: Number(item.unit_price),
                        name: item.product_name // Mapped from PHP join
                    })) || []
                }));
                setSales(formattedSales);
            } else {
                console.error('Sales format invalid:', data);
                setSales([]);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
            // toast.error('Error al cargar historial de ventas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const registerSale = async (cartItems: any[], total: number, paymentMethod: string | null, customerId: string | number | null, documentType: string) => {
        try {
            const transactionData: SaleTransaction = {
                customer_id: customerId || undefined,
                total: total,
                payment_method: paymentMethod || 'Efectivo',
                document_type: documentType,
                items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    unit_price: item.price
                }))
            };

            // Using the new API wrapper
            const response = await api.post<{ id: string | number }>('sales.php', transactionData);

            toast.success('Venta registrada con éxito');
            fetchSales(); // Refresh history
            return response.id;
        } catch (error) {
            toast.error('Error al registrar venta');
            throw error;
        }
    };

    return {
        sales,
        loading,
        registerSale,
        refreshSales: fetchSales
    };
}
