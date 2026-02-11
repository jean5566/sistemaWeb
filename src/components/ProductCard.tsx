import { Product } from '../types/models';

interface ProductCardProps {
    product: Product;
    onAdd: (product: Product) => void;
    currency?: string;
    isDisabled?: boolean;
}

export function ProductCard({ product, onAdd, currency = '$', isDisabled = false }: ProductCardProps) {
    return (
        <div
            className={`rounded-[28px] shadow-sm transition-all duration-300 overflow-hidden flex flex-row items-center border-[1.5px] group h-28 select-none relative ${isDisabled
                ? 'bg-gray-50/50 border-gray-100 opacity-60 cursor-not-allowed'
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 cursor-pointer hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.97]'
                }`}
            onClick={() => !isDisabled && onAdd(product)}
        >
            <div className="flex-1 p-5 flex flex-col justify-center min-w-0 h-full">
                <div className="flex flex-col">
                    <span className="text-[9px] text-blue-600/70 dark:text-blue-400/70 font-black uppercase tracking-[0.15em] mb-1">{product.category || 'General'}</span>
                    <h3 className="font-black text-gray-900 dark:text-white text-[15px] leading-tight break-words line-clamp-2">{product.name}</h3>
                </div>

                <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl ${isDisabled
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 animate-pulse'
                        : (product.stock < 10 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-gray-50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400')
                        }`}>
                        {isDisabled ? 'En carrito' : `${product.stock} disponibles`}
                    </span>
                </div>
            </div>

            <div className={`px-8 h-full flex flex-col items-center justify-center border-l-[1.5px] border-gray-50 dark:border-gray-700 shrink-0 transition-colors duration-300 ${isDisabled ? 'bg-gray-50/30' : 'bg-emerald-50/20 dark:bg-emerald-500/5 group-hover:bg-emerald-500/10'}`}>
                <span className="text-[10px] font-black text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-widest mb-1">Precio</span>
                <span className="font-black text-xl text-emerald-600 dark:text-emerald-400 tracking-tighter">{currency}{product.price.toFixed(2)}</span>
            </div>
        </div>
    );
}
