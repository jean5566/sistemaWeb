import { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useCompanyData } from '../hooks/useCompanyData';
import { Plus, Trash2, Tag, Loader2, Building2, Banknote, Percent, Save, Settings as SettingsIcon, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/http';
import toast from 'react-hot-toast';

type TabType = 'empresa' | 'categorias' | 'finanzas' | 'seguridad';

export default function Settings() {
    // Categories Hook
    const { categories, addCategory, removeCategory, loading: loadingCats } = useCategories();
    // Company Data Hook
    const { companyData, updateCompanyData, loading: loadingCompany } = useCompanyData();

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('empresa');

    // Security local state
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Category local state
    const [newCategory, setNewCategory] = useState('');
    const [isSubmittingCat, setIsSubmittingCat] = useState(false);

    // Company local state
    const [companyForm, setCompanyForm] = useState(companyData);
    const [isSavingCompany, setIsSavingCompany] = useState(false);

    // Update local form when hook data changes
    useEffect(() => {
        if (companyData) {
            setCompanyForm(companyData);
        }
    }, [companyData]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        setIsSubmittingCat(true);
        try {
            await addCategory(newCategory.trim());
            setNewCategory('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingCat(false);
        }
    };

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingCompany(true);
        try {
            await updateCompanyData(companyForm);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSavingCompany(false);
        }
    };

    const handleCategoryDelete = async (id: string | number) => {
        if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
            await removeCategory(id);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (passwords.new.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const response = await api.put<any>('/users.php', {
                id: user?.id,
                currentPassword: passwords.current,
                newPassword: passwords.new
            });

            if (response.success) {
                toast.success('Contraseña actualizada correctamente');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                toast.error(response.error || 'Error al actualizar contraseña');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error en el servidor');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    if (loadingCompany) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div
            className="p-4 md:p-6 h-full w-full flex flex-col gap-4 overflow-hidden"
            onWheel={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
                <div className="view-header">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <SettingsIcon className="text-primary" size={24} />
                        Configuración
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gestiona los datos de tu empresa y preferencias del sistema</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex flex-row gap-2 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl w-full sm:w-fit border border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('empresa')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'empresa' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Building2 size={18} />
                    Datos de Empresa
                </button>
                <button
                    onClick={() => setActiveTab('categorias')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'categorias' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Tag size={18} />
                    Categorías
                </button>
                <button
                    onClick={() => setActiveTab('finanzas')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'finanzas' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Banknote size={18} />
                    Moneda e Impuestos
                </button>
                <button
                    onClick={() => setActiveTab('seguridad')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'seguridad' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Lock size={18} />
                    Seguridad
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {/* COMPANY TAB */}
                {activeTab === 'empresa' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden pb-10">
                        <div className="lg:col-span-3 h-fit">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                <form onSubmit={handleCompanySubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="col-span-3">
                                            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nombre Comercial</label>
                                            <input
                                                type="text"
                                                value={companyForm.name}
                                                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">RUC / ID Tributario</label>
                                            <input
                                                type="text"
                                                value={companyForm.taxId}
                                                onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Teléfono</label>
                                            <input
                                                type="text"
                                                value={companyForm.phone}
                                                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Correo</label>
                                            <input
                                                type="email"
                                                value={companyForm.email}
                                                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Dirección Física</label>
                                            <textarea
                                                value={companyForm.address}
                                                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none resize-none h-20"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button
                                            type="submit"
                                            disabled={isSavingCompany}
                                            className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white font-semibold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                                        >
                                            {isSavingCompany ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 border border-primary/10 h-fit">
                                <h4 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                                    <Tag size={18} />
                                    Ayuda
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                    Los datos ingresados aparecerán en tus comprobantes de venta. Asegúrate de que la información sea correcta.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* CATEGORIES TAB */}
                {activeTab === 'categorias' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <Plus size={20} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Categoría</h3>
                            </div>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Tornillería, Llantas, etc."
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCat || !newCategory.trim()}
                                    className="px-8 py-2.5 bg-primary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                                >
                                    {isSubmittingCat ? <Loader2 className="animate-spin" size={20} /> : 'Añadir a la Base de Datos'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Listado Central</h3>
                                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-black text-gray-500">{categories.length}</div>
                            </div>
                            {loadingCats ? (
                                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
                            ) : (
                                <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
                                    <div className="space-y-2">
                                        {categories.map((cat) => (
                                            <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl group border border-transparent hover:border-primary/20 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <Tag size={16} className="text-primary opacity-50" />
                                                    <span className="font-bold text-gray-700 dark:text-gray-200">{cat.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleCategoryDelete(cat.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        {categories.length === 0 && (
                                            <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                                <Tag size={48} className="mb-4" />
                                                <p className="font-bold tracking-tight">No hay categorías registradas</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FINANCES TAB */}
                {activeTab === 'finanzas' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <Banknote size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Divisa y Moneda</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Símbolo de Moneda</label>
                                    <input
                                        type="text"
                                        value={companyForm.currency}
                                        onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                        placeholder="Ej: $, S/, USD"
                                    />
                                </div>
                                <button
                                    onClick={handleCompanySubmit}
                                    disabled={isSavingCompany}
                                    className="px-8 py-2.5 bg-primary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                                >
                                    Actualizar Moneda
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <Percent size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Configuración Fiscal</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Tasa de Impuesto (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={companyForm.taxRate}
                                            onChange={(e) => setCompanyForm({ ...companyForm, taxRate: Number(e.target.value) })}
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                            placeholder="Ej: 15, 18, 0"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-gray-400">%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCompanySubmit}
                                    disabled={isSavingCompany}
                                    className="px-8 py-2.5 bg-primary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                                >
                                    Actualizar Tasa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'seguridad' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden pb-10">
                        <div className="lg:col-span-2 h-fit">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Lock size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">Perfil y Seguridad</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic mt-1">Gestiona tu acceso</p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    value={profile.name}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-sm"
                                                    placeholder="Tu nombre"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Correo Electrónico</label>
                                                <input
                                                    type="email"
                                                    readOnly
                                                    value={profile.email}
                                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl font-bold text-gray-400 dark:text-gray-500 outline-none cursor-not-allowed text-sm"
                                                    title="El correo no se puede cambiar"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 dark:border-gray-700/50 my-4 pt-4">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Seguridad de la Cuenta</p>
                                        </div>
                                        <div className="relative">
                                            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Contraseña Actual</label>
                                            <div className="relative group">
                                                <input
                                                    type={showPasswords.current ? 'text' : 'password'}
                                                    required
                                                    value={passwords.current}
                                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-sm"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-1"
                                                >
                                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nueva Contraseña</label>
                                            <div className="relative group">
                                                <input
                                                    type={showPasswords.new ? 'text' : 'password'}
                                                    required
                                                    value={passwords.new}
                                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-sm"
                                                    placeholder="Mínimo 6 caracteres"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-1"
                                                >
                                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Confirmar Nueva Contraseña</label>
                                            <div className="relative group">
                                                <input
                                                    type={showPasswords.confirm ? 'text' : 'password'}
                                                    required
                                                    value={passwords.confirm}
                                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-sm"
                                                    placeholder="Repite la contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-1"
                                                >
                                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUpdatingPassword}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                                    >
                                        {isUpdatingPassword ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                                        Actualizar Seguridad
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl p-8 border border-emerald-100 dark:border-emerald-500/20 h-fit">
                                <h4 className="text-lg font-black text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-3">
                                    <ShieldCheck size={24} />
                                    Consejos de Seguridad
                                </h4>
                                <ul className="space-y-4 text-sm text-emerald-800/70 dark:text-emerald-300/60 font-medium leading-relaxed">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        Utiliza una contraseña que no uses en otros sitios.
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        Combina letras, números y símbolos para mayor seguridad.
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        Cambia tu contraseña periódicamente (cada 3-6 meses).
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

