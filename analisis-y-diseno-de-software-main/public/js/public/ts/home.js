import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { PublicSimulator } from "./components/PublicSimulator.js";
import { useAuth } from "./store/authStore.js";
const validateRUT = (rut) => {
    const cleanRUT = rut.replace(/[.-]/g, '');
    if (cleanRUT.length < 8)
        return false;
    const body = cleanRUT.slice(0, -1);
    const verifier = cleanRUT.slice(-1).toLowerCase();
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const expectedVerifier = 11 - (sum % 11);
    const finalVerifier = expectedVerifier === 11 ? '0' : expectedVerifier === 10 ? 'k' : expectedVerifier.toString();
    return verifier === finalVerifier;
};
const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
const calculatePasswordStrength = (password) => {
    let score = 0;
    const suggestions = [];
    if (password.length >= 8)
        score++;
    else
        suggestions.push("Mínimo 8 caracteres");
    if (password.length >= 12)
        score++;
    if (/[A-Z]/.test(password))
        score++;
    else
        suggestions.push("Incluye mayúsculas");
    if (/[a-z]/.test(password))
        score++;
    else
        suggestions.push("Incluye minúsculas");
    if (/[0-9]/.test(password))
        score++;
    else
        suggestions.push("Incluye números");
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password))
        score++;
    else
        suggestions.push("Incluye símbolos");
    const maxScore = 6;
    const normalizedScore = Math.min(4, Math.floor((score / maxScore) * 5));
    const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];
    return {
        score: normalizedScore,
        label: labels[normalizedScore] || 'Muy débil',
        color: colors[normalizedScore] || '#ef4444',
        suggestions: suggestions.slice(0, 3)
    };
};
// --- UI Components ---
const Navbar = ({ onLogin, onRegister }) => {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (_jsx("nav", { className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`, children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm", children: "AP" }), _jsx("span", { className: "text-xl font-bold text-slate-900 tracking-tight", children: "Aurora Priv\u00E9" })] }), _jsxs("div", { className: "hidden md:flex items-center gap-8", children: [_jsx("a", { href: "#features", className: "text-sm font-medium text-slate-600 hover:text-slate-900 transition", children: "Caracter\u00EDsticas" }), _jsx("a", { href: "#security", className: "text-sm font-medium text-slate-600 hover:text-slate-900 transition", children: "Seguridad" }), _jsx("button", { onClick: onLogin, className: "text-sm font-medium text-slate-900 hover:text-indigo-600 transition", children: "Iniciar Sesi\u00F3n" }), _jsx("button", { onClick: onRegister, className: "bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/20", children: "Registrarse" })] })] }) }));
};
const Hero = ({ onGetStarted }) => (_jsxs("section", { className: "relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 -z-10", children: [_jsx("div", { className: "absolute top-0 right-0 -translate-y-12 translate-x-12 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" }), _jsx("div", { className: "absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl" })] }), _jsxs("div", { className: "max-w-7xl mx-auto px-6 text-center", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-8 border border-indigo-100", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-indigo-500 animate-pulse" }), "Nueva Banca Digital v2.0"] }), _jsxs("h1", { className: "text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-6 leading-tight", children: ["Tu futuro financiero ", _jsx("br", {}), _jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600", children: "reimaginado." })] }), _jsx("p", { className: "text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed", children: "Gestiona tus cr\u00E9ditos, simula pr\u00E9stamos y controla tus finanzas con la plataforma m\u00E1s avanzada y segura del mercado. Sin filas, sin papeleo." }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4", children: [_jsx("button", { onClick: onGetStarted, className: "w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20", children: "Comenzar ahora" }), _jsx("button", { className: "w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold text-lg hover:bg-slate-50 transition", children: "Ver demostraci\u00F3n" })] })] })] }));
const Features = () => (_jsx("section", { id: "features", className: "py-24 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-3xl font-bold text-slate-900 mb-4", children: "Todo lo que necesitas" }), _jsx("p", { className: "text-slate-600 max-w-2xl mx-auto", children: "Una suite completa de herramientas financieras dise\u00F1adas para darte el control total." })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-8", children: [
                    { icon: "⚡", title: "Rápido y Simple", desc: "Solicitudes aprobadas en minutos con nuestra IA de evaluación de riesgo." },
                    { icon: "🛡️", title: "Seguridad Total", desc: "Encriptación de grado militar y autenticación biométrica para proteger tus activos." },
                    { icon: "📱", title: "100% Digital", desc: "Olvídate de las sucursales. Gestiona todo desde tu dispositivo, donde sea." }
                ].map((f, i) => (_jsxs("div", { className: "p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition duration-300", children: [_jsx("div", { className: "w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm mb-6", children: f.icon }), _jsx("h3", { className: "text-xl font-bold text-slate-900 mb-3", children: f.title }), _jsx("p", { className: "text-slate-600 leading-relaxed", children: f.desc })] }, i))) })] }) }));
const InputField = ({ label, type, name, placeholder, required, error, success, helperText, onChange }) => (_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: label }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: type, name: name, placeholder: placeholder, required: required, onChange: (e) => onChange?.(e.target.value), className: `w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-100' : success ? 'border-green-300 focus:ring-green-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'}` }), error && _jsx("span", { className: "absolute right-3 top-3 text-red-500", children: "\u2715" }), success && _jsx("span", { className: "absolute right-3 top-3 text-green-500", children: "\u2713" })] }), helperText && _jsx("p", { className: `text-xs ${error ? 'text-red-500' : 'text-slate-500'}`, children: helperText })] }));
const AuthPanel = ({ mode, onModeChange, onSubmit }) => {
    const [formValues, setFormValues] = useState({ fullName: '', rut: '', email: '', password: '' });
    const [validations, setValidations] = useState({ rut: false, email: false, password: false });
    const handleFieldChange = (field, value) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
        if (field === 'rut')
            setValidations(prev => ({ ...prev, rut: validateRUT(value) }));
        if (field === 'email')
            setValidations(prev => ({ ...prev, email: validateEmail(value) }));
        if (field === 'password') {
            const strength = calculatePasswordStrength(value);
            setValidations(prev => ({ ...prev, password: strength.score >= 2 }));
        }
    };
    return (_jsxs("div", { className: "bg-white p-8 rounded-3xl shadow-xl border border-slate-100", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h3", { className: "text-2xl font-bold text-slate-900 mb-2", children: mode === 'login' ? 'Bienvenido de nuevo' : mode === 'signup' ? 'Crea tu cuenta' : 'Recuperar acceso' }), _jsx("p", { className: "text-slate-500", children: mode === 'login' ? 'Ingresa a tu banca digital.' : mode === 'signup' ? 'Comienza tu viaje financiero hoy.' : 'Te enviaremos instrucciones.' })] }), _jsxs("form", { onSubmit: (e) => onSubmit(mode, e), className: "space-y-5", children: [mode === 'signup' && (_jsxs(_Fragment, { children: [_jsx(InputField, { label: "Nombre Completo", type: "text", name: "fullName", placeholder: "Juan P\u00E9rez", required: true, onChange: (v) => handleFieldChange('fullName', v) }), _jsx(InputField, { label: "RUT", type: "text", name: "rut", placeholder: "12.345.678-9", required: true, error: formValues.rut && !validations.rut, success: validations.rut, helperText: formValues.rut && !validations.rut ? "RUT inválido" : "", onChange: (v) => handleFieldChange('rut', v) })] })), _jsx(InputField, { label: "Correo Electr\u00F3nico", type: "email", name: "email", placeholder: "juan@ejemplo.com", required: true, error: formValues.email && !validations.email, success: validations.email, onChange: (v) => handleFieldChange('email', v) }), mode !== 'forgot-password' && (_jsx(InputField, { label: "Contrase\u00F1a", type: "password", name: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, onChange: (v) => handleFieldChange('password', v) })), _jsx("button", { type: "submit", className: "w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20", children: mode === 'login' ? 'Ingresar' : mode === 'signup' ? 'Crear Cuenta' : 'Enviar Instrucciones' })] }), _jsx("div", { className: "mt-6 flex items-center justify-between text-sm", children: mode === 'login' ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => onModeChange('forgot-password'), className: "text-slate-500 hover:text-indigo-600", children: "\u00BFOlvidaste tu contrase\u00F1a?" }), _jsx("button", { onClick: () => onModeChange('signup'), className: "font-semibold text-indigo-600 hover:text-indigo-700", children: "Crear cuenta" })] })) : (_jsx("button", { onClick: () => onModeChange('login'), className: "w-full text-center text-slate-500 hover:text-indigo-600", children: "Volver al inicio de sesi\u00F3n" })) })] }));
};
const Footer = () => (_jsxs("footer", { className: "bg-slate-900 text-slate-400 py-12", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8", children: [_jsxs("div", { className: "col-span-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("div", { className: "w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold", children: "AP" }), _jsx("span", { className: "text-lg font-bold text-white", children: "Aurora Priv\u00E9" })] }), _jsx("p", { className: "max-w-xs text-sm", children: "La banca del futuro, hoy. Segura, r\u00E1pida y dise\u00F1ada para ti." })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold mb-4", children: "Producto" }), _jsxs("ul", { className: "space-y-2 text-sm", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition", children: "Cr\u00E9ditos" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition", children: "Cuentas" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition", children: "Inversiones" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold mb-4", children: "Legal" }), _jsxs("ul", { className: "space-y-2 text-sm", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition", children: "T\u00E9rminos" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition", children: "Privacidad" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition", children: "Seguridad" }) })] })] })] }), _jsx("div", { className: "max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-xs text-center", children: "\u00A9 2025 Aurora Priv\u00E9 Bank. Todos los derechos reservados." })] }));
const App = () => {
    const [authMode, setAuthMode] = useState("login");
    const { login, register } = useAuth();
    const handleAuthSubmit = async (mode, e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = form.get("email")?.toString() || "";
        const password = form.get("password")?.toString() || "";
        try {
            if (mode === "login") {
                await login(email, password);
                window.location.href = '/dashboard';
            }
            else if (mode === "signup") {
                const fullName = form.get("fullName")?.toString() || "";
                const [nombre, ...rest] = fullName.split(" ");
                await register({
                    email, password, nombre, apellido: rest.join(" ") || nombre,
                    rut: form.get("rut")?.toString() || "",
                    telefono: ""
                });
                window.location.href = '/dashboard';
            }
        }
        catch (err) {
            alert("Error: " + err.message);
        }
    };
    const scrollToAuth = () => {
        document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    };
    return (_jsxs("div", { className: "min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900", children: [_jsx(Navbar, { onLogin: () => { setAuthMode('login'); scrollToAuth(); }, onRegister: () => { setAuthMode('signup'); scrollToAuth(); } }), _jsx(Hero, { onGetStarted: () => { setAuthMode('signup'); scrollToAuth(); } }), _jsx(Features, {}), _jsx("section", { id: "auth-section", className: "py-24 bg-slate-50 relative overflow-hidden", children: _jsx("div", { className: "max-w-7xl mx-auto px-6 relative z-10", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-16 items-start", children: [_jsxs("div", { children: [_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-3xl font-bold text-slate-900 mb-4", children: "Simula tu cr\u00E9dito ideal" }), _jsx("p", { className: "text-slate-600", children: "Calcula cuotas, intereses y plazos en tiempo real. Sin compromisos." })] }), _jsx(PublicSimulator, { onRequestLoan: () => { setAuthMode('signup'); scrollToAuth(); } })] }), _jsx("div", { className: "lg:mt-0 mt-12", children: _jsx(AuthPanel, { mode: authMode, onModeChange: setAuthMode, onSubmit: handleAuthSubmit }) })] }) }) }), _jsx(Footer, {})] }));
};
const container = document.getElementById("root");
if (container) {
    createRoot(container).render(_jsx(App, {}));
}
