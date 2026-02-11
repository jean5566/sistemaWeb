import { X } from 'lucide-react';

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: 'default' | 'large' | 'small' | string;
}

export function Modal({ title, isOpen, onClose, children, size = 'default' }: ModalProps) {
    if (!isOpen) return null;

    const sizeClasses = {
        'small': 'max-w-md',
        'default': 'max-w-2xl',
        'large': 'max-w-4xl',
        'extra-large': 'max-w-6xl'
    };

    const maxWidthClass = sizeClasses[size as keyof typeof sizeClasses] || 'max-w-2xl';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full ${maxWidthClass} overflow-hidden flex flex-col max-h-[90vh]`}>
                <header className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
