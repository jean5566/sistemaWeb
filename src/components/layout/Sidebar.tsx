import { ShoppingCart, Package, Users, Settings, LogOut, ClipboardList, LayoutDashboard } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// import '../../styles/Sidebar.css';

interface SidebarProps {
    companyName: string;
}

export function Sidebar({ companyName }: SidebarProps) {
    const { user, signOut } = useAuth();
    const handleLogout = async () => {
        if (window.confirm('¿Desea cerrar sesión?')) {
            await signOut();
        }
    };

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-3 font-bold transition-all rounded-xl md:mb-1 ${isActive
            ? 'text-slate-900 bg-slate-50'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
        }`;

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 z-50 h-screen w-20 hover:w-64 bg-white dark:bg-gray-900 flex-col border-r border-slate-100 dark:border-gray-800 transition-all duration-300 ease-in-out group overflow-hidden shadow-sm">
                <div className="p-6 pb-2 flex items-center gap-4 min-w-[256px]">
                    <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{companyName}</span>
                </div>

                <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-1 min-w-[256px]">
                    <div className="mb-4 text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em] px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Menú Principal</div>
                    <NavLink to="/" className={navLinkClass} end title="Panel">
                        <div className="shrink-0 w-6 flex justify-center"><LayoutDashboard size={20} strokeWidth={2.5} /></div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">Inicio</span>
                    </NavLink>
                    <NavLink to="/pos" className={navLinkClass} title="Nueva Venta">
                        <div className="shrink-0 w-6 flex justify-center"><ShoppingCart size={20} strokeWidth={2.5} /></div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">Venta</span>
                    </NavLink>
                    <NavLink to="/inventory" className={navLinkClass} title="Inventario">
                        <div className="shrink-0 w-6 flex justify-center"><Package size={20} strokeWidth={2.5} /></div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">Inventario</span>
                    </NavLink>
                    <NavLink to="/customers" className={navLinkClass} title="Clientes">
                        <div className="shrink-0 w-6 flex justify-center"><Users size={20} strokeWidth={2.5} /></div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">Clientes</span>
                    </NavLink>
                    <NavLink to="/history" className={navLinkClass} title="Historial">
                        <div className="shrink-0 w-6 flex justify-center"><ClipboardList size={20} strokeWidth={2.5} /></div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">Transacciones</span>
                    </NavLink>

                    <div className="mt-10 mb-4 text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em] px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Configuración</div>
                    <NavLink to="/settings" className={navLinkClass} title="Ajustes">
                        <div className="shrink-0 w-6 flex justify-center"><Settings size={20} strokeWidth={2.5} /></div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">Ajustes</span>
                    </NavLink>
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 dark:text-gray-500 font-semibold hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:text-red-500 transition-all rounded-xl mt-2 overflow-hidden"
                        onClick={handleLogout}
                        title="Cerrar Sesión"
                    >
                        <div className="shrink-0 w-6 flex justify-center"><LogOut size={20} strokeWidth={2.5} /></div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">Salir</span>
                    </button>
                </nav>

                {user && (
                    <div className="p-4 mx-2 mb-4 flex items-center gap-3 min-w-[240px] border-t border-gray-50 dark:border-gray-800/50">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0 border border-gray-100 dark:border-gray-700">
                            <Users size={18} />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap leading-tight">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{user.name || 'Usuario'}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">{user.role}</p>
                        </div>
                    </div>
                )}
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-2 py-1 flex items-center justify-around shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)]">
                <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`} end>
                    {({ isActive }) => (
                        <>
                            <LayoutDashboard size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Inicio</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/pos" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {({ isActive }) => (
                        <>
                            <ShoppingCart size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Venta</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/inventory" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {({ isActive }) => (
                        <>
                            <Package size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Stock</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/customers" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {({ isActive }) => (
                        <>
                            <Users size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Clientes</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {({ isActive }) => (
                        <>
                            <Settings size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Más</span>
                        </>
                    )}
                </NavLink>
            </nav>
        </>
    );
}
