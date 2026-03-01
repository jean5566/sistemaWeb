import { Product } from '../types/models';

interface ProductCardProps {
    product: Product;
    onAdd: (product: Product) => void;
    currency?: string;
    isDisabled?: boolean;
}

export function ProductCard({ product, onAdd, currency = '$', isDisabled = false }: ProductCardProps) {
    const imageUrl = product.image_path
        ? (() => { try { return `${new URL(import.meta.env.VITE_API_URL || 'http://localhost/api').origin}${product.image_path}`; } catch { return product.image_path; } })()
        : null;

    return (
        <div
            className={`rounded-2xl shadow-sm transition-all duration-300 overflow-hidden flex flex-row items-center border-[1.5px] group h-16 sm:h-20 select-none relative ${isDisabled
                ? 'bg-gray-50/50 border-gray-100 opacity-60 cursor-not-allowed'
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md hover:shadow-gray-200/50 hover:-translate-y-0.5 active:scale-[0.98]'
                }`}
            onClick={() => !isDisabled && onAdd(product)}
        >
            {imageUrl && (
                <div className="w-16 sm:w-20 h-full shrink-0 overflow-hidden border-r border-gray-50 dark:border-gray-700">
                    <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="flex-1 px-4 py-2 flex flex-col justify-center min-w-0 h-full">
                <div className="flex flex-col">
                    <span className="text-[9px] text-blue-600/70 dark:text-blue-400/70 font-black uppercase tracking-[0.15em] leading-none mb-0.5">{product.category || 'General'}</span>
                    <h3 className="font-black text-gray-900 dark:text-white text-sm leading-tight truncate">{product.name}</h3>
                </div>

                <div className="mt-1 flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg ${isDisabled
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 animate-pulse'
                        : (product.stock < 10 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-gray-50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400')
                        }`}>
                        {isDisabled ? 'En carrito' : `${product.stock} disp.`}
                    </span>
                </div>
            </div>

            <div className={`px-4 sm:px-6 h-full flex flex-col items-center justify-center border-l-[1.5px] border-gray-50 dark:border-gray-700 shrink-0 transition-colors duration-300 ${isDisabled ? 'bg-gray-50/30' : 'bg-emerald-50/20 dark:bg-emerald-500/5 group-hover:bg-emerald-500/10'}`}>
                <span className="text-[9px] font-black text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-widest mb-0.5 leading-none">Precio</span>
                <span className="font-black text-base sm:text-lg text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">{currency}{product.price.toFixed(2)}</span>
            </div>
        </div>
    );
}
