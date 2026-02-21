import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Loader2, Eye, EyeOff, Wrench, ArrowLeft, AlertTriangle, ShieldOff } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';

interface LocationState {
    from?: { pathname: string };
}

export default function Login() {
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [showPass, setShowPass]     = useState(false);
    const [loading, setLoading]       = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [blocked, setBlocked]       = useState(false);
    const [shake, setShake]           = useState(false);

    const { signIn }      = useAuth();
    const { companyData } = useCompany();
    const navigate        = useNavigate();
    const location        = useLocation();

    const state = location.state as LocationState;
    const from  = state?.from?.pathname === '/' ? '/dashboard' : (state?.from?.pathname || '/dashboard');

    // Shake animation on error
    useEffect(() => {
        if (!shake) return;
        const t = setTimeout(() => setShake(false), 500);
        return () => clearTimeout(t);
    }, [shake]);

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
            setShake(true);
            const status = error?.status;
            const data   = error?.data;

            if (status === 429) {
                setBlocked(true);
                setAttemptsLeft(0);
            } else {
                const remaining = data?.attempts_left ?? null;
                setAttemptsLeft(remaining);
                const msg = error instanceof Error ? error.message : 'Ocurrió un error';
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const companyName = companyData?.name || 'Pernos y Cauchos JM';

    return (
        <div className="min-h-screen flex">

            {/* ── LEFT PANEL — Branding ── */}
            <div className="hidden lg:flex lg:w-[52%] bg-gray-900 flex-col relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-800/20 rounded-full blur-[100px] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <Wrench size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-white font-black text-sm tracking-wider leading-none uppercase">
                                {companyName}
                            </p>
                            <p className="text-primary text-[10px] font-bold tracking-[0.2em] mt-0.5 uppercase">
                                Sistema de Gestión
                            </p>
                        </div>
                    </div>

                    {/* Main text */}
                    <div className="mt-auto mb-auto pt-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                            </span>
                            <span className="text-primary text-xs font-bold tracking-widest uppercase">Sistema Activo</span>
                        </div>

                        <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                            Control total<br />
                            <span className="text-primary">de tu negocio</span>
                        </h1>
                        <p className="mt-5 text-gray-400 text-base leading-relaxed max-w-sm">
                            Gestiona ventas, inventario y clientes desde un solo lugar, rápido y seguro.
                        </p>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mt-auto">
                        {[
                            { label: 'Punto de Venta', value: 'POS' },
                            { label: 'Inventario', value: 'Stock' },
                            { label: 'Facturación', value: 'SRI' },
                        ].map(item => (
                            <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <p className="text-white font-black text-lg">{item.value}</p>
                                <p className="text-gray-500 text-[11px] font-semibold mt-0.5 uppercase tracking-wide">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL — Form ── */}
            <div className="flex-1 flex flex-col bg-slate-50">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-5 lg:px-10">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-semibold transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver al inicio
                    </button>

                    {/* Mobile brand */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <Wrench size={16} className="text-primary" />
                        <span className="text-gray-900 font-black text-sm uppercase tracking-wide">
                            {companyName}
                        </span>
                    </div>
                </div>

                {/* Form area */}
                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-sm">

                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                Iniciar sesión
                            </h2>
                            <p className="text-gray-500 mt-2 text-sm">
                                Ingresa tus credenciales para continuar
                            </p>
                        </div>

                        {/* Blocked banner */}
                        {blocked && (
                            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3.5">
                                <ShieldOff size={18} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold text-sm">Acceso bloqueado temporalmente</p>
                                    <p className="text-xs mt-0.5 text-red-500">Demasiados intentos fallidos. Intente nuevamente en 15 minutos.</p>
                                </div>
                            </div>
                        )}

                        {/* Attempts warning */}
                        {attemptsLeft !== null && !blocked && attemptsLeft <= 2 && (
                            <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-4 py-3">
                                <AlertTriangle size={16} className="shrink-0" />
                                <p className="text-sm font-semibold">
                                    {attemptsLeft === 0
                                        ? 'Último intento antes del bloqueo'
                                        : `${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''} restante${attemptsLeft !== 1 ? 's' : ''}`}
                                </p>
                            </div>
                        )}

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className={`space-y-4 transition-transform ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
                            style={shake ? { animation: 'shake 0.4s ease' } : {}}
                        >
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={blocked}
                                    placeholder="usuario@empresa.com"
                                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={blocked}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3.5 pr-12 bg-white border border-gray-200 rounded-2xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || blocked}
                                className="w-full py-4 mt-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm tracking-wide"
                            >
                                {loading
                                    ? <><Loader2 size={18} className="animate-spin" /> Verificando...</>
                                    : <><Lock size={16} /> Ingresar al sistema</>
                                }
                            </button>
                        </form>

                        {/* Footer note */}
                        <p className="mt-8 text-center text-xs text-gray-400">
                            Acceso restringido a personal autorizado.
                        </p>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="px-6 py-4 lg:px-10 border-t border-gray-200/60">
                    <p className="text-xs text-gray-400 text-center">
                        © {new Date().getFullYear()} {companyName} · Todos los derechos reservados
                    </p>
                </div>
            </div>

            {/* Shake keyframes via style tag */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%       { transform: translateX(-6px); }
                    40%       { transform: translateX(6px); }
                    60%       { transform: translateX(-4px); }
                    80%       { transform: translateX(4px); }
                }
            `}</style>
        </div>
    );
}
