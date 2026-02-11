
import { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { Plus, Search, Edit, Trash2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Customer } from '../types/models';

export default function Customers() {
    const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();

    // Local state for UI
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form state
    const [formData, setFormData] = useState<any>({
        name: '',
        document_id: '',
        email: '',
        phone: '',
        address: ''
    });

    const filteredCustomers = customers.filter(customer => {
        const searchLower = searchQuery.toLowerCase();
        return (
            customer.name.toLowerCase().includes(searchLower) ||
            (customer.document_id && customer.document_id.includes(searchQuery)) ||
            (customer.cedula && customer.cedula.includes(searchQuery))
        );
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Adapt for API if needed (some use cedula, others document_id)
            const dataToSave = {
                ...formData,
                cedula: formData.document_id // Backwards compatibility
            };

            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, dataToSave);
            } else {
                await addCustomer(dataToSave);
            }
            setIsModalOpen(false);
            setEditingCustomer(null);
            setFormData({ name: '', document_id: '', email: '', phone: '', address: '' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            document_id: customer.document_id || customer.cedula || customer.docId || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm('¿Eliminar cliente?')) {
            await deleteCustomer(id);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Cargando base de clientes...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 h-full max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Header - Hidden on mobile to save space */}
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-gray-700 gap-4 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Directorio de Clientes</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gestiona los datos de tus compradores habituales</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCustomer(null);
                        setFormData({ name: '', cedula: '', phone: '', email: '', address: '' });
                        setIsModalOpen(true);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            <button
                onClick={() => {
                    setEditingCustomer(null);
                    setFormData({ name: '', document_id: '', email: '', phone: '', address: '' });
                    setIsModalOpen(true);
                }}
                className="md:hidden fixed bottom-20 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 active:scale-90 transition-transform border-4 border-white dark:border-gray-800"
            >
                <Plus size={28} strokeWidth={3} />
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex-1 flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-gray-700/50 flex flex-col lg:flex-row gap-6 items-center bg-slate-50/30 dark:bg-gray-800/20">
                    <div className="relative w-full max-w-md group text-left">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-primary' : 'text-slate-400'}`} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, cédula o teléfono..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm placeholder:text-gray-400 font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-full text-slate-400 transition-all font-medium"
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
                                <th className="px-5 py-3">Cliente</th>
                                <th className="px-5 py-3">Identificación</th>
                                <th className="px-5 py-3">Contacto</th>
                                <th className="px-5 py-3">Ubicación</th>
                                <th className="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {paginatedCustomers.map(customer => (
                                <tr key={customer.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white text-base leading-tight">{customer.name}</div>
                                    </td>
                                    <td className="px-5 py-4 font-mono text-sm font-semibold text-primary">
                                        {customer.document_id || customer.cedula || customer.docId || 'S/I'}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{customer.phone || 'N/A'}</div>
                                        <div className="text-xs text-gray-400">{customer.email || '-'}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                                            {customer.address || 'Sin dirección'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => handleEdit(customer)}
                                                className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
                    {paginatedCustomers.map(customer => (
                        <div key={customer.id} className="bg-white dark:bg-gray-700/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-600 shadow-sm relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight pr-10">{customer.name}</h3>
                                    </div>
                                </div>
                                <div className="flex gap-1 absolute top-4 right-4 translate-y-0.5">
                                    <button
                                        onClick={() => handleEdit(customer)}
                                        className="p-2 text-primary bg-primary/10 dark:bg-primary/20 rounded-xl transition-all active:scale-95"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(customer.id)}
                                        className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-xl transition-all active:scale-95"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-[10px] font-black text-gray-400 uppercase w-16">Teléfono</span>
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{customer.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-[10px] font-black text-gray-400 uppercase w-16">Email</span>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{customer.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm border-t border-gray-50 dark:border-gray-700/50 pt-2 mt-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase w-16 mt-0.5">Dirección</span>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 w-full italic">
                                        {customer.address || 'Sin dirección registrada'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {paginatedCustomers.length === 0 && (
                        <div className="py-10 text-center text-gray-400">
                            <p className="font-black uppercase tracking-widest text-xs">No hay clientes</p>
                        </div>
                    )}
                </div>

                {/* Pagination - Hidden on mobile */}
                <div className="hidden md:flex p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center sm:text-left">
                        Mostrando <span className="text-gray-900 dark:text-white">{startIndex + 1}</span> - <span className="text-gray-900 dark:text-white">{Math.min(startIndex + itemsPerPage, filteredCustomers.length)}</span> de <span className="text-gray-900 dark:text-white">{filteredCustomers.length}</span> clientes
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

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="px-5 md:px-8 py-4 md:py-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                                </h3>
                                <p className="text-gray-400 text-[10px] md:text-xs mt-0.5 font-medium uppercase tracking-wider">Perfil del cliente</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-sm transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 md:p-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej: Juan Pérez"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Identificación / RUC</label>
                                        <input
                                            type="text"
                                            placeholder="0000000000"
                                            value={formData.document_id}
                                            onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Teléfono</label>
                                        <input
                                            type="tel"
                                            placeholder="Ej: 0999999999"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            placeholder="cliente@ejemplo.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Dirección</label>
                                        <textarea
                                            placeholder="Ciudad, Calle, etc."
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none min-h-[70px]"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 md:pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 md:px-6 py-2.5 md:py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all text-xs md:text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 md:px-10 py-2.5 md:py-3 bg-primary text-white font-black rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 text-xs md:text-sm uppercase tracking-wider"
                                    >
                                        {editingCustomer ? 'Actualizar' : 'Guardar Cliente'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
