import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useCategories } from '../hooks/useCategories';
import { Plus, Search, Edit, Trash2, X, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Check } from 'lucide-react';
import { Product } from '../types/models';


export default function Inventory() {
    const { products, loading: loadingProducts, addProduct, updateProduct, deleteProduct } = useInventory();
    const { categories } = useCategories();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFormCatOpen, setIsFormCatOpen] = useState(false);

    // Local state for UI
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
        image: ''
    });

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
            category: selectedCat ? selectedCat.name : ''
        };

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, finalData);
            } else {
                await addProduct(finalData as any);
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            setFormData({ name: '', code: '', price: '', category_id: '', stock: '', min_stock: '', image: '' });
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
            image: product.image || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm('¿Eliminar producto?')) {
            await deleteProduct(id);
        }
    };

    if (loadingProducts) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Sincronizando inventario...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 h-full max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Header - Hidden on mobile to save space */}
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-gray-700 gap-4 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Inventario</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Control de existencias</p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setFormData({ name: '', code: '', price: '', category_id: '', stock: '', min_stock: '', image: '' });
                        setIsModalOpen(true);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Nuevo Producto</span>
                </button>
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            <button
                onClick={() => {
                    setEditingProduct(null);
                    setFormData({ name: '', code: '', price: '', category_id: '', stock: '', min_stock: '', image: '' });
                    setIsModalOpen(true);
                }}
                className="md:hidden fixed bottom-20 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 active:scale-90 transition-transform border-4 border-white dark:border-gray-800"
            >
                <Plus size={28} strokeWidth={3} />
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden flex-1 flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-gray-700/50 flex flex-col lg:flex-row gap-6 items-center bg-slate-50/30 dark:bg-gray-800/20">
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

                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2 shadow-sm min-w-[200px] hover:border-primary transition-all group"
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
                                <th className="px-5 py-3 text-right">Acciones</th>
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
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
                    {paginatedProducts.map(product => {
                        const categoryName = categories.find(c =>
                            String(c.id) === String(product.category_id) ||
                            String(c.id) === String(product.category)
                        )?.name || (isNaN(Number(product.category)) ? product.category : 'General');

                        return (
                            <div key={product.id} className="bg-white dark:bg-gray-700/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-600 shadow-sm relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{product.code || 'S/C'}</span>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight pr-12">{product.name}</h3>
                                    </div>
                                    <div className="flex gap-1 absolute top-4 right-4 translate-y-0.5">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2 text-primary bg-primary/10 dark:bg-primary/20 rounded-xl transition-all active:scale-95"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-xl transition-all active:scale-95"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded uppercase">{categoryName}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <span className="block text-[9px] font-black text-gray-400 uppercase mb-1">Precio</span>
                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">${Number(product.price).toFixed(2)}</span>
                                    </div>
                                    <div className={`p-3 rounded-2xl border ${product.stock <= (product.min_stock || 0) ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/50' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50'}`}>
                                        <span className="block text-[9px] font-black text-gray-400 uppercase mb-1">Stock</span>
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
                                            {editingProduct ? 'Actualizar' : 'Guardar Producto'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
