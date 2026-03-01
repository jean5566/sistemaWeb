import { useState, useEffect, useRef } from 'react';
import { Search, Eye, X, ReceiptText, FileText, CalendarDays, Filter, UploadCloud } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { api } from '../api/http';
import { Sale } from '../types/models';
import toast from 'react-hot-toast';
import { Receipt } from '../components/Receipt';
import { useCompanyData } from '../hooks/useCompanyData';

const ITEMS_PER_PAGE = 10;

type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const toISO = (d: Date) => d.toISOString().split('T')[0];

const getPresetDates = (preset: DatePreset): { from: string; to: string } => {
    const now = new Date();
    const today = toISO(now);
    if (preset === 'today') return { from: today, to: today };
    if (preset === 'yesterday') {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        const yStr = toISO(y);
        return { from: yStr, to: yStr };
    }
    if (preset === 'week') {
        const w = new Date(now); w.setDate(w.getDate() - 6);
        return { from: toISO(w), to: today };
    }
    if (preset === 'month') {
        return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today };
    }
    return { from: '', to: '' };
};

export default function Facturas() {
    const [facturas, setFacturas] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFactura, setSelectedFactura] = useState<Sale | null>(null);
    const { companyData, refreshCompanyData } = useCompanyData();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [uploadingSri, setUploadingSri] = useState<number | null>(null);

    const handleUploadToSri = async (saleId: number) => {
        setUploadingSri(saleId);
        try {
            await api.post('/sri-upload.php', { sale_id: saleId });
            toast.success('Factura autorizada exitosamente');
            // Refresh list
            const { from, to } = getActiveDates();
            fetchFacturas(currentPage, searchTerm, from, to);
            // Close modal to see the updated status
            setSelectedFactura(null);
        } catch (error: any) {
            console.error(error);
            toast.error(error.data?.error || 'Error al subir la factura al SRI');
        } finally {
            setUploadingSri(null);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Comprobante_${selectedFactura?.id || 'Venta'}`
    });

    // Server-side pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalFacturas, setTotalFacturas] = useState(0);

    // Date filter state
    const [activePreset, setActivePreset] = useState<DatePreset>('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    // Debounce search
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchFacturas(1, searchTerm, '', '');
    }, []);

    const fetchFacturas = async (page: number, search: string, from: string, to: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
                search: search.trim(),
                document_type: 'factura',
            });
            if (from) params.set('date_from', from);
            if (to) params.set('date_to', to);
            const response = await api.get<any>(`/sales.php?${params}`);
            const data = response?.data ?? (Array.isArray(response) ? response : []);
            setFacturas(data);
            setTotalPages(response?.pages ?? 1);
            setTotalFacturas(response?.total ?? data.length);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching facturas:', error);
            toast.error('Error al cargar Facturas Emitidas');
        } finally {
            setLoading(false);
        }
    };

    const getActiveDates = () => {
        if (activePreset === 'custom') return { from: customFrom, to: customTo };
        if (activePreset === 'all') return { from: '', to: '' };
        return getPresetDates(activePreset);
    };

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        if (searchRef.current) clearTimeout(searchRef.current);
        const { from, to } = getActiveDates();
        searchRef.current = setTimeout(() => fetchFacturas(1, val, from, to), 400);
    };

    const handlePresetChange = (preset: DatePreset) => {
        setActivePreset(preset);
        if (preset === 'custom') return; // wait for user to pick dates
        const { from, to } = preset === 'all' ? { from: '', to: '' } : getPresetDates(preset);
        fetchFacturas(1, searchTerm, from, to);
    };

    const handleCustomDateApply = () => {
        if (!customFrom || !customTo) return;
        fetchFacturas(1, searchTerm, customFrom, customTo);
    };

    const clearFilters = () => {
        setActivePreset('all');
        setCustomFrom('');
        setCustomTo('');
        setSearchTerm('');
        fetchFacturas(1, '', '', '');
    };

    const hasActiveFilter = activePreset !== 'all' || searchTerm !== '';
    const paginatedFacturas = facturas;

    const PRESETS: { key: DatePreset; label: string }[] = [
        { key: 'all', label: 'Todo' },
        { key: 'today', label: 'Hoy' },
        { key: 'yesterday', label: 'Ayer' },
        { key: 'week', label: '7 días' },
        { key: 'month', label: 'Este mes' },
        { key: 'custom', label: 'Rango' },
    ];

    if (loading && facturas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Cargando Facturas Emitidas...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Header - Hidden on mobile to save space */}
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Facturas Emitidas</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Registro de transacciones realizadas</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                    <ReceiptText size={16} className="text-primary" />
                    <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Total: {totalFacturas}</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="flex flex-col gap-3 shrink-0 z-10">

                    {/* Search + clear filters */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-md group text-left">
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
                        {hasActiveFilter && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-red-100 dark:border-red-900/30 whitespace-nowrap"
                            >
                                <X size={12} />
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {/* Date preset pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                            <CalendarDays size={12} />
                            Período:
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {PRESETS.map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => handlePresetChange(p.key)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activePreset === p.key
                                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary/50'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom date inputs — visible only when preset = custom */}
                    {activePreset === 'custom' && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                                <Filter size={12} />
                                Rango:
                            </div>
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 dark:text-gray-300 font-semibold"
                            />
                            <span className="text-[10px] font-black text-gray-400">hasta</span>
                            <input
                                type="date"
                                value={customTo}
                                min={customFrom}
                                onChange={e => setCustomTo(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 dark:text-gray-300 font-semibold"
                            />
                            <button
                                onClick={handleCustomDateApply}
                                disabled={!customFrom || !customTo}
                                className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl disabled:opacity-40 hover:brightness-110 transition-all"
                            >
                                Aplicar
                            </button>
                        </div>
                    )}

                    {/* Active filter summary */}
                    {activePreset !== 'all' && (
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                                {activePreset === 'custom' && customFrom && customTo
                                    ? `${new Date(customFrom + 'T00:00:00').toLocaleDateString('es-ES')} — ${new Date(customTo + 'T00:00:00').toLocaleDateString('es-ES')}`
                                    : activePreset === 'today' ? 'Mostrando: Hoy'
                                        : activePreset === 'yesterday' ? 'Mostrando: Ayer'
                                            : activePreset === 'week' ? 'Mostrando: Últimos 7 días'
                                                : activePreset === 'month' ? 'Mostrando: Este mes'
                                                    : ''
                                }
                            </span>
                            {!loading && (
                                <span className="text-[9px] font-black text-gray-400">
                                    · {totalFacturas} resultado{totalFacturas !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Cards List View */}
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="flex flex-col gap-3 pb-4">
                        {paginatedFacturas.map(sale => (
                            <div key={sale.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-4 group">
                                {/* Left Section: ID, Date & Status */}
                                <div className="flex-shrink-0 w-full sm:w-48 flex sm:flex-col justify-between sm:justify-start gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-lg font-black text-primary">#{sale.id}</span>
                                        {sale.sri_status === 'AUTHORIZED' && (
                                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">
                                                Autorizado
                                            </span>
                                        )}
                                        {sale.sri_status === 'PENDING' && (
                                            <span className="px-2 py-0.5 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[9px] font-black uppercase tracking-wider border border-yellow-100 dark:border-yellow-500/20">
                                                Pendiente
                                            </span>
                                        )}
                                        {sale.sri_status === 'REJECTED' && (
                                            <span className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-wider border border-red-100 dark:border-red-500/20">
                                                Rechazado
                                            </span>
                                        )}
                                        {!sale.sri_status && (
                                            <span className="px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-[9px] font-black uppercase tracking-wider border border-gray-200 dark:border-gray-600">
                                                N/A
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                                        <CalendarDays size={10} />
                                        {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'S/F'} · {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </span>
                                </div>

                                {/* Middle Section: Cliente */}
                                <div className="flex-1 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700 pt-3 sm:pt-0 sm:pl-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Cliente</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">
                                        {sale.customers?.name || sale.customer_name || 'Consumidor Final'}
                                    </p>
                                </div>

                                {/* Right Section: Total & Actions */}
                                <div className="flex-shrink-0 flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0">
                                    <div className="flex flex-col text-left sm:text-right">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Total</span>
                                        <span className="font-black text-lg text-emerald-600 dark:text-emerald-400 leading-none">
                                            ${Number(sale.total).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {sale.sri_status !== 'AUTHORIZED' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUploadToSri(sale.id as number);
                                                }}
                                                disabled={uploadingSri === sale.id}
                                                className="p-2 flex items-center gap-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                                                title="Subir al SRI"
                                            >
                                                <UploadCloud size={16} className={uploadingSri === sale.id ? 'animate-bounce' : ''} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedFactura(sale)}
                                            className="p-2 bg-primary/5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all active:scale-95 border border-primary/10 hover:border-primary/20"
                                            title="Ver detalles"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {paginatedFacturas.length === 0 && !loading && (
                        <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                            <ReceiptText size={48} className="opacity-20" />
                            <p className="font-black uppercase tracking-widest text-sm">Sin resultados</p>
                        </div>
                    )}
                </div>


            </div>

            {selectedFactura && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">Comprobante #{selectedFactura.id}</h3>
                                <p className="text-gray-400 text-[10px] mt-0.5 font-bold uppercase tracking-widest">Resumen detallado de la transacción</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedFactura.sri_status !== 'AUTHORIZED' && (
                                    <button
                                        onClick={() => handleUploadToSri(selectedFactura.id as number)}
                                        disabled={uploadingSri === selectedFactura.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-black rounded-xl hover:brightness-110 transition-all text-xs shadow-sm shadow-blue-500/20 active:scale-95 uppercase tracking-wider disabled:opacity-50"
                                        title="Subir al SRI"
                                    >
                                        <UploadCloud size={16} className={uploadingSri === selectedFactura.id ? 'animate-bounce' : ''} />
                                        <span className="hidden sm:inline">{uploadingSri === selectedFactura.id ? 'Subiendo...' : 'Subir al SRI'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        refreshCompanyData();
                                        setSelectedFactura(null);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-sm transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh] space-y-5">

                            {/* Row 1: Cliente + Fecha */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Cliente</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                        {selectedFactura.customers?.name || selectedFactura.customer_name || 'Consumidor Final'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        Doc: {selectedFactura.customers?.document_id || 'S/I'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Emisión</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                        {selectedFactura.created_at ? new Date(selectedFactura.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'S/F'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-mono">
                                        {selectedFactura.created_at ? new Date(selectedFactura.created_at).toLocaleTimeString() : '-'}
                                        {selectedFactura.payment_method && (
                                            <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black not-italic uppercase tracking-wider text-[9px]">
                                                {selectedFactura.payment_method}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Row 2: Productos vendidos */}
                            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Productos vendidos
                                    </p>
                                    {selectedFactura.items && selectedFactura.items.length > 0 && (
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                                            {selectedFactura.items.length} ítem{selectedFactura.items.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                {selectedFactura.items && selectedFactura.items.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-50 dark:border-gray-700/50">
                                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Cant.</th>
                                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">P. Unit.</th>
                                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                            {selectedFactura.items.map((item, idx) => {
                                                const unitPrice = Number(item.price || item.unit_price || 0);
                                                const qty = Number(item.quantity);
                                                const subtotal = unitPrice * qty;
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[9px] font-black shrink-0">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                                                    {item.name || `Producto #${item.product_id}`}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-sm font-black text-gray-700 dark:text-gray-300">{qty}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">${unitPrice.toFixed(2)}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">${subtotal.toFixed(2)}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="px-4 py-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-50">
                                        Sin detalle de ítems disponible
                                    </div>
                                )}
                            </div>

                            {/* Row 3: Totales + SRI */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

                                {/* SRI Block (solo si aplica) */}
                                {selectedFactura.sri_status ? (
                                    <div className="bg-gray-50/50 dark:bg-gray-700/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Información SRI</h4>
                                        <div className="flex justify-between items-center bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Estado:</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedFactura.sri_status === 'AUTHORIZED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                                                {selectedFactura.sri_status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Clave de Acceso:</span>
                                            <span className="font-mono text-[9px] text-gray-600 dark:text-gray-300 break-all select-all bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 leading-relaxed">
                                                {selectedFactura.sri_access_key || '-'}
                                            </span>
                                        </div>
                                        {selectedFactura.sri_message && (
                                            <span className="block text-[10px] text-red-500 font-bold p-2 bg-red-50 rounded-lg border border-red-100">
                                                {selectedFactura.sri_message}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div />
                                )}

                                {/* Totales */}
                                <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <span>Subtotal Base:</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300">
                                            ${selectedFactura.subtotal != null
                                                ? Number(selectedFactura.subtotal).toFixed(2)
                                                : (Number(selectedFactura.total) / (1 + (Number(companyData.taxRate) / 100))).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <span>IVA ({companyData.taxRate}%):</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300">
                                            ${selectedFactura.tax_amount != null
                                                ? Number(selectedFactura.tax_amount).toFixed(2)
                                                : (Number(selectedFactura.total) - (Number(selectedFactura.total) / (1 + (Number(companyData.taxRate) / 100)))).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t-2 border-dashed border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Total</span>
                                        <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                            ${Number(selectedFactura.total).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row justify-end gap-3 bg-gray-50/50 dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700">
                            <button
                                onClick={() => handlePrint()}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-xl hover:brightness-110 transition-all text-sm shadow-lg shadow-primary/20 justify-center active:scale-95 uppercase tracking-wider"
                            >
                                <FileText size={18} />
                                Abrir Comprobante (PDF)
                            </button>
                            <button
                                onClick={() => setSelectedFactura(null)}
                                className="px-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-sm shadow-sm text-center"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Receipt for Printing */}
            <div style={{ display: 'none' }}>
                {selectedFactura && (
                    <Receipt
                        ref={receiptRef}
                        company={companyData}
                        saleId={selectedFactura.id}
                        date={selectedFactura.created_at ? new Date(selectedFactura.created_at).toLocaleString() : ''}
                        customer={{
                            id: selectedFactura.customer_id as any,
                            name: selectedFactura.customers?.name || selectedFactura.customer_name || 'Consumidor Final',
                            docId: selectedFactura.customers?.document_id || '-',
                            email: selectedFactura.customers?.email,
                            phone: selectedFactura.customers?.phone
                        }}
                        items={selectedFactura.items?.map(item => ({
                            id: item.product_id as any,
                            name: item.name || (item as any).product_name || 'Producto',
                            price: Number(item.price || (item as any).unit_price),
                            unit_price: Number(item.price || (item as any).unit_price),
                            quantity: Number(item.quantity) || 0,
                            category: ''
                        })) as any[]}
                        subtotal={selectedFactura.subtotal != null
                            ? Number(selectedFactura.subtotal)
                            : Number(selectedFactura.total) / (1 + (Number(companyData.taxRate) / 100))}
                        tax={selectedFactura.tax_amount != null
                            ? Number(selectedFactura.tax_amount)
                            : Number(selectedFactura.total) - (Number(selectedFactura.total) / (1 + (Number(companyData.taxRate) / 100)))}
                        total={Number(selectedFactura.total)}
                        currency="$"
                        docType={selectedFactura.document_type || 'ticket'}
                        sriAccessKey={selectedFactura.sri_access_key}
                        sriAuthDate={selectedFactura.sri_auth_date}
                    />
                )}
            </div>
        </div>
    );
}

