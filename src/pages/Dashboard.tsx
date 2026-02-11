
import { ShoppingCart, Package, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useSales } from '../hooks/useSales';

export default function Dashboard() {
    const { products, loading: loadingInventory } = useInventory();
    const { sales, loading: loadingSales } = useSales();

    const lowStockProducts = products.filter(p => p.stock <= (p.min_stock || 0));
    const totalProducts = products.length;
    const totalSalesCount = sales.length;
    const totatRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    if (loadingInventory || loadingSales) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Cargando estadísticas...</p>
            </div>
        );
    }

    const stats = [
        {
            title: 'Productos Totales',
            value: totalProducts,
            subtitle: 'Artículos en catálogo',
            icon: Package,
            colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 ring-blue-100 dark:ring-blue-500/20',
            bgDecoration: 'bg-blue-500'
        },
        {
            title: 'Bajo Stock',
            value: lowStockProducts.length,
            subtitle: 'Requieren atención',
            icon: AlertTriangle,
            colorClass: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 ring-red-100 dark:ring-red-500/20',
            bgDecoration: 'bg-red-500',
            isWarning: lowStockProducts.length > 0
        },
        {
            title: 'Ventas Realizadas',
            value: totalSalesCount,
            subtitle: 'Transacciones totales',
            icon: ShoppingCart,
            colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-100 dark:ring-emerald-500/20',
            bgDecoration: 'bg-emerald-500',
            trend: '+12% vs ayer'
        },
        {
            title: 'Ingresos Totales',
            value: `$${totatRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
            subtitle: 'Balance general',
            icon: TrendingUp,
            colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-100 dark:ring-emerald-500/20',
            bgDecoration: 'bg-emerald-500',
        }
    ];

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">Panel de Control</h1>
                    <p className="text-gray-400 font-bold text-[9px] md:text-[10px] mt-1 uppercase tracking-widest opacity-80">Vista general de tu negocio</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 md:px-3 md:py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors self-start md:self-end">
                    <Calendar size={12} className="text-primary" />
                    <span className="text-[9px] md:text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                        {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className={`bg-white dark:bg-gray-800 p-3 md:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-black/20 transition-all duration-300 group relative overflow-hidden`}
                    >
                        {/* Background subtle decoration */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-500 ${stat.bgDecoration}`} />

                        <div className="flex flex-col h-full space-y-2 md:space-y-3">
                            <div className="flex items-center justify-between">
                                <div className={`p-1.5 md:p-2.5 rounded-xl ring-1 ${stat.colorClass}`}>
                                    <stat.icon size={16} className="md:w-5 md:h-5" strokeWidth={2.5} />
                                </div>
                                {stat.trend && (
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wider`}>
                                        {stat.trend}
                                    </span>
                                )}
                            </div>

                            <div>
                                <h3 className="text-[9px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">{stat.title}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-lg md:text-2xl font-black tracking-tighter ${stat.isWarning ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                        {stat.value}
                                    </span>
                                </div>
                                <p className="text-[8px] md:text-[10px] font-bold text-gray-400 mt-0.5 leading-none">{stat.subtitle}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Lists Summary Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Low Stock Detailed List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 md:p-5 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 md:p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20">
                                <AlertTriangle size={16} className="md:w-5 md:h-5" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-sm md:text-base font-black text-gray-900 dark:text-white tracking-tight">Ventas Recientes</h2>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic leading-none mt-0.5">Últimos movimientos</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 grid gap-2 overflow-y-auto max-h-[350px]">
                        {lowStockProducts.length > 0 ? (
                            lowStockProducts.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-700/30 border border-gray-50 dark:border-gray-700 hover:border-red-200 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-600 flex items-center justify-center text-gray-400 font-bold group-hover:text-red-400 transition-colors text-xs">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{p.name}</p>
                                            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">{p.category || p.code || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-red-500">{p.stock} <span className="text-[9px] opacity-70">UND</span></p>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Mín: {p.min_stock}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 opacity-40">
                                <Package size={48} className="text-gray-300" strokeWidth={1} />
                                <p className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.2em]">Todo el stock está al día</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Sales Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 md:p-5 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 md:p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                                <TrendingUp size={16} className="md:w-5 md:h-5" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-sm md:text-base font-black text-gray-900 dark:text-white tracking-tight">Ventas Recientes</h2>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic leading-none mt-0.5">Últimos movimientos</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 grid gap-2 overflow-y-auto max-h-[350px]">
                        {sales.slice(0, 10).map(sale => (
                            <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-700/30 border border-gray-50 dark:border-gray-700 hover:border-emerald-200 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-600 flex items-center justify-center text-emerald-500 font-bold text-xs">
                                        {sale.customers?.name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{sale.customers?.name || 'Consumidor Final'}</p>
                                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">
                                            {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : sale.date}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">${Number(sale.total).toFixed(2)}</p>
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600/70 border border-emerald-100 uppercase tracking-tighter">
                                        {sale.payment_method || 'Efectivo'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
