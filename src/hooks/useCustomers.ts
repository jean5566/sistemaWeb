import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/http';
import { Customer } from '../types/models';

// Field mapping: frontend (camelCase) -> database (snake_case)
// const fieldMap: Record<string, string> = { ... } // Removed as we use explicit mapping functions now

// Reverse mapping: database -> frontend
// We manually define this to avoid complex inference or runtime overhead if manageable
const dbToFrontend = (dbData: any): Customer | null => {
    if (!dbData) return null;
    return {
        id: dbData.id,
        name: dbData.name,
        document_id: dbData.document_id,
        cedula: dbData.document_id, // Legacy support
        docId: dbData.document_id, // Legacy support
        email: dbData.email,
        phone: dbData.phone,
        address: dbData.address,
        created_at: dbData.created_at
    };
};

const frontendToDb = (frontendData: any) => {
    const result: any = {};
    if (frontendData.name) result.name = frontendData.name;
    if (frontendData.email) result.email = frontendData.email;
    if (frontendData.phone) result.phone = frontendData.phone;
    if (frontendData.address) result.address = frontendData.address;

    // Prefer document_id, fallback to cedula/docId
    if (frontendData.document_id) result.document_id = frontendData.document_id;
    else if (frontendData.cedula) result.document_id = frontendData.cedula;
    else if (frontendData.docId) result.document_id = frontendData.docId;

    return result;
};

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await api.get<any[]>('customers.php');

            if (Array.isArray(data)) {
                // Convert all customers from DB format to frontend format
                const frontendData = data.map(customer => dbToFrontend(customer)).filter((c): c is Customer => c !== null);
                setCustomers(frontendData);
            } else {
                console.error('Customers format invalid:', data);
                setCustomers([]);
            }
        } catch (error) {
            console.error(error);
            // toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const addCustomer = async (customerData: Partial<Customer>) => {
        try {
            // Convert frontend data to DB format
            const dbPayload = frontendToDb(customerData);

            const data = await api.post<any>('customers.php', dbPayload);

            // Convert back to frontend format
            const frontendData = dbToFrontend(data);
            if (frontendData) {
                setCustomers(prev => [...prev, frontendData]);
                toast.success('Cliente agregado');
                return frontendData;
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Error al agregar cliente');
            throw error;
        }
    };

    const updateCustomer = async (id: string | number, updates: Partial<Customer>) => {
        try {
            // Convert frontend updates to DB format
            const dbUpdates = frontendToDb(updates);
            // Include ID in body for API if needed, or just params. 
            // The legacy code put ID in body for PUT.
            const payload = { ...dbUpdates, id };

            const data = await api.put<any>('customers.php', payload);

            // Convert back to frontend format
            const frontendData = dbToFrontend(data);
            if (frontendData) {
                setCustomers(prev => prev.map(c => c.id === id ? frontendData : c));
                toast.success('Cliente actualizado');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            toast.error('Error al actualizar cliente');
            throw error;
        }
    };

    const deleteCustomer = async (id: string | number) => {
        try {
            await api.delete(`customers.php?id=${id}`);
            setCustomers(prev => prev.filter(c => c.id !== id));
            toast.success('Cliente eliminado');
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error('Error al eliminar cliente');
        }
    };

    return {
        customers,
        loading,
        addCustomer,
        updateCustomer,
        deleteCustomer
    };
}
