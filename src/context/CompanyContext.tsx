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
    logo?: string;
    sriRegime?: string;
    sriEnvironment?: string;
    sriEstablecimiento?: string;
    sriPuntoEmision?: string;
    accountingObligated?: boolean;
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
        taxRate: Number(dbData.tax_rate) || 0,
        logo: dbData.logo || '',
        sriRegime: dbData.sri_regime || 'GENERAL',
        sriEnvironment: dbData.sri_environment || 'PRUEBAS',
        sriEstablecimiento: dbData.sri_establecimiento || '001',
        sriPuntoEmision: dbData.sri_punto_emision || '001',
        accountingObligated: !!dbData.accounting_obligated,
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
        taxRate: 0,
        logo: '',
        sriRegime: 'GENERAL',
        sriEnvironment: 'PRUEBAS',
        sriEstablecimiento: '001',
        sriPuntoEmision: '001',
        accountingObligated: false,
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        // We only fetch when there is a token.
        // If the user isn't logged in, do not hit the API because Settings require a Tenant ID.
        if (!localStorage.getItem('pos_token')) {
            setLoading(false);
            return;
        }

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
        // On page load: fetch only if already authenticated (token present).
        // After a fresh login, auth:login event triggers the fetch instead.
        const hasToken = !!localStorage.getItem('pos_token');
        if (hasToken) {
            fetchSettings();
        } else {
            setLoading(false);
        }

        // Listen for login events to load settings after a fresh sign-in.
        const handleLogin = () => fetchSettings();
        window.addEventListener('auth:login', handleLogin);
        return () => window.removeEventListener('auth:login', handleLogin);
    }, []);

    useEffect(() => {
        if (companyData.name) {
            document.title = companyData.name;
        }
        if (companyData.logo) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = companyData.logo;
        }
    }, [companyData.name, companyData.logo]);

    const updateCompanyData = async (updates: Partial<CompanyData>) => {
        // Optimistic update
        const previous = companyData;
        setCompanyData({ ...companyData, ...updates });

        try {
            const dbFieldMap: Record<string, string> = {
                taxId: 'tax_id',
                taxRate: 'tax_rate',
                sriRegime: 'sri_regime',
                sriEnvironment: 'sri_environment',
                sriEstablecimiento: 'sri_establecimiento',
                sriPuntoEmision: 'sri_punto_emision',
                accountingObligated: 'accounting_obligated',
            };

            // Build full payload and send in a single request
            const payload: Record<string, any> = {};
            for (const [key, value] of Object.entries(updates)) {
                const dbField = dbFieldMap[key] || key;
                payload[dbField] = value;
            }

            await api.post('settings.php', payload);
            toast.success('Configuración guardada');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Error al guardar configuración');
            // Revert optimistic update on error
            setCompanyData(previous);
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
