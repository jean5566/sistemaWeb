import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wrench, Settings, CheckCircle2, Phone, MapPin, Clock, CarFront, Cog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleLoginClick = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
            {/* Header / Navbar */}
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">

                        <div className="flex flex-col">
                            <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-none tracking-tight">
                                PERNOS Y CAUCHOS
                            </h1>
                            <p className="text-primary font-bold text-xs sm:text-sm tracking-widest mt-0.5">
                                JM
                            </p>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={handleLoginClick}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-1.5 sm:gap-2 min-w-[120px] sm:min-w-[160px]"
                        >
                            <span className="hidden sm:inline">Acceso al Sistema</span>
                            <span className="sm:hidden">Ingresar</span>
                            <ArrowRight size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-grow">
                {/* Clean, Light Hero Section with Product List Card */}
                <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] flex items-center justify-center py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
                    {/* Abstract Background Light Shapes */}
                    <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-60 pointer-events-none" aria-hidden="true">
                        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-200 to-sky-100 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
                    </div>

                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12 w-full">
                        {/* Left Column (Text & Value Prop) */}
                        <div className="flex-1 text-center lg:text-left mt-8 lg:mt-0">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-sm mb-6 sm:mb-8 border border-emerald-200">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                Especialistas Automotrices e Industriales
                            </div>
                            <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5 sm:mb-6">
                                Todo para tu vehículo <br className="hidden md:block" />y taller mecánico
                            </h2>
                            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl leading-relaxed text-gray-600 font-medium">
                                Venta especializada de repuestos, accesorios y piezas esenciales para el mantenimiento de todo tipo de autos y maquinaria pesada.
                            </p>
                        </div>

                        {/* Right Column (Product Feature Card) */}
                        <div className="w-full lg:w-[420px] shrink-0">
                            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl shadow-primary/10 border border-gray-100 relative overflow-hidden group">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -z-10"></div>

                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <Settings size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                                    </div>
                                    Nuestro stock incluye:
                                </h3>

                                <ul className="space-y-2.5 text-sm sm:text-base">
                                    {[
                                        { name: 'Pernos y Fijaciones', extra: 'Graduados, mm y pulgadas' },
                                        { name: 'Cauchos y Soportes', extra: 'Motor, suspensión y más' },
                                        { name: 'Rolimanes / Rodamientos', extra: 'Para ruedas y cajas' },
                                        { name: 'Filtros de Aceite y Aire', extra: 'Multimarca y sintéticos' },
                                        { name: 'Terminales y Rotulas', extra: 'Sistemas de dirección' },
                                        { name: 'Retenedores y Sellos', extra: 'Para evitar posibles fugas' },
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex gap-3 items-start bg-gray-50/50 p-2.5 rounded-2xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100">
                                            <div className="mt-0.5">
                                                <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-sm" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight">{item.name}</p>
                                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{item.extra}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features / Product Portfolio Section */}
                <section className="py-16 sm:py-24 lg:py-32 bg-white relative border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16 lg:mb-20">
                            <h2 className="text-sm sm:text-base font-bold text-primary mb-2 tracking-widest uppercase">Nuestro portafolio</h2>
                            <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                                ¿Qué encontrarás con nosotros?
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                            {/* Product Cat 1 */}
                            <div className="group flex flex-col items-center text-center bg-gray-50/50 p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:bg-white hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                                <div className="h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300 mb-6">
                                    <Settings className="h-7 w-7 sm:h-8 sm:w-8 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Pernos y Fijaciones</h3>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                    Surtido completo en pernería automotriz e industrial. Tuercas, arandelas, tornillos milimétricos, de grado y seguridad, listos para cualquier componente mecánico.
                                </p>
                            </div>

                            {/* Product Cat 2 */}
                            <div className="group flex flex-col items-center text-center bg-gray-50/50 p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:bg-white hover:border-blue-500/20 transition-all duration-300 transform hover:-translate-y-1">
                                <div className="h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center rounded-2xl bg-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 mb-6">
                                    <Cog className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Rodamientos y Rolimanes</h3>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                    Rodamientos (Rolimanes) para ruedas, cajas de cambios, alternadores y motores. Marcas confiables para garantizar una rotación perfecta y duradera.
                                </p>
                            </div>

                            {/* Product Cat 3 */}
                            <div className="group flex flex-col items-center text-center bg-gray-50/50 p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:bg-white hover:border-emerald-500/20 transition-all duration-300 transform hover:-translate-y-1">
                                <div className="h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center rounded-2xl bg-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 mb-6">
                                    <CarFront className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Repuestos Automotrices</h3>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                    Cauchos, soportes de motor, terminales, mesas y suspensión. Proveemos repuestos esenciales en mecánica rápida y profunda para autos multimarca.
                                </p>
                            </div>
                        </div>

                        {/* Extra Trust Indicator */}
                        <div className="mt-16 sm:mt-24 pt-8 border-t border-gray-100 flex items-center justify-center">
                            <div className="flex items-center gap-3 bg-emerald-50 px-6 py-3 rounded-full">
                                <CheckCircle2 className="text-emerald-600" size={24} />
                                <span className="font-bold text-gray-800">Calidad garantizada en todos nuestros repuestos</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Info / Contact Section */}
                <section className="bg-gray-900 py-16 sm:py-24 lg:py-32 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 opacity-10 flex justify-center items-center pointer-events-none">
                        <div className="w-[800px] h-[800px] bg-primary rounded-full blur-[120px]"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                                ¿Buscas un repuesto en específico?
                            </h2>
                            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-400">
                                Acércate a nuestro local o llámanos para verificar disponibilidad.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
                            {/* Contact Box 1 */}
                            <div className="bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/10 text-center text-white flex flex-col items-center transform transition hover:bg-white/10">
                                <div className="bg-primary/20 p-3 sm:p-4 rounded-full mb-4 sm:mb-5 ring-1 ring-primary/50">
                                    <MapPin className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                                <h3 className="font-bold text-lg sm:text-xl mb-2">Ubicación</h3>
                                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                                    Centro de la Ciudad<br />Ventas al por mayor y menor
                                </p>
                            </div>

                            {/* Contact Box 2 */}
                            <div className="bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/10 text-center text-white flex flex-col items-center transform transition hover:bg-white/10">
                                <div className="bg-primary/20 p-3 sm:p-4 rounded-full mb-4 sm:mb-5 ring-1 ring-primary/50">
                                    <Phone className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                                <h3 className="font-bold text-lg sm:text-xl mb-2">Llámanos</h3>
                                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                                    Consultas de rolimanes y repuestos<br />Atención Inmediata
                                </p>
                            </div>

                            {/* Contact Box 3 */}
                            <div className="sm:col-span-2 md:col-span-1 bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/10 text-center text-white flex flex-col items-center transform transition hover:bg-white/10">
                                <div className="bg-primary/20 p-3 sm:p-4 rounded-full mb-4 sm:mb-5 ring-1 ring-primary/50">
                                    <Clock className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                                <h3 className="font-bold text-lg sm:text-xl mb-2">Horarios</h3>
                                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                                    Lunes a Sábado<br />8:00 AM - 6:00 PM
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-gray-900 group">
                        <Wrench size={18} className="text-primary transition-transform group-hover:rotate-45" />
                        <span className="font-bold text-sm sm:text-base tracking-wide">Pernos y Cauchos JM</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
                        © {new Date().getFullYear()} Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
