import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/http';
import toast from 'react-hot-toast';

export interface CompanyData {
    name: string;
    address: string;
    phone: string;
    taxId: string;
    email: string;
    currency: string;
    taxRate: number;
}

interface CompanyContextType {
    companyData: CompanyData;
    loading: boolean;
    updateCompanyData: (updates: Partial<CompanyData>) => Promise<void>;
    refreshCompanyData: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const dbToFrontend = (dbData: any): CompanyData => {
    return {
        name: dbData.name || '',
        address: dbData.address || '',
        phone: dbData.phone || '',
        taxId: dbData.tax_id || '',
        email: dbData.email || '',
        currency: dbData.currency || '$',
        taxRate: Number(dbData.tax_rate) || 0
    };
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [companyData, setCompanyData] = useState<CompanyData>({
        name: '',
        address: '',
        phone: '',
        taxId: '',
        email: '',
        currency: '$',
        taxRate: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const data = await api.get<any>('settings.php');
            if (data) {
                const frontendData = dbToFrontend(data);
                setCompanyData(frontendData);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateCompanyData = async (updates: Partial<CompanyData>) => {
        // Optimistic update
        const newData = { ...companyData, ...updates };
        setCompanyData(newData);

        try {
            const dbFieldMap: Record<string, string> = {
                taxId: 'tax_id',
                taxRate: 'tax_rate'
            };

            for (const [key, value] of Object.entries(updates)) {
                const dbField = dbFieldMap[key] || key;
                const payload = { [dbField]: value };
                await api.post('settings.php', payload);
            }

            toast.success('Configuración guardada');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Error al guardar configuración');
            // Revert on error? Or just fetch again
            fetchSettings();
        }
    };

    return (
        <CompanyContext.Provider value={{
            companyData,
            loading,
            updateCompanyData,
            refreshCompanyData: fetchSettings
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};
