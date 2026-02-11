import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Lock, Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [systemInitialized, setSystemInitialized] = useState(true);
    const { signIn, signUp, checkSystemInitialization } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    interface LocationState {
        from?: {
            pathname: string;
        };
    }

    const state = location.state as LocationState;
    const from = state?.from?.pathname || '/';

    useEffect(() => {
        const checkInit = async () => {
            const initialized = await checkSystemInitialization();
            setSystemInitialized(initialized);
            if (!initialized) {
                setIsSignUp(true);
            }
        };
        checkInit();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                await signUp(email, password);
                toast.success('Cuenta de administrador creada. ¡Bienvenido!');
            } else {
                await signIn(email, password);
                toast.success('Bienvenido');
            }
            navigate(from, { replace: true });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error';
            toast.error('Error: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8 pb-0 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="text-primary" size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
                    <p className="text-gray-500">
                        {isSignUp ? 'Configurar Administrador Inicial' : 'Ingresa a tu cuenta para continuar'}
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary hover:brightness-110 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
                    </button>

                    {isSignUp && (
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl text-sm text-center">
                            <p>Bienvenido. Al ser el primer usuario, se le asignarán permisos de <strong>Administrador</strong>.</p>
                        </div>
                    )}

                    {!systemInitialized && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-primary font-bold hover:underline"
                            >
                                {isSignUp ? 'Volver al Login' : 'Configurar Administrador'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
