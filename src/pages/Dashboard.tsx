
import { ShoppingCart, Package, AlertTriangle, TrendingUp, TrendingDown, Calendar, Banknote, CreditCard, ArrowUpRight, Wallet, DollarSign, BarChart3, Award } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useSales } from '../hooks/useSales';
import { useCompanyData } from '../hooks/useCompanyData';

export default function Dashboard() {
    const { products, loading: loadingInventory } = useInventory();
    const { sales, loading: loadingSales } = useSales();
    const { companyData } = useCompanyData();

    // --- Métricas base ---
    const lowStockProducts = products.filter(p => p.stock <= (p.min_stock || 0));
    const totalProducts = products.length;
    const totalSalesCount = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);

    // --- Hoy vs Ayer ---
    const today = new Date().toDateString();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

    const todaySales = sales.filter(s => s.created_at ? new Date(s.created_at).toDateString() === today : false);
    const yesterdaySales = sales.filter(s => s.created_at ? new Date(s.created_at).toDateString() === yesterday.toDateString() : false);
    const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
    const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + Number(s.total), 0);
    const revenueChangePct = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : null;

    // --- Métricas de negocio ---
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    // --- Top productos vendidos ---
    const productSalesMap = sales.flatMap(s => s.items || []).reduce((acc, item) => {
        const id = String(item.product_id);
        const name = item.name || `#${id}`;
        if (!acc[id]) acc[id] = { name, qty: 0, revenue: 0 };
        acc[id].qty += Number(item.quantity);
        acc[id].revenue += Number(item.quantity) * Number(item.price || item.unit_price || 0);
        return acc;
    }, {} as Record<string, { name: string; qty: number; revenue: number }>);
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 6);
    const maxQty = topProducts[0]?.qty || 1;

    // --- Métodos de pago ---
    const paymentBreakdown = sales.reduce((acc, sale) => {
        const method = sale.payment_method || 'Efectivo';
        if (!acc[method]) acc[method] = { count: 0, total: 0 };
        acc[method].count += 1;
        acc[method].total += Number(sale.total);
        return acc;
    }, {} as Record<string, { count: number; total: number }>);
    const paymentMethods = Object.entries(paymentBreakdown).sort((a, b) => b[1].total - a[1].total);

    if (loadingInventory || loadingSales) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse text-sm">Cargando estadísticas...</p>
            </div>
        );
    }

    const getPaymentIcon = (method: string) => {
        const m = method.toLowerCase();
        if (m.includes('tarjeta') || m.includes('card') || m.includes('débito') || m.includes('crédito')) return CreditCard;
        if (m.includes('transfer') || m.includes('banco')) return ArrowUpRight;
        return Banknote;
    };

    const getPaymentColor = (method: string) => {
        const m = method.toLowerCase();
        if (m.includes('tarjeta') || m.includes('card') || m.includes('débito') || m.includes('crédito'))
            return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-900/20';
        if (m.includes('transfer') || m.includes('banco'))
            return 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400 border-violet-100 dark:border-violet-900/20';
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20';
    };

    return (
        <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden p-4 gap-4 md:overflow-hidden md:h-full">

            {/* ── HEADER ── */}
            <div className="flex-none flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {companyData?.logo && (
                        <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm shrink-0">
                            <img src={companyData.logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">
                            {companyData?.name || 'Tu Negocio'}
                        </p>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                            Panel de Control
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                        {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* ── STATS (4 cards) ── */}
            <div className="flex-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Productos', value: totalProducts, sub: 'en catálogo', icon: Package, color: 'blue', extra: null, badge: null, warn: false },
                    { title: 'Stock Bajo', value: lowStockProducts.length, sub: 'requieren atención', icon: AlertTriangle, color: 'red', extra: null, badge: lowStockProducts.length > 0 ? String(lowStockProducts.length) : null, warn: lowStockProducts.length > 0 },
                    { title: 'Ventas', value: totalSalesCount, sub: 'transacciones', icon: ShoppingCart, color: 'emerald', extra: todaySales.length > 0 ? `+${todaySales.length} hoy` : null, badge: null, warn: false },
                    { title: 'Ingresos', value: `$${totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, sub: 'balance total', icon: TrendingUp, color: 'violet', extra: todayRevenue > 0 ? `$${todayRevenue.toFixed(2)} hoy` : null, badge: null, warn: false },
                ].map((s, i) => {
                    const colorMap: Record<string, string> = {
                        blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 ring-blue-100 dark:ring-blue-500/20',
                        red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 ring-red-100 dark:ring-red-500/20',
                        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-100 dark:ring-emerald-500/20',
                        violet: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 ring-violet-100 dark:ring-violet-500/20',
                    };
                    const barMap: Record<string, string> = { blue: 'bg-blue-400', red: 'bg-red-400', emerald: 'bg-emerald-400', violet: 'bg-violet-400' };
                    return (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className={`h-1 w-full ${barMap[s.color]} opacity-60`} />
                            <div className="p-4 flex items-center gap-4">
                                <div className={`p-3 rounded-xl ring-1 shrink-0 ${colorMap[s.color]}`}>
                                    <s.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate mb-1">{s.title}</p>
                                    <p className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${s.warn ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                        {s.value}
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-semibold truncate mt-1">{s.sub}</p>
                                </div>
                                {s.extra && (
                                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wider whitespace-nowrap shrink-0">
                                        {s.extra}
                                    </span>
                                )}
                                {s.badge && (
                                    <span className="min-w-[24px] h-[24px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-black shrink-0 animate-pulse">
                                        {s.badge}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── KPIs (3 cards) ── */}
            <div className="flex-none grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Ticket Promedio */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-500/20 shrink-0">
                        <BarChart3 size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Ticket Promedio</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">
                            {totalSalesCount > 0 ? `$${avgTicket.toFixed(2)}` : '—'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">por transacción</p>
                    </div>
                </div>

                {/* Valor del Inventario */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-100 dark:ring-sky-500/20 shrink-0">
                        <DollarSign size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Inventario</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white truncate">
                            ${inventoryValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">capital en stock</p>
                    </div>
                </div>

                {/* Variación Hoy vs Ayer */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
                    {revenueChangePct !== null ? (
                        <>
                            <div className={`p-3 rounded-xl ring-1 shrink-0 ${revenueChangePct >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-500 ring-red-100 dark:ring-red-500/20'}`}>
                                {revenueChangePct >= 0 ? <TrendingUp size={20} strokeWidth={2.5} /> : <TrendingDown size={20} strokeWidth={2.5} />}
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Vs. Ayer</p>
                                <p className={`text-xl font-black ${revenueChangePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                    {revenueChangePct >= 0 ? '+' : ''}{revenueChangePct.toFixed(1)}%
                                </p>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">ayer: ${yesterdayRevenue.toFixed(2)}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-300 ring-1 ring-gray-100 dark:ring-gray-700 shrink-0">
                                <TrendingUp size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Vs. Ayer</p>
                                <p className="text-xl font-black text-gray-300 dark:text-gray-600">—</p>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">sin datos de ayer</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── MAIN CONTENT — 3 columnas, flex-1 ── */}
            <div className="flex flex-col md:flex-row md:flex-1 md:min-h-0 gap-4">

                {/* COLUMNA 1 — Stock Bajo */}
                <div className="flex flex-col w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden md:h-full h-[400px]">
                    <div className="flex-none px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20">
                                <AlertTriangle size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-gray-900 dark:text-white">Stock Bajo</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                                    {lowStockProducts.length > 0 ? `${lowStockProducts.length} productos` : 'Sin alertas'}
                                </p>
                            </div>
                        </div>
                        {lowStockProducts.length > 0 && (
                            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-red-500 text-white">
                                {lowStockProducts.length}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {lowStockProducts.length > 0 ? (
                            lowStockProducts.map(p => {
                                const isZero = p.stock === 0;
                                const ratio = p.min_stock > 0 ? Math.min(p.stock / p.min_stock, 1) : 0;
                                const bar = isZero ? 'bg-red-500' : ratio < 0.5 ? 'bg-orange-400' : 'bg-amber-400';
                                return (
                                    <div key={p.id} className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/30 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${isZero ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600 text-gray-400'}`}>
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate mb-0.5">{p.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">{p.category || 'General'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <p className={`text-base font-black ${isZero ? 'text-red-600' : 'text-red-500'}`}>{p.stock}<span className="text-[10px] opacity-60 ml-1">und</span></p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">mín: {p.min_stock}</p>
                                            </div>
                                        </div>
                                        <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(ratio * 100, isZero ? 0 : 4)}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                                <Package size={48} className="text-gray-300" strokeWidth={1} />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Todo el stock está al día</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA 2 — Top Productos + Métodos de Pago */}
                <div className="flex flex-col w-full md:w-1/3 gap-4 md:min-h-0">

                    {/* Top Productos */}
                    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="flex-none px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20">
                                <Award size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-gray-900 dark:text-white">Top Productos</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">más vendidos</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {topProducts.length > 0 ? topProducts.map((prod, idx) => (
                                <div key={prod.name} className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black w-4 text-center shrink-0 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700/60' : 'text-gray-300'}`}>
                                        #{idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{prod.name}</span>
                                            <span className="text-xs font-black text-gray-900 dark:text-white ml-2 shrink-0">{prod.qty} und</span>
                                        </div>
                                        <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${idx === 0 ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600'}`} style={{ width: `${(prod.qty / maxQty) * 100}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-gray-400 shrink-0 w-12 text-right">${prod.revenue.toFixed(0)}</span>
                                </div>
                            )) : (
                                <div className="h-full flex items-center justify-center opacity-30">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin datos</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Métodos de Pago */}
                    {paymentMethods.length > 0 && (
                        <div className="flex-none bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/20">
                                    <Wallet size={16} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-gray-900 dark:text-white">Métodos de Pago</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">distribución</p>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                {paymentMethods.map(([method, data]) => {
                                    const pct = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;
                                    const Icon = getPaymentIcon(method);
                                    return (
                                        <div key={method} className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg border ${getPaymentColor(method)} shrink-0`}>
                                                <Icon size={14} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{method}</span>
                                                    <span className="text-xs font-black text-gray-900 dark:text-white ml-2 shrink-0">${data.total.toFixed(2)}</span>
                                                </div>
                                                <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 w-8 text-right shrink-0">{data.count}x</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUMNA 3 — Ventas Recientes */}
                <div className="flex flex-col w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden md:h-full h-[400px]">
                    <div className="flex-none px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                            <TrendingUp size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 dark:text-white">Ventas Recientes</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">últimos movimientos</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {sales.length > 0 ? (
                            sales.slice(0, 15).map(sale => (
                                <div key={sale.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-900/30 transition-all">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600 flex items-center justify-center text-emerald-500 font-black text-xs shrink-0">
                                            {sale.customers?.name?.charAt(0) || 'C'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight mb-0.5">
                                                {sale.customers?.name || 'Consumidor Final'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                                                {sale.created_at ? new Date(sale.created_at).toLocaleDateString('es-ES') : sale.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${getPaymentColor(sale.payment_method || 'Efectivo')}`}>
                                            {sale.payment_method || 'Efectivo'}
                                        </span>
                                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                            ${Number(sale.total).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                                <ShoppingCart size={48} className="text-gray-300" strokeWidth={1} />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin ventas registradas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
