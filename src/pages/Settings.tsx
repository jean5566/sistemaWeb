import { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useCompanyData } from '../hooks/useCompanyData';
import { Plus, Trash2, Tag, Loader2, Building2, Banknote, Percent, Save, Settings as SettingsIcon, Lock, ShieldCheck, Eye, EyeOff, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/http';
import toast from 'react-hot-toast';

type TabType = 'empresa' | 'categorias' | 'finanzas' | 'seguridad' | 'cajeros' | 'sri';

export default function Settings() {
    // Categories Hook
    const { categories, addCategory, removeCategory, loading: loadingCats } = useCategories();
    // Company Data Hook
    const { companyData, updateCompanyData, loading: loadingCompany } = useCompanyData();

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('empresa');

    // SRI Status State
    const [sriStatus, setSriStatus] = useState<any>(null);
    const [loadingSri, setLoadingSri] = useState(false);

    useEffect(() => {
        if (activeTab === 'sri') {
            setLoadingSri(true);
            api.get('/sri-status.php')
                .then(data => setSriStatus(data))
                .catch(err => console.error(err))
                .finally(() => setLoadingSri(false));
        }
    }, [activeTab]);

    // Security local state
    // ... (rest of existing state)

    // Security local state
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    // ...
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

    // Cashiers state
    const [cashiers, setCashiers] = useState<any[]>([]);
    const [loadingCashiers, setLoadingCashiers] = useState(false);
    const [newCashier, setNewCashier] = useState({
        name: '',
        email: '',
        password: '',
        role: 'cashier'
    });
    const [isCreatingCashier, setIsCreatingCashier] = useState(false);

    const fetchCashiers = async () => {
        setLoadingCashiers(true);
        try {
            const data = await api.get<any[]>('/users.php');
            setCashiers(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar cajeros');
        } finally {
            setLoadingCashiers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'cajeros') {
            fetchCashiers();
        }
    }, [activeTab]);

    const handleCreateCashier = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingCashier(true);
        try {
            const response = await api.post<any>('/register.php', newCashier);
            if (response.success) {
                toast.success('Cajero creado correctamente');
                setNewCashier({ name: '', email: '', password: '', role: 'cashier' });
                fetchCashiers();
            } else {
                toast.error(response.error || 'Error al crear cajero');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error en el servidor');
        } finally {
            setIsCreatingCashier(false);
        }
    };

    const handleDeleteCashier = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            const response = await api.delete<any>(`/users.php?id=${id}`);
            if (response.success) {
                toast.success('Usuario eliminado');
                fetchCashiers();
            } else {
                toast.error(response.error || 'Error al eliminar');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar');
        }
    };

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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('El logo no debe pesar más de 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyForm({ ...companyForm, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
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
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <SettingsIcon className="text-primary" size={24} />
                        Configuración
                    </h2>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">Gestiona los datos de tu empresa y preferencias del sistema</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex flex-row gap-2 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl w-full sm:w-fit border border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('empresa')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all whitespace-nowrap ${activeTab === 'empresa' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Building2 size={18} />
                    Datos de Empresa
                </button>
                <button
                    onClick={() => setActiveTab('categorias')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all whitespace-nowrap ${activeTab === 'categorias' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Tag size={18} />
                    Categorías
                </button>
                <button
                    onClick={() => setActiveTab('finanzas')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all whitespace-nowrap ${activeTab === 'finanzas' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Banknote size={18} />
                    Moneda e Impuestos
                </button>
                <button
                    onClick={() => setActiveTab('sri')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all whitespace-nowrap ${activeTab === 'sri' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <ShieldCheck size={18} />
                    Facturación SRI
                </button>
                <button
                    onClick={() => setActiveTab('seguridad')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all whitespace-nowrap ${activeTab === 'seguridad' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Lock size={18} />
                    Seguridad
                </button>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setActiveTab('cajeros')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all whitespace-nowrap ${activeTab === 'cajeros' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Users size={18} />
                        Cajeros
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
                {/* COMPANY TAB */}
                {activeTab === 'empresa' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden pb-4">
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <form onSubmit={handleCompanySubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                        {/* Logo Section - Top Row */}
                                        <div className="md:col-span-6 flex items-center gap-4 mb-1">
                                            <div className="w-16 h-16 flex items-center justify-center overflow-hidden shrink-0">
                                                {companyForm.logo ? (
                                                    <img src={companyForm.logo} alt="Logo preview" className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="w-16 h-16 flex items-center justify-center">
                                                        <Building2 className="text-gray-300" size={32} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <label className="block text-[12px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 px-1">Logo de Empresa</label>
                                                <div className="flex items-center gap-3">
                                                    <label className="cursor-pointer px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-all text-[12px] flex items-center gap-2 shadow-sm border border-primary/5 active:scale-95">
                                                        <Plus size={14} />
                                                        SUBIR DESDE PC
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                                    </label>
                                                    {companyForm.logo && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCompanyForm({ ...companyForm, logo: '' })}
                                                            className="px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all text-[12px] flex items-center gap-2 active:scale-95"
                                                        >
                                                            <Trash2 size={14} />
                                                            ELIMINAR
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Nombre Comercial</label>
                                            <input
                                                type="text"
                                                value={companyForm.name}
                                                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">RUC / ID</label>
                                            <input
                                                type="text"
                                                value={companyForm.taxId}
                                                onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Teléfono</label>
                                            <input
                                                type="text"
                                                value={companyForm.phone}
                                                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-4">
                                            <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                value={companyForm.email}
                                                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Dirección Física</label>
                                            <input
                                                type="text"
                                                value={companyForm.address}
                                                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] text-gray-800 dark:text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button
                                            type="submit"
                                            disabled={isSavingCompany}
                                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-[14px] uppercase tracking-widest"
                                        >
                                            {isSavingCompany ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                            Guardar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/10">
                                <h4 className="text-[14px] font-bold text-primary mb-1 flex items-center gap-2 uppercase tracking-widest">Ayuda</h4>
                                <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed font-bold">
                                    Los datos ingresados aparecerán en tus comprobantes. Se recomienda un logo cuadrado.
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
                                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Nueva Categoría</h3>
                            </div>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Tornillería, Llantas, etc."
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full text-[14px] px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCat || !newCategory.trim()}
                                    className="px-6 py-2 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 text-[14px] tracking-widest"
                                >
                                    {isSubmittingCat ? <Loader2 className="animate-spin" size={20} /> : 'AGREGAR'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight">Listado Central</h3>
                                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-[12px] font-black text-gray-500">{categories.length}</div>
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
                                                    <span className="font-bold text-[14px] text-gray-700 dark:text-gray-200">{cat.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleCategoryDelete(cat.id)}
                                                    className="p-2 text-gray-300 text-[14px] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
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
                                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Divisa y Moneda</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Símbolo de Moneda</label>
                                    <input
                                        type="text"
                                        value={companyForm.currency}
                                        onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                        placeholder="Ej: $, S/, USD"
                                    />
                                </div>
                                <button
                                    onClick={handleCompanySubmit}
                                    disabled={isSavingCompany}
                                    className="px-6 py-2 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
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
                                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Configuración Fiscal</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Tasa de Impuesto (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={companyForm.taxRate}
                                            onChange={(e) => setCompanyForm({ ...companyForm, taxRate: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none"
                                            placeholder="Ej: 15, 18, 0"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-gray-400">%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCompanySubmit}
                                    disabled={isSavingCompany}
                                    className="px-6 py-2 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                                >
                                    Actualizar Tasa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'seguridad' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Lock size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight leading-none">Perfil y Seguridad</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic mt-1">Gestiona tu acceso</p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    value={profile.name}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-[14px]"
                                                    placeholder="Tu nombre"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Correo Electrónico</label>
                                                <input
                                                    type="email"
                                                    readOnly
                                                    value={profile.email}
                                                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl font-bold text-gray-400 dark:text-gray-500 outline-none cursor-not-allowed text-[14px]"
                                                    title="El correo no se puede cambiar"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 dark:border-gray-700/50 my-4 pt-4">
                                            <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Actualizar Contraseña</p>
                                        </div>

                                        <div className="relative">
                                            <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Contraseña Actual</label>
                                            <div className="relative group">
                                                <input
                                                    type={showPasswords.current ? 'text' : 'password'}
                                                    required
                                                    value={passwords.current}
                                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                    className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-[14px]"
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

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="relative">
                                                <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nueva Contraseña</label>
                                                <div className="relative group">
                                                    <input
                                                        type={showPasswords.new ? 'text' : 'password'}
                                                        required
                                                        value={passwords.new}
                                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                        className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-[14px]"
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
                                                <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Confirmar Nueva</label>
                                                <div className="relative group">
                                                    <input
                                                        type={showPasswords.confirm ? 'text' : 'password'}
                                                        required
                                                        value={passwords.confirm}
                                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                        className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-[14px]"
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
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUpdatingPassword}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[12px] mt-4"
                                    >
                                        {isUpdatingPassword ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                                        Guardar Cambios de Seguridad
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl p-6 md:p-8 border border-emerald-100 dark:border-emerald-500/20 h-fit">
                                <h4 className="text-[12px] font-black text-emerald-700 dark:text-emerald-400 mb-6 flex items-center gap-3">
                                    <ShieldCheck size={20} />
                                    Consejos de Seguridad
                                </h4>
                                <ul className="space-y-5">
                                    <li className="flex gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        <p className="text-[12px] text-emerald-800/70 dark:text-emerald-300/60 font-bold leading-relaxed">Utiliza una contraseña única para este sistema comercial.</p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        <p className="text-[12px] text-emerald-800/70 dark:text-emerald-300/60 font-bold leading-relaxed">Combina letras, números y símbolos (ej: @, #, $).</p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        <p className="text-[12px] text-emerald-800/70 dark:text-emerald-300/60 font-bold leading-relaxed">No compartas tus credenciales con otros usuarios.</p>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 border border-primary/10">
                                <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Users size={14} />
                                    Control de Acceso
                                </p>
                                <p className="text-[12px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                                    Sus datos personales están protegidos por encriptación de extremo a extremo.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* SRI TAB */}
                {activeTab === 'sri' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <h3 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight">Estado de Facturación Electrónica</h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (loadingSri) return;
                                            setLoadingSri(true);
                                            api.get('/sri-status.php')
                                                .then(data => setSriStatus(data))
                                                .catch(err => console.error(err))
                                                .finally(() => setLoadingSri(false));
                                        }}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors bg-gray-50 dark:bg-gray-700 rounded-xl"
                                        title="Recargar estado"
                                    >
                                        <Loader2 className={`w-5 h-5 ${loadingSri ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {loadingSri ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
                                ) : sriStatus ? (
                                    <div className="space-y-6">
                                        <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${sriStatus.firma_exists ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-red-50 border-red-100 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'}`}>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${sriStatus.firma_exists ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                                                {sriStatus.firma_exists ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-[15px] leading-tight mb-1">
                                                    {sriStatus.firma_exists ? 'Firma Electrónica Detectada' : 'Firma Electrónica No Encontrada'}
                                                </h4>
                                                <p className="text-[12px] opacity-80 leading-snug">
                                                    {sriStatus.firma_exists
                                                        ? 'Su certificado digital está cargado y habilitado para la emisión de comprobantes.'
                                                        : `No se detectó el certificado .p12 en la ruta configurada.`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ambiente de Trabajo</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${sriStatus.environment === 'PRODUCCION' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                                                    <span className="font-bold text-gray-800 dark:text-white text-[15px] tracking-tight">{sriStatus.environment || 'DESCONOCIDO'}</span>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">RUC del Emisor</p>
                                                <p className="font-bold text-gray-800 dark:text-white font-mono text-[15px] tracking-wider">{sriStatus.ruc || 'FALTA CONFIGURAR'}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 md:col-span-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo de Régimen</p>
                                                <p className="font-bold text-gray-800 dark:text-white text-[14px]">{sriStatus.rimpe || 'NO ESPECIFICADO'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-red-500 font-bold opacity-50 flex flex-col items-center">
                                        <ShieldCheck size={48} className="mb-4 opacity-20" />
                                        <p>No se pudo conectar con el módulo local de facturación</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 border border-primary/10 h-fit">
                                <h4 className="text-[14px] font-bold text-primary mb-5 flex items-center gap-2 uppercase tracking-widest">
                                    <SettingsIcon size={18} />
                                    Guía de Acciones
                                </h4>
                                <div className="space-y-5">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-[12px] font-black shrink-0">1</div>
                                        <div>
                                            <p className="font-bold text-[13px] text-gray-800 dark:text-white mb-1">Nombre el Archivo</p>
                                            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Use un certificado <code className="bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 font-bold">firma.p12</code></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-[12px] font-black shrink-0">2</div>
                                        <div>
                                            <p className="font-bold text-[13px] text-gray-800 dark:text-white mb-1">Ubicación Correcta</p>
                                            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Debe estar en la carpeta <code className="bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">public/</code> de la raíz.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-[12px] font-black shrink-0">3</div>
                                        <div>
                                            <p className="font-bold text-[13px] text-gray-800 dark:text-white mb-1">Vinculación</p>
                                            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Asegúrese que el RUC en "Datos de Empresa" coincida con su firma.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-3xl p-6 border border-amber-100 dark:border-amber-500/20">
                                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ShieldCheck size={14} />
                                    Nota Legal
                                </p>
                                <p className="text-[12px] text-amber-800/80 dark:text-amber-300/60 font-medium leading-relaxed italic">
                                    La emisión electrónica es obligatoria para todos los contribuyentes bajo el nuevo esquema de facturación del SRI.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* CASHIERS TAB */}
                {activeTab === 'cajeros' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden pb-10">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Plus size={20} className="text-primary" />
                                Agregar Nuevo Cajero
                            </h3>
                            <form onSubmit={handleCreateCashier} className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCashier.name}
                                        onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-[14px]"
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        value={newCashier.email}
                                        onChange={(e) => setNewCashier({ ...newCashier, email: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-[14px]"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 px-1">Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={newCashier.password}
                                        onChange={(e) => setNewCashier({ ...newCashier, password: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 dark:text-white outline-none text-[14px]"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCreatingCashier}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 text-[16px]"
                                >
                                    {isCreatingCashier ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    Crear Cuenta de Cajero
                                </button>
                            </form>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full max-h-[600px]">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users size={20} className="text-primary" />
                                    Listado de Usuarios
                                </h3>
                                <span className="bg-primary/10 text-primary text-[12px] font-black px-2.5 py-1 rounded-full">{cashiers.length}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                                {loadingCashiers ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <p className="text-[12px] text-gray-500 font-bold">Cargando...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cashiers.map((c) => (
                                            <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl group transition-all border border-transparent hover:border-primary/10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center font-black text-primary shadow-sm">
                                                        {c.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-[14px]">
                                                            {c.name}
                                                            {c.role === 'admin' && <span className="text-[12px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">Admin</span>}
                                                        </div>
                                                        <div className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{c.email}</div>
                                                    </div>
                                                </div>
                                                {c.id !== user?.id && (
                                                    <button
                                                        onClick={() => handleDeleteCashier(c.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

