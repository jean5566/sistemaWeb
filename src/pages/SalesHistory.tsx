import { useState, useEffect, useRef } from 'react';
import { Search, Eye, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ReceiptText, FileText } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { api } from '../api/http';
import { Sale } from '../types/models';
import toast from 'react-hot-toast';
import { Receipt } from '../components/Receipt';
import { useCompanyData } from '../hooks/useCompanyData';

const ITEMS_PER_PAGE = 10;

export default function SalesHistory() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const { companyData, refreshCompanyData } = useCompanyData();
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Comprobante_${selectedSale?.id || 'Venta'}`
    });

    // Server-side pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [totalSales, setTotalSales]   = useState(0);

    // Debounce search to avoid a request on every keystroke
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchSales(1, searchTerm);
    }, []);

    const fetchSales = async (page: number, search: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page:   String(page),
                limit:  String(ITEMS_PER_PAGE),
                search: search.trim()
            });
            const response = await api.get<any>(`/sales.php?${params}`);
            const data = response?.data ?? (Array.isArray(response) ? response : []);
            setSales(data);
            setTotalPages(response?.pages  ?? 1);
            setTotalSales(response?.total  ?? data.length);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching sales:', error);
            toast.error('Error al cargar historial de ventas');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        if (searchRef.current) clearTimeout(searchRef.current);
        searchRef.current = setTimeout(() => fetchSales(1, val), 400);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        fetchSales(page, searchTerm);
    };

    // paginatedSales is now directly the server response
    const paginatedSales = sales;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    if (loading && sales.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Cargando historial de ventas...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Header - Hidden on mobile to save space */}
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Historial de Ventas</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Registro de transacciones realizadas</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                    <ReceiptText size={16} className="text-primary" />
                    <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Total: {totalSales}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-50 dark:border-gray-700/50 flex flex-col sm:flex-row gap-4 items-center bg-gray-50/30 dark:bg-gray-800/20">
                    <div className="relative w-full max-w-md group text-left">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-primary' : 'text-gray-400'}`} size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o ID de venta..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-11 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => handleSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-400 transition-all"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 uppercase tracking-widest text-xs font-semibold border-b border-gray-100 dark:border-gray-700">
                                <th className="px-5 py-3">ID Venta</th>
                                <th className="px-5 py-3">Fecha</th>
                                <th className="px-5 py-3">Cliente</th>
                                <th className="px-5 py-3">Total</th>
                                <th className="px-5 py-3">Estado SRI</th>
                                <th className="w-12 px-2 py-1 text-right">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {paginatedSales.map(sale => (
                                <tr key={sale.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-5 py-4 font-mono text-sm font-semibold text-primary">
                                        #{sale.id}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'S/F'}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-semibold">
                                            {sale.created_at ? new Date(sale.created_at).toLocaleTimeString() : '-'}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">
                                        {sale.customers?.name || sale.customer_name || 'Consumidor Final'}
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400 text-base">
                                        ${Number(sale.total).toFixed(2)}
                                    </td>
                                    <td className="px-5 py-4">
                                        {sale.sri_status === 'AUTHORIZED' && (
                                            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide border border-emerald-200">
                                                Autorizado
                                            </span>
                                        )}
                                        {sale.sri_status === 'PENDING' && (
                                            <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wide border border-yellow-200">
                                                Pendiente
                                            </span>
                                        )}
                                        {sale.sri_status === 'REJECTED' && (
                                            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wide border border-red-200">
                                                Rechazado
                                            </span>
                                        )}
                                        {!sale.sri_status && (
                                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide border border-gray-200">
                                                N/A
                                            </span>
                                        )}
                                    </td>
                                    <td className="w-12 px-2 py-1 text-right">
                                        <button
                                            onClick={() => setSelectedSale(sale)}
                                            className="p-1 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all active:scale-95"
                                            title="Ver detalles"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Hidden on mobile */}
                <div className="hidden md:flex p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center sm:text-left">
                        Mostrando <span className="text-gray-900 dark:text-white">{totalSales === 0 ? 0 : startIndex + 1}</span> - <span className="text-gray-900 dark:text-white">{Math.min(startIndex + ITEMS_PER_PAGE, totalSales)}</span> de <span className="text-gray-900 dark:text-white">{totalSales}</span> ventas
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1 || loading}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1 px-3">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Página {currentPage} de {totalPages || 1}</span>
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0 || loading}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0 || loading}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedSale && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-5 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Comprobante #{selectedSale.id}</h3>
                                <p className="text-gray-400 text-[10px] mt-0.5 font-bold uppercase tracking-widest">Resumen detallado de la transacción</p>
                            </div>
                            <button
                                onClick={() => {
                                    refreshCompanyData();
                                    setSelectedSale(null);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-sm transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Left Column: Info */}
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Cliente</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                                    {selectedSale.customers?.name || selectedSale.customer_name || 'Consumidor Final'}
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-medium">Doc: {selectedSale.customers?.document_id || 'S/I'}</p>
                                            </div>
                                            <div className="sm:text-right space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Emisión</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                                    {selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleDateString() : 'S/F'}
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-medium tracking-wide font-mono">
                                                    {selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleTimeString() : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SRI Information Block */}
                                    {selectedSale.sri_status && (
                                        <div className="bg-gray-50/50 dark:bg-gray-700/20 p-5 rounded-2xl border border-gray-100 dark:border-gray-600">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 leading-none">Información Electrónica (SRI)</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Estado:</span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedSale.sri_status === 'AUTHORIZED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                                                        {selectedSale.sri_status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Clave de Acceso:</span>
                                                    <span className="font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all select-all bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 leading-normal">
                                                        {selectedSale.sri_access_key || '-'}
                                                    </span>
                                                </div>
                                                {selectedSale.sri_message && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Mensaje:</span>
                                                        <span className="text-[10px] text-red-500 font-bold p-2 bg-red-50 rounded-lg border border-red-100">
                                                            {selectedSale.sri_message}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Totals */}
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col justify-center h-full min-h-[220px]">
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                                <span>Subtotal Base:</span>
                                                <span className="font-mono">${(Number(selectedSale.total) / (1 + (Number(companyData.taxRate) / 100))).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                                <span>Impuestos ({companyData.taxRate}%):</span>
                                                <span className="font-mono">${(Number(selectedSale.total) - (Number(selectedSale.total) / (1 + (Number(companyData.taxRate) / 100)))).toFixed(2)}</span>
                                            </div>

                                            <div className="pt-6 border-t-2 border-dashed border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1">
                                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Total a Pagar</span>
                                                <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                                    ${Number(selectedSale.total).toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-center mt-2">
                                                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                                    {selectedSale.payment_method || 'Efectivo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700">
                            <button
                                onClick={() => handlePrint()}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-xl hover:brightness-110 transition-all text-sm shadow-lg shadow-primary/20 min-w-[200px] justify-center active:scale-95 uppercase tracking-wider"
                            >
                                <FileText size={18} />
                                Abrir Comprobante (PDF)
                            </button>
                            <button
                                onClick={() => setSelectedSale(null)}
                                className="px-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-sm shadow-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Receipt for Printing */}
            <div style={{ display: 'none' }}>
                {selectedSale && (
                    <Receipt
                        ref={receiptRef}
                        company={companyData}
                        saleId={selectedSale.id}
                        date={selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleString() : ''}
                        customer={{
                            id: selectedSale.customer_id as any,
                            name: selectedSale.customers?.name || selectedSale.customer_name || 'Consumidor Final',
                            docId: selectedSale.customers?.document_id || '-',
                            email: selectedSale.customers?.email,
                            phone: selectedSale.customers?.phone
                        }}
                        items={selectedSale.items?.map(item => ({
                            id: item.product_id as any,
                            name: item.name || (item as any).product_name || 'Producto',
                            price: Number(item.price || (item as any).unit_price),
                            unit_price: Number(item.price || (item as any).unit_price),
                            quantity: Number(item.quantity) || 0,
                            category: ''
                        })) as any[]}
                        subtotal={Number(selectedSale.total) / (1 + (Number(companyData.taxRate) / 100))}
                        tax={Number(selectedSale.total) - (Number(selectedSale.total) / (1 + (Number(companyData.taxRate) / 100)))}
                        total={Number(selectedSale.total)}
                        currency="$"
                        docType={selectedSale.document_type || 'ticket'}
                        sriAccessKey={selectedSale.sri_access_key}
                        sriAuthDate={selectedSale.sri_auth_date}
                    />
                )}
            </div>
        </div>
    );
}

