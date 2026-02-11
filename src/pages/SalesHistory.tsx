import { useState, useEffect } from 'react';
import { Search, Eye, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ReceiptText } from 'lucide-react';
import { api } from '../api/http';
import { Sale } from '../types/models';
import toast from 'react-hot-toast';

export default function SalesHistory() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const response = await api.get<any>('/sales.php');
            const allSales = Array.isArray(response) ? response : [];
            setSales(allSales);
        } catch (error) {
            console.error('Error fetching sales:', error);
            toast.error('Error al cargar historial de ventas');
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter((s: Sale) => {
        const lowerTerm = searchTerm.toLowerCase();
        return (
            s.customers?.name?.toLowerCase().includes(lowerTerm) ||
            String(s.id).toLowerCase().includes(lowerTerm) ||
            (s.customer_name && s.customer_name.toLowerCase().includes(lowerTerm))
        );
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

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
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Historial de Ventas</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Registro de transacciones realizadas</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                    <ReceiptText size={16} className="text-primary" />
                    <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Total: {sales.length}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex-1 flex flex-col">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex flex-col sm:flex-row gap-6 items-center bg-gray-50/30 dark:bg-gray-800/20">
                    <div className="relative w-full max-w-md group text-left">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-primary' : 'text-gray-400'}`} size={18} />
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
                                <th className="px-5 py-3 text-right">Detalles</th>
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
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            onClick={() => setSelectedSale(sale)}
                                            className="p-2 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all active:scale-90"
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
                        Mostrando <span className="text-gray-900 dark:text-white">{startIndex + 1}</span> - <span className="text-gray-900 dark:text-white">{Math.min(startIndex + itemsPerPage, filteredSales.length)}</span> de <span className="text-gray-900 dark:text-white">{filteredSales.length}</span> ventas
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1 px-3">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Página {currentPage} de {totalPages || 1}</span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedSale && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Comprobante #{selectedSale.id}</h3>
                                <p className="text-gray-400 text-xs mt-0.5 font-medium uppercase tracking-wider">Detalle completo de la transacción</p>
                            </div>
                            <button
                                onClick={() => setSelectedSale(null)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-sm transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 md:p-8 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información del Cliente</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-base">{selectedSale.customers?.name || selectedSale.customer_name || 'Consumidor Final'}</p>
                                    <p className="text-xs text-gray-500">{selectedSale.customers?.document_id || 'S/I'}</p>
                                </div>
                                <div className="space-y-1 md:text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha de Emisión</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-base">
                                        {selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleDateString() : 'S/F'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleTimeString() : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Resumen de Productos</h4>
                                <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-black uppercase text-[10px]">Descripción</th>
                                                <th className="px-4 py-3 text-right font-black uppercase text-[10px]">Cant.</th>
                                                <th className="px-4 py-3 text-right font-black uppercase text-[10px]">P. Unit.</th>
                                                <th className="px-4 py-3 text-right font-black uppercase text-[10px]">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                            {selectedSale.items?.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/30">
                                                    <td className="px-4 py-3 font-bold text-gray-800 dark:text-white">{item.name}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-black">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">${Number(item.price).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">${(item.quantity * item.price).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-gray-50 dark:border-gray-700">
                                <div className="w-full md:w-72 space-y-3 bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl">
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
                                        <span>Subtotal:</span>
                                        <span>${(Number(selectedSale.total) / 1.15).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
                                        <span>IVA (15%):</span>
                                        <span>${(Number(selectedSale.total) - (Number(selectedSale.total) / 1.15)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-2xl font-black text-emerald-600 dark:text-emerald-400 pt-3 border-t border-gray-200 dark:border-gray-600 mt-3">
                                        <span className="tracking-tight">TOTAL:</span>
                                        <span>${Number(selectedSale.total).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700">
                            <button
                                onClick={() => setSelectedSale(null)}
                                className="px-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-sm shadow-sm"
                            >
                                Cerrar Comprobante
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

