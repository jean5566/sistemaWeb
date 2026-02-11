import { useCompany } from '../context/CompanyContext';

export function useCompanyData() {
    const { companyData, loading, updateCompanyData, refreshCompanyData } = useCompany();

    return {
        companyData,
        loading,
        updateCompanyData,
        refreshCompanyData
    };
}
