import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Wrench, CheckCircle2, Phone, MapPin, Clock,
    Settings, Cog, CarFront, ShieldCheck, Package, Zap,
    ChevronRight, Star, Users, Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Data ─────────────────────────────────────────────── */
const STATS = [
    { value: '10+',   label: 'Años de experiencia' },
    { value: '500+',  label: 'Productos en stock' },
    { value: '100%',  label: 'Garantía de calidad' },
    { value: '24h',   label: 'Atención rápida' },
];

const PRODUCTS = [
    {
        icon: Settings,
        title: 'Pernos y Fijaciones',
        desc: 'Graduados, milimétricos, de grado y seguridad. Para todo tipo de aplicaciones automotrices e industriales.',
        color: 'bg-blue-50 text-blue-600',
        border: 'group-hover:border-blue-200',
    },
    {
        icon: Cog,
        title: 'Rodamientos y Rolimanes',
        desc: 'Para ruedas, cajas de cambios, alternadores y motores. Marcas confiables con rotación perfecta.',
        color: 'bg-violet-50 text-violet-600',
        border: 'group-hover:border-violet-200',
    },
    {
        icon: CarFront,
        title: 'Cauchos y Soportes',
        desc: 'Soportes de motor, suspensión, retenedores y sellos para todo tipo de vehículos multimarca.',
        color: 'bg-emerald-50 text-emerald-600',
        border: 'group-hover:border-emerald-200',
    },
    {
        icon: Wrench,
        title: 'Terminales y Rótulas',
        desc: 'Dirección, mesas y articulaciones. Repuestos de primera calidad para seguridad en ruta.',
        color: 'bg-orange-50 text-orange-600',
        border: 'group-hover:border-orange-200',
    },
    {
        icon: Package,
        title: 'Filtros y Lubricantes',
        desc: 'Filtros de aceite, aire y combustible. Lubricantes sintéticos y semisintéticos multimarca.',
        color: 'bg-amber-50 text-amber-600',
        border: 'group-hover:border-amber-200',
    },
    {
        icon: Truck,
        title: 'Maquinaria Pesada',
        desc: 'Repuestos especializados para camiones, maquinaria agrícola e industrial de todo tonelaje.',
        color: 'bg-slate-100 text-slate-600',
        border: 'group-hover:border-slate-300',
    },
];

const WHY_US = [
    {
        icon: ShieldCheck,
        title: 'Garantía en cada pieza',
        desc: 'Trabajamos solo con marcas y proveedores certificados. Tu tranquilidad es nuestra prioridad.',
        bg: 'bg-blue-600',
    },
    {
        icon: Zap,
        title: 'Atención inmediata',
        desc: 'Asesoría personalizada para encontrar exactamente el repuesto que necesitas, sin esperas.',
        bg: 'bg-emerald-600',
    },
    {
        icon: Users,
        title: 'Expertos automotrices',
        desc: 'Más de 10 años atendiendo mecánicos, talleres y conductores particulares en la región.',
        bg: 'bg-violet-600',
    },
];

/* ─── Component ─────────────────────────────────────────── */
export default function Landing() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleAccess = () => navigate(user ? '/dashboard' : '/login');

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-primary/20 selection:text-primary">

            {/* ══ NAVBAR ══════════════════════════════════════════════ */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shadow">
                            <Wrench size={18} className="text-white" />
                        </div>
                        <div className="leading-none">
                            <p className="font-black text-gray-900 text-sm sm:text-base tracking-tight uppercase">
                                Pernos y Cauchos
                            </p>
                            <p className="text-primary font-bold text-[10px] tracking-[0.25em] uppercase mt-0.5">JM</p>
                        </div>
                    </div>

                    {/* Nav links — desktop */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
                        <a href="#productos" className="hover:text-gray-900 transition-colors">Productos</a>
                        <a href="#nosotros" className="hover:text-gray-900 transition-colors">Nosotros</a>
                        <a href="#contacto" className="hover:text-gray-900 transition-colors">Contacto</a>
                    </nav>

                    {/* CTA */}
                    <button
                        onClick={handleAccess}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold px-4 py-2.5 sm:px-5 rounded-xl transition-all shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <span className="hidden sm:inline">Acceso al Sistema</span>
                        <span className="sm:hidden">Ingresar</span>
                        <ArrowRight size={15} />
                    </button>
                </div>
            </header>

            <main className="flex-grow">

                {/* ══ HERO ════════════════════════════════════════════════ */}
                <section className="relative bg-gray-900 overflow-hidden min-h-[90vh] flex items-center">
                    {/* Background blobs */}
                    <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
                    <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] bg-blue-800/20 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-900/20 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                            {/* Left — Text */}
                            <div className="flex-1 text-center lg:text-left">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-7">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
                                        Especialistas Automotrices
                                    </span>
                                </div>

                                {/* Headline */}
                                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white leading-[1.08] tracking-tight">
                                    Todo para tu{' '}
                                    <span className="text-primary">vehículo</span>
                                    <br className="hidden sm:block" />
                                    {' '}y taller mecánico
                                </h1>

                                <p className="mt-6 text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                                    Venta especializada de repuestos, pernería y accesorios para el mantenimiento de autos, camionetas y maquinaria pesada.
                                </p>

                                {/* CTAs */}
                                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                                    <a
                                        href="#productos"
                                        className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5"
                                    >
                                        Ver catálogo <ChevronRight size={16} />
                                    </a>
                                    <a
                                        href="#contacto"
                                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3.5 rounded-xl border border-white/10 transition-all"
                                    >
                                        <Phone size={15} /> Contáctanos
                                    </a>
                                </div>

                                {/* Mini social proof */}
                                <div className="mt-10 flex items-center gap-3 justify-center lg:justify-start">
                                    <div className="flex -space-x-2">
                                        {['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500'].map((c, i) => (
                                            <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-gray-900 flex items-center justify-center`}>
                                                <Star size={10} className="text-white fill-white" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        <span className="text-white font-bold">+200 clientes</span> confían en nosotros
                                    </p>
                                </div>
                            </div>

                            {/* Right — Feature card */}
                            <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="p-2.5 bg-primary/20 rounded-xl">
                                            <Settings size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Nuestro stock incluye</p>
                                            <p className="text-gray-500 text-xs">+500 referencias disponibles</p>
                                        </div>
                                    </div>

                                    <ul className="space-y-2">
                                        {[
                                            { name: 'Pernos y Fijaciones',        sub: 'Graduados, mm y pulgadas' },
                                            { name: 'Cauchos y Soportes',         sub: 'Motor, suspensión y más' },
                                            { name: 'Rolimanes / Rodamientos',    sub: 'Para ruedas y cajas' },
                                            { name: 'Filtros de Aceite y Aire',   sub: 'Multimarca y sintéticos' },
                                            { name: 'Terminales y Rótulas',       sub: 'Sistemas de dirección' },
                                            { name: 'Retenedores y Sellos',       sub: 'Para evitar fugas' },
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/5">
                                                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                                <div>
                                                    <p className="text-white text-sm font-semibold leading-tight">{item.name}</p>
                                                    <p className="text-gray-500 text-xs mt-0.5">{item.sub}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                        <p className="text-gray-500 text-xs">¿No encuentras lo que buscas?</p>
                                        <a href="#contacto" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                                            Consúltanos <ChevronRight size={12} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ STATS BAR ═══════════════════════════════════════════ */}
                <section className="bg-gray-50 border-y border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200">
                            {STATS.map(s => (
                                <div key={s.label} className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                    <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
                                    <p className="text-gray-500 text-sm font-medium mt-1">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ PRODUCTOS ══════════════════════════════════════════ */}
                <section id="productos" className="py-20 sm:py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center mb-14">
                            <p className="text-primary font-bold text-xs tracking-[0.3em] uppercase mb-3">Catálogo</p>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                                ¿Qué encontrarás con nosotros?
                            </h2>
                            <p className="mt-4 text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                                Contamos con una amplia variedad de repuestos automotrices e industriales para mantener tu vehículo en óptimas condiciones.
                            </p>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {PRODUCTS.map((p) => {
                                const Icon = p.icon;
                                return (
                                    <div
                                        key={p.title}
                                        className={`group bg-white border-2 border-gray-100 ${p.border} rounded-3xl p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-default`}
                                    >
                                        <div className={`inline-flex p-3 rounded-2xl ${p.color} mb-5 transition-transform duration-300 group-hover:scale-110`}>
                                            <Icon size={22} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{p.title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ══ POR QUÉ NOSOTROS ═══════════════════════════════════ */}
                <section id="nosotros" className="py-20 sm:py-28 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

                            {/* Left text */}
                            <div className="flex-1 text-center lg:text-left">
                                <p className="text-primary font-bold text-xs tracking-[0.3em] uppercase mb-3">Por qué elegirnos</p>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                    Tu taller merece los
                                    <br />
                                    <span className="text-primary">mejores repuestos</span>
                                </h2>
                                <p className="mt-5 text-gray-500 text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                                    Somos especialistas con más de una década atendiendo mecánicos, talleres y conductores particulares en la región. Calidad y precio justo, siempre.
                                </p>
                                <a
                                    href="#contacto"
                                    className="mt-8 inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    Habla con nosotros <ArrowRight size={16} />
                                </a>
                            </div>

                            {/* Right cards */}
                            <div className="flex-1 w-full space-y-4">
                                {WHY_US.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.title} className="flex items-start gap-5 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className={`p-3 rounded-xl ${item.bg} shrink-0`}>
                                                <Icon size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ CTA BAND ════════════════════════════════════════════ */}
                <section className="bg-primary py-14 sm:py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            ¿Buscas un repuesto en específico?
                        </h2>
                        <p className="mt-3 text-blue-100 text-base sm:text-lg max-w-xl mx-auto">
                            Acércate a nuestro local o llámanos. Te asesoramos de inmediato.
                        </p>
                        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                                href="tel:"
                                className="flex items-center justify-center gap-2 bg-white text-primary font-bold px-6 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
                            >
                                <Phone size={16} /> Llamar ahora
                            </a>
                            <a
                                href="#contacto"
                                className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3.5 rounded-xl transition-all border border-blue-500"
                            >
                                Ver ubicación <MapPin size={16} />
                            </a>
                        </div>
                    </div>
                </section>

                {/* ══ CONTACTO ════════════════════════════════════════════ */}
                <section id="contacto" className="bg-gray-900 py-20 sm:py-28 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none flex justify-center items-center">
                        <div className="w-[700px] h-[700px] bg-primary rounded-full blur-[140px]" />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <p className="text-primary font-bold text-xs tracking-[0.3em] uppercase mb-3">Encuéntranos</p>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                                Estamos para ayudarte
                            </h2>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
                            {[
                                {
                                    icon: MapPin,
                                    title: 'Ubicación',
                                    lines: ['Centro de la Ciudad', 'Ventas al por mayor y menor'],
                                    color: 'bg-blue-500/20 text-blue-400',
                                },
                                {
                                    icon: Phone,
                                    title: 'Llámanos',
                                    lines: ['Consultas de repuestos', 'Atención inmediata'],
                                    color: 'bg-emerald-500/20 text-emerald-400',
                                },
                                {
                                    icon: Clock,
                                    title: 'Horarios',
                                    lines: ['Lunes a Sábado', '8:00 AM – 6:00 PM'],
                                    color: 'bg-violet-500/20 text-violet-400',
                                },
                            ].map((c) => {
                                const Icon = c.icon;
                                return (
                                    <div key={c.title} className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-3xl p-7 text-center flex flex-col items-center">
                                        <div className={`p-4 rounded-2xl ${c.color} mb-5`}>
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="font-bold text-white text-lg mb-2">{c.title}</h3>
                                        {c.lines.map(l => (
                                            <p key={l} className="text-gray-400 text-sm leading-relaxed">{l}</p>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>

            {/* ══ FOOTER ══════════════════════════════════════════════ */}
            <footer className="bg-gray-950 border-t border-white/5 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                            <Wrench size={14} className="text-white" />
                        </div>
                        <span className="text-gray-300 font-bold text-sm tracking-wide">Pernos y Cauchos JM</span>
                    </div>

                    <p className="text-gray-600 text-xs text-center">
                        © {new Date().getFullYear()} Pernos y Cauchos JM · Todos los derechos reservados
                    </p>

                    <button
                        onClick={handleAccess}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-semibold transition-colors"
                    >
                        Acceso al sistema <ArrowRight size={12} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
