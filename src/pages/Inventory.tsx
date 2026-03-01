import { useState, useRef } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useCategories } from '../hooks/useCategories';
import { Plus, Search, Edit, Trash2, X, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Check, PackagePlus, ArrowUp, ArrowDown, Tag, Loader2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '../types/models';
import { useAuth } from '../context/AuthContext';


export default function Inventory() {
    const { user } = useAuth();
    const { products, loading: loadingProducts, addProduct, updateProduct, deleteProduct } = useInventory();
    const { categories, addCategory, removeCategory, loading: loadingCats } = useCategories();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFormCatOpen, setIsFormCatOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isSubmittingCat, setIsSubmittingCat] = useState(false);

    // Local state for UI
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Stock adjustment state
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [adjustQty, setAdjustQty] = useState('');
    const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
    const [adjustMotivo, setAdjustMotivo] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form state
    const [formData, setFormData] = useState<any>({
        name: '',
        code: '',
        price: '',
        category_id: '',
        stock: '',
        min_stock: '',
        image_path: ''
    });

    // Image upload state
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Local preview immediately
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        // Upload to server
        setIsUploadingImage(true);
        try {
            const token = localStorage.getItem('pos_token');
            const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost/api');
            const data = new FormData();
            data.append('image', file);
            const res = await fetch(`${apiBase}/upload-image.php`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: data
            });
            const json = await res.json();
            if (json.path) {
                setFormData((prev: any) => ({ ...prev, image_path: json.path }));
            } else {
                toast.error(json.error || 'Error al subir imagen');
                setImagePreview('');
            }
        } catch {
            toast.error('Error al subir imagen');
            setImagePreview('');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' ||
            String(product.category_id) === String(selectedCategory) ||
            product.category === selectedCategory;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            product.name.toLowerCase().includes(searchLower) ||
            (product.code && product.code.toLowerCase().includes(searchLower));
        return matchesCategory && matchesSearch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 on search/filter
    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        setCurrentPage(1);
    };

    const handleCategoryChange = (val: string) => {
        setSelectedCategory(val);
        setCurrentPage(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedCat = categories.find(c => String(c.id) === String(formData.category_id));

        const finalData = {
            ...formData,
            price: Number(formData.price) || 0,
            stock: Number(formData.stock) || 0,
            min_stock: Number(formData.min_stock) || 0,
            category: selectedCat ? selectedCat.name : null,
            code: formData.code || null,
            category_id: formData.category_id || null,
            image_path: formData.image_path || null,
        };

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, finalData);
            } else {
                await addProduct(finalData as any);
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            setFormData({ name: '', code: '', price: '', category_id: '', stock: '', min_stock: '', image_path: '' });
            setImagePreview('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            code: product.code || '',
            price: product.price,
            category_id: product.category_id || '',
            stock: product.stock,
            min_stock: product.min_stock || 0,
            image_path: product.image_path || ''
        });
        if (product.image_path) {
            const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost/api');
            const origin = (() => { try { return new URL(apiBase).origin; } catch { return ''; } })();
            setImagePreview(`${origin}${product.image_path}`);
        } else {
            setImagePreview('');
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm('¿Eliminar producto?')) {
            await deleteProduct(id);
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

    const handleCategoryDelete = async (id: string | number) => {
        if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
            await removeCategory(id);
        }
    };

    const handleOpenStockAdjust = (product: Product) => {
        setAdjustingProduct(product);
        setAdjustQty('');
        setAdjustType('in');
        setAdjustMotivo('');
        setIsStockModalOpen(true);
    };

    const handleStockAdjust = async () => {
        if (!adjustingProduct) return;
        const qty = Number(adjustQty);
        if (!qty || qty <= 0) return;
        const delta = adjustType === 'in' ? qty : -qty;
        const newStock = Math.max(0, adjustingProduct.stock + delta);
        try {
            await updateProduct(adjustingProduct.id, { stock: newStock });
            setIsStockModalOpen(false);
            setAdjustingProduct(null);
        } catch (_) { }
    };

    const adjustedStock = adjustingProduct
        ? Math.max(0, adjustingProduct.stock + (adjustType === 'in' ? Number(adjustQty) || 0 : -(Number(adjustQty) || 0)))
        : 0;

    if (loadingProducts) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Sincronizando inventario...</p>
        </div>
    );

    return (
        <div className="p-0 md:p-8 h-full w-full max-w-[1600px] mx-auto flex flex-col gap-0 md:gap-6">
            {/* Header - Hidden on mobile to save space */}
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-gray-700 gap-4 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Inventario</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Control de existencias</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all text-sm border border-emerald-100 dark:border-emerald-500/20"
                        >
                            <Tag size={18} strokeWidth={2.5} />
                            <span>Categorías</span>
                        </button>
                        <button
                            onClick={() => {
                                setEditingProduct(null);
                                setFormData({ name: '', code: '', price: '', category_id: '', stock: '', min_stock: '', image_path: '' }); setImagePreview('');
                                setIsModalOpen(true);
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>Nuevo Producto</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            {user?.role === 'admin' && (
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setFormData({ name: '', code: '', price: '', category_id: '', stock: '', min_stock: '', image_path: '' }); setImagePreview('');
                        setIsModalOpen(true);
                    }}
                    className="md:hidden fixed bottom-20 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 active:scale-90 transition-transform border-4 border-white dark:border-gray-800"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-none md:rounded-2xl border-0 md:border md:border-slate-200 dark:border-gray-700 overflow-hidden flex-1 flex flex-col shadow-none md:shadow-sm">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-gray-700/50 flex flex-col lg:flex-row gap-4 md:gap-6 items-center bg-slate-50/30 dark:bg-gray-800/20">
                    <div className="relative w-full max-w-md group">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-primary' : 'text-slate-400'}`} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código de producto..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-11 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => handleSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-full text-slate-400 transition-all"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="md:hidden flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-xl px-4 py-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all font-semibold shrink-0"
                            >
                                <Tag size={16} />
                                <span className="text-[11px] uppercase tracking-widest block">Categorías</span>
                            </button>
                        )}
                        <div className="relative flex-1 lg:flex-none">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="w-full flex items-center justify-between gap-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2 shadow-sm min-w-[150px] md:min-w-[200px] hover:border-primary transition-all group"
                            >
                                <Filter size={16} className={`${selectedCategory !== 'all' ? 'text-primary' : 'text-slate-400'} shrink-0`} />
                                <span className="flex-1 text-left text-[11px] font-semibold text-slate-700 dark:text-gray-200 uppercase tracking-widest truncate">
                                    {selectedCategory === 'all' ? 'Todas las Categorías' : categories.find(c => String(c.id) === String(selectedCategory))?.name}
                                </span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setIsFilterOpen(false)} />
                                    <div className="absolute top-full right-0 mt-2 w-full min-w-[220px] bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none z-[70] py-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-3 py-1.5 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-gray-700/50">Filtrar por</div>
                                        <button
                                            onClick={() => {
                                                handleCategoryChange('all');
                                                setIsFilterOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-slate-50 dark:hover:bg-gray-700/50 ${selectedCategory === 'all' ? 'text-primary' : 'text-slate-600 dark:text-gray-300'}`}
                                        >
                                            Todas las Categorías
                                            {selectedCategory === 'all' && <Check size={14} />}
                                        </button>
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    handleCategoryChange(String(cat.id));
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-slate-50 dark:hover:bg-gray-700/50 ${String(selectedCategory) === String(cat.id) ? 'text-primary' : 'text-slate-600 dark:text-gray-300'}`}
                                            >
                                                {cat.name}
                                                {String(selectedCategory) === String(cat.id) && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Table - Scrollbar hidden for cleaner look */}
                <div className="hidden md:block overflow-x-auto flex-1 scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 uppercase tracking-widest text-xs font-semibold border-b border-gray-100 dark:border-gray-700">
                                <th className="px-5 py-3">Código</th>
                                <th className="px-5 py-3">Descripción del Producto</th>
                                <th className="px-5 py-3">Categoría</th>
                                <th className="px-5 py-3">Precio</th>
                                <th className="px-5 py-3">Existencia</th>
                                <th className="px-5 py-3">Stock Mín.</th>
                                {user?.role === 'admin' && <th className="px-5 py-3 text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {paginatedProducts.map(product => {
                                // Robust category resolution
                                const categoryName = categories.find(c =>
                                    String(c.id) === String(product.category_id) ||
                                    String(c.id) === String(product.category)
                                )?.name || (isNaN(Number(product.category)) ? product.category : 'General');

                                return (
                                    <tr key={product.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-5 py-4 font-mono text-sm font-semibold text-primary">
                                            {product.code || 'S/C'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-semibold text-gray-900 dark:text-white text-base">{product.name}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded uppercase tracking-wide">
                                                {categoryName}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-black text-emerald-600 dark:text-emerald-400 text-base">
                                            ${Number(product.price).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`font-semibold text-sm ${product.stock <= (product.min_stock || 0) ? 'text-red-500' : 'text-blue-600'}`}>
                                                {product.stock} <span className="text-xs opacity-70 font-semibold">UNID</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-bold text-gray-400">
                                                {product.min_stock || 0}
                                            </span>
                                        </td>
                                        {user?.role === 'admin' && (
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleOpenStockAdjust(product)}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        title="Ajustar stock"
                                                    >
                                                        <PackagePlus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                                                        title="Editar producto"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards (List format) */}
                <div className="md:hidden flex-1 overflow-y-auto w-full">
                    {paginatedProducts.map(product => {
                        const categoryName = categories.find(c =>
                            String(c.id) === String(product.category_id) ||
                            String(c.id) === String(product.category)
                        )?.name || (isNaN(Number(product.category)) ? product.category : 'General');

                        return (
                            <div key={product.id} className="bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-100 dark:border-gray-700/50 flex flex-col gap-2.5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                <div>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 block">{product.code || 'S/C'}</span>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base leading-tight">
                                        {product.name}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded uppercase">{categoryName}</span>
                                    {user?.role === 'admin' && (
                                        <div className="flex gap-1.5 bg-gray-50/80 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => handleOpenStockAdjust(product)}
                                                className="p-2.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-95"
                                                title="Ajustar stock"
                                            >
                                                <PackagePlus size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all active:scale-95"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-95"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    <div className="bg-gray-50 dark:bg-gray-800/80 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                        <span className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">Precio</span>
                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">${Number(product.price).toFixed(2)}</span>
                                    </div>
                                    <div className={`p-2.5 rounded-lg border ${product.stock <= (product.min_stock || 0) ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/50' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'}`}>
                                        <span className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">Stock</span>
                                        <span className={`text-sm font-black ${product.stock <= (product.min_stock || 0) ? 'text-red-500' : 'text-blue-600'}`}>
                                            {product.stock} <span className="text-[10px] opacity-70 font-bold">UND</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {paginatedProducts.length === 0 && (
                        <div className="py-10 text-center text-gray-400">
                            <p className="font-black uppercase tracking-widest text-xs">No hay productos</p>
                        </div>
                    )}
                </div>

                {/* Pagination - Hidden on mobile */}
                <div className="hidden md:flex p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest text-center sm:text-left">
                        Mostrando <span className="text-slate-900 dark:text-white font-bold">{startIndex + 1}</span> - <span className="text-slate-900 dark:text-white font-bold">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> de <span className="text-slate-900 dark:text-white font-bold">{filteredProducts.length}</span> productos
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0 scrollbar-hide">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1 px-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Página {currentPage} de {totalPages || 1}</span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:border-primary transition-all text-gray-600 dark:text-gray-300"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="px-5 md:px-8 py-4 md:py-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                    </h3>
                                    <p className="text-gray-400 text-[10px] md:text-xs mt-0.5 font-medium uppercase tracking-wider">Detalles del artículo</p>
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
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Código Barra/Ref</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: PER-001"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Categoría</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsFormCatOpen(!isFormCatOpen)}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                                >
                                                    <span className={!formData.category_id ? 'text-gray-400' : ''}>
                                                        {formData.category_id
                                                            ? categories.find(c => String(c.id) === String(formData.category_id))?.name
                                                            : 'Seleccionar...'}
                                                    </span>
                                                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isFormCatOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isFormCatOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[60]" onClick={() => setIsFormCatOpen(false)} />
                                                        <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-[70] py-2 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto scrollbar-hide">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, category_id: '' });
                                                                    setIsFormCatOpen(false);
                                                                }}
                                                                className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-400"
                                                            >
                                                                Seleccionar...
                                                                {!formData.category_id && <Check size={14} />}
                                                            </button>
                                                            {categories.map(cat => (
                                                                <button
                                                                    key={cat.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, category_id: String(cat.id) });
                                                                        setIsFormCatOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${String(formData.category_id) === String(cat.id) ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                                                                >
                                                                    {cat.name}
                                                                    {String(formData.category_id) === String(cat.id) && <Check size={14} />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Nombre del Producto</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Descripción completa del artículo..."
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                                        <div>
                                            <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Precio Unitario</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Stock Inicial</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Stock Mínimo</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.min_stock}
                                                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-gray-800 dark:text-white text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                            Imagen del producto
                                        </label>
                                        <div className="flex items-center gap-4">
                                            {imagePreview ? (
                                                <div className="relative w-16 h-16 shrink-0">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-16 h-16 object-cover rounded-xl border border-gray-200 dark:border-gray-600"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImagePreview(''); setFormData((p: any) => ({ ...p, image_path: '' })); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 shrink-0 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-300">
                                                    <ImagePlus size={20} />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <input
                                                    ref={imageInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    onChange={handleImageSelect}
                                                    className="hidden"
                                                    id="product-image-input"
                                                />
                                                <label
                                                    htmlFor="product-image-input"
                                                    className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    {isUploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                                                    {isUploadingImage ? 'Subiendo...' : 'Seleccionar imagen'}
                                                </label>
                                                <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG, WebP · Máx. 2MB</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 md:pt-6">
                                        <button
                                            type="button"
                                            onClick={() => { setIsModalOpen(false); setImagePreview(''); }}
                                            className="px-5 md:px-6 py-2.5 md:py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all text-xs md:text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 md:px-10 py-2.5 md:py-3 bg-primary text-white font-black rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 text-xs md:text-sm uppercase tracking-wider"
                                        >
                                            {editingProduct ? 'Actualizar' : 'Guardar Producto'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Stock Adjustment Modal */}
            {isStockModalOpen && adjustingProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <div>
                                <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Ajuste de Stock</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[200px]">
                                    {adjustingProduct.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsStockModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-sm transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* Stock actual */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Stock actual</span>
                                <span className={`text-2xl font-black tracking-tight ${adjustingProduct.stock <= (adjustingProduct.min_stock || 0) ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                    {adjustingProduct.stock} <span className="text-sm opacity-50 font-bold">und</span>
                                </span>
                            </div>

                            {/* Tipo: Entrada / Salida */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo de movimiento</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setAdjustType('in')}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${adjustType === 'in' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500'}`}
                                    >
                                        <ArrowUp size={14} strokeWidth={3} />
                                        Entrada
                                    </button>
                                    <button
                                        onClick={() => setAdjustType('out')}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${adjustType === 'out' ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500'}`}
                                    >
                                        <ArrowDown size={14} strokeWidth={3} />
                                        Salida
                                    </button>
                                </div>
                            </div>

                            {/* Cantidad */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cantidad</p>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="0"
                                    value={adjustQty}
                                    onChange={e => setAdjustQty(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-black text-gray-800 dark:text-white text-xl outline-none text-center"
                                    autoFocus
                                />
                            </div>

                            {/* Motivo */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Motivo <span className="text-gray-300 font-semibold normal-case">(opcional)</span>
                                </p>
                                <select
                                    value={adjustMotivo}
                                    onChange={e => setAdjustMotivo(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold text-gray-700 dark:text-gray-300 text-sm outline-none"
                                >
                                    <option value="">Seleccionar motivo...</option>
                                    {adjustType === 'in' ? (
                                        <>
                                            <option>Compra / Restock</option>
                                            <option>Devolución de cliente</option>
                                            <option>Corrección de inventario</option>
                                            <option>Transferencia entre locales</option>
                                        </>
                                    ) : (
                                        <>
                                            <option>Pérdida / Daño</option>
                                            <option>Producto vencido</option>
                                            <option>Corrección de inventario</option>
                                            <option>Consumo interno</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Preview resultado */}
                            {adjustQty && Number(adjustQty) > 0 && (
                                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${adjustType === 'in' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/20' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-900/20'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock resultante</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-gray-400 line-through">{adjustingProduct.stock}</span>
                                        <span className="text-[10px] text-gray-400">→</span>
                                        <span className={`text-xl font-black ${adjustType === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                            {adjustedStock} <span className="text-xs opacity-60 font-bold">und</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 flex gap-3 border-t border-gray-50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/20">
                            <button
                                onClick={() => setIsStockModalOpen(false)}
                                className="flex-1 py-2.5 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleStockAdjust}
                                disabled={!adjustQty || Number(adjustQty) <= 0}
                                className={`flex-1 py-2.5 text-white font-black rounded-xl transition-all text-sm uppercase tracking-wider disabled:opacity-40 active:scale-95 ${adjustType === 'in' ? 'bg-emerald-500 hover:brightness-110 shadow-lg shadow-emerald-500/20' : 'bg-red-500 hover:brightness-110 shadow-lg shadow-red-500/20'}`}
                            >
                                {adjustType === 'in' ? 'Agregar stock' : 'Retirar stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Category Management Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <Tag className="text-primary" />
                                    Gestión de Categorías
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                    Organiza tu inventario
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-sm transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-y-auto scrollbar-hide">
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

                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[400px]">
                                <div className="flex items-center justify-between mb-6 shrink-0">
                                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight">Listado Central</h3>
                                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-[12px] font-black text-gray-500">{categories.length}</div>
                                </div>
                                {loadingCats ? (
                                    <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
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
                                                        className="p-2 text-gray-300 text-[14px] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 md:group-hover:opacity-100 md:opacity-0 max-md:opacity-100"
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
                    </div>
                </div>
            )}
        </div >
    );
}
