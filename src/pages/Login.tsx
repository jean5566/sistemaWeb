import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Lock, Loader2, ArrowLeft } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [blocked, setBlocked] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    interface LocationState {
        from?: {
            pathname: string;
        };
    }

    const state = location.state as LocationState;
    const from = state?.from?.pathname === '/' ? '/dashboard' : (state?.from?.pathname || '/dashboard');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (blocked) return;
        setLoading(true);
        try {
            await signIn(email, password);
            setAttemptsLeft(null);
            setBlocked(false);
            toast.success('Bienvenido');
            navigate(from, { replace: true });
        } catch (error: any) {
            const status = error?.status;
            const data   = error?.data;

            if (status === 429) {
                setBlocked(true);
                setAttemptsLeft(0);
                toast.error(data?.error || 'Demasiados intentos. Espere 15 minutos.');
            } else {
                const remaining = data?.attempts_left ?? null;
                setAttemptsLeft(remaining);
                const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error';
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
            {/* Back Button */}
            <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <ArrowLeft size={18} />
                    <span className="font-bold text-sm">Volver al inicio</span>
                </button>
            </div>

            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden mt-12 sm:mt-0">
                <div className="p-8 pb-0 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="text-primary" size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
                    <p className="text-gray-500">
                        Ingresa a tu cuenta para continuar
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900 ml-1">Email</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 placeholder:text-gray-400"
                                placeholder="usuario@empresa.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900 ml-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 placeholder:text-gray-400"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {attemptsLeft !== null && !blocked && attemptsLeft <= 2 && (
                        <p className="text-center text-sm font-semibold text-amber-600 bg-amber-50 rounded-xl px-4 py-2">
                            Advertencia: {attemptsLeft} intento{attemptsLeft !== 1 ? 's' : ''} restante{attemptsLeft !== 1 ? 's' : ''} antes de bloqueo temporal.
                        </p>
                    )}

                    {blocked && (
                        <p className="text-center text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-4 py-2">
                            Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || blocked}
                        className="w-full py-4 bg-primary hover:brightness-110 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        {loading ? 'Procesando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}
