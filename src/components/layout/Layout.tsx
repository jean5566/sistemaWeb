
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

// Assuming company data might come from another context or prop in future, 
// for now we'll hardcode or simplistic fetch if needed, 
// but Sidebar needs companyName. We can use a useCompany hook or similar.
// For now, let's keep it simple or assume we fetch it.

import { useCompanyData } from '../../hooks/useCompanyData';

export function Layout() {
    const { companyData } = useCompanyData();
    const companyName = companyData?.name || "Pernos y Cauchos JM";

    return (
        <div className="flex h-screen bg-content-bg overflow-hidden">
            <Sidebar companyName={companyName} />
            <main className="flex-1 md:pl-20 h-full pb-16 md:pb-0 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
