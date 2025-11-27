import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
const navLinks = [
    { href: "#acceso", label: "Acceso" },
    { href: "#respaldo", label: "Respaldo" },
];
const stats = [
    { value: "12", label: "Años diseñando patrimonio" },
    { value: "98%", label: "Clientes renuevan" },
    { value: "$320M", label: "Activos privados" },
];
const assurances = [
    { title: "Gobierno serio", caption: "Comités de riesgo y auditoría continua." },
    { title: "Custodia blindada", caption: "Infraestructura certificada y cifrado integral." },
    { title: "Equipo privado", caption: "Asesores senior para decisiones sensibles." },
];
const authCopy = {
    signup: {
        title: "Abre tu acceso",
        hint: "Consolida tus créditos en Aurora Privé.",
        cta: "Crear cuenta",
    },
    login: {
        title: "Bienvenido",
        hint: "Ingresa a tu portafolio seguro.",
        cta: "Continuar",
    },
};
const OutlineButton = ({ children, onClick, className = "", type = "button", }) => (_jsx("button", { type: type, onClick: onClick, className: `inline-flex items-center justify-center rounded-full border border-slate-300/70 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 ${className}`.trim(), children: children }));
const PrimaryButton = ({ children, onClick, className = "", type = "button", }) => (_jsx("button", { type: type, onClick: onClick, className: `inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-700 ${className}`.trim(), children: children }));
const InputField = ({ label, type, name, placeholder, autoComplete, }) => (_jsxs("label", { className: "grid gap-1 text-left", children: [_jsx("span", { className: "text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400", children: label }), _jsx("input", { className: "w-full rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 shadow-inner shadow-white/70 outline-none transition focus:border-slate-900 focus:bg-white focus:ring focus:ring-slate-900/10", type: type, name: name, placeholder: placeholder, autoComplete: autoComplete, required: true })] }));
const AuthPanel = ({ mode, onModeChange, onSubmit, }) => {
    const fields = useMemo(() => {
        if (mode === "signup") {
            return (_jsxs(_Fragment, { children: [_jsx(InputField, { label: "Nombre", type: "text", name: "fullName", placeholder: "Sof\u00EDa Ram\u00EDrez", autoComplete: "name" }), _jsx(InputField, { label: "Correo", type: "email", name: "email", placeholder: "sofia@aurora.com", autoComplete: "email" }), _jsx(InputField, { label: "Contrase\u00F1a", type: "password", name: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "new-password" })] }));
        }
        return (_jsxs(_Fragment, { children: [_jsx(InputField, { label: "Correo", type: "email", name: "email", placeholder: "tu@aurora.com", autoComplete: "email" }), _jsx(InputField, { label: "Contrase\u00F1a", type: "password", name: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password" })] }));
    }, [mode]);
    const copy = authCopy[mode];
    return (_jsxs("section", { id: "acceso", className: "relative isolate overflow-hidden rounded-[2rem] bg-white/75 p-8 shadow-xl shadow-slate-900/10 ring-1 ring-white/60 backdrop-blur", children: [_jsx("div", { className: "absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_rgba(15,23,42,0.08))]" }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400", children: mode === "signup" ? "Alta" : "Ingreso" }), _jsx("h2", { className: "mt-2 text-2xl font-semibold text-slate-900", children: copy.title }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: copy.hint })] }), _jsxs("div", { className: "flex gap-2 rounded-full bg-slate-900/5 p-1", children: [_jsx("button", { type: "button", onClick: () => onModeChange("signup"), className: `rounded-full px-3 py-1 text-xs font-semibold transition ${mode === "signup" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"}`, children: "Registro" }), _jsx("button", { type: "button", onClick: () => onModeChange("login"), className: `rounded-full px-3 py-1 text-xs font-semibold transition ${mode === "login" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"}`, children: "Ingreso" })] })] }), _jsxs("form", { className: "mt-6 grid gap-5", onSubmit: (event) => onSubmit(mode, event), children: [fields, _jsx(PrimaryButton, { className: "mt-2 w-full", type: "submit", children: copy.cta })] }), _jsx("p", { className: "mt-5 text-center text-xs text-slate-400", children: "Al continuar aceptas el acuerdo de servicio." })] }));
};
const Toast = ({ state, onClose }) => {
    if (!state)
        return null;
    const toneStyles = state.tone === "success"
        ? "bg-emerald-500 text-white shadow-emerald-600/40"
        : "bg-slate-900 text-white shadow-slate-900/30";
    return (_jsx("div", { className: `pointer-events-auto fixed inset-x-0 top-6 z-50 mx-auto w-fit rounded-full px-5 py-3 text-sm font-medium shadow-lg ${toneStyles}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "inline-flex h-2.5 w-2.5 rounded-full bg-white/70" }), _jsx("span", { children: state.message }), _jsx("button", { type: "button", onClick: onClose, className: "rounded-full bg-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/80 transition hover:bg-white/30", children: "Cerrar" })] }) }));
};
const App = () => {
    const [authMode, setAuthMode] = useState("signup");
    const [toast, setToast] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const handleSubmit = (mode, event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const name = form.get("fullName")?.toString();
        const email = form.get("email")?.toString();
        setToast({
            tone: mode === "signup" ? "success" : "info",
            message: mode === "signup" ? `Cuenta activada para ${name ?? email ?? "nuevo cliente"}` : `Bienvenido de nuevo, ${email ?? "cliente"}`,
        });
        window.setTimeout(() => {
            setToast(null);
        }, 3600);
    };
    return (_jsxs("div", { className: "relative min-h-screen bg-[#f5f7fb] text-slate-900", children: [_jsxs("div", { className: "pointer-events-none absolute inset-0 -z-10 overflow-hidden", children: [_jsx("div", { className: "absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(15,23,42,0.09),_rgba(15,23,42,0))]" }), _jsx("div", { className: "absolute right-[10%] top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(30,64,175,0.22),_rgba(30,64,175,0))]" }), _jsx("div", { className: "absolute left-[8%] bottom-14 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(14,116,144,0.22),_rgba(14,116,144,0))]" })] }), _jsx(Toast, { state: toast, onClose: () => setToast(null) }), _jsxs("header", { className: "mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8", children: [_jsxs("a", { href: "#", className: "flex items-center gap-2 text-lg font-semibold text-slate-900", children: [_jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white", children: "AP" }), "Aurora Priv\u00E9"] }), _jsx("nav", { className: "hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex", children: navLinks.map((link) => (_jsx("a", { href: link.href, className: "transition hover:text-slate-900", children: link.label }, link.href))) }), _jsxs("div", { className: "hidden gap-3 md:flex", children: [_jsx(OutlineButton, { onClick: () => setAuthMode("login"), children: "Iniciar sesi\u00F3n" }), _jsx(PrimaryButton, { onClick: () => setAuthMode("signup"), children: "Abrir cuenta" })] }), _jsxs("button", { type: "button", className: "md:hidden", onClick: () => setMobileOpen((prev) => !prev), "aria-label": "Alternar navegaci\u00F3n", children: [_jsx("span", { className: "block h-0.5 w-6 bg-slate-900" }), _jsx("span", { className: "mt-1 block h-0.5 w-6 bg-slate-900" }), _jsx("span", { className: "mt-1 block h-0.5 w-6 bg-slate-900" })] })] }), mobileOpen ? (_jsxs("div", { className: "mx-6 mb-6 rounded-3xl border border-slate-200/60 bg-white/90 p-6 text-sm text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur md:hidden", children: [_jsx("nav", { className: "grid gap-4", children: navLinks.map((link) => (_jsx("a", { href: link.href, className: "font-medium text-slate-700", onClick: () => setMobileOpen(false), children: link.label }, link.href))) }), _jsxs("div", { className: "mt-6 grid gap-3", children: [_jsx(OutlineButton, { className: "w-full", onClick: () => setAuthMode("login"), children: "Iniciar sesi\u00F3n" }), _jsx(PrimaryButton, { className: "w-full", onClick: () => setAuthMode("signup"), children: "Abrir cuenta" })] })] })) : null, _jsxs("main", { className: "mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24", children: [_jsxs("section", { className: "grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center", children: [_jsxs("div", { className: "flex flex-col gap-10", children: [_jsxs("div", { className: "max-w-xl space-y-6", children: [_jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-white/60 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500", children: ["Aurora Priv\u00E9", _jsx("span", { className: "h-1 w-1 rounded-full bg-slate-400" }), "Banca confidencial"] }), _jsx("h1", { className: "text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl", children: "Cr\u00E9dito inteligente con criterio privado" }), _jsx("p", { className: "text-base text-slate-600", children: "Experimenta una plataforma dise\u00F1ada para ejecutivos que priorizan control, transparencia y confianza." }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [] })] }), _jsx("dl", { className: "grid gap-4 sm:grid-cols-3", children: stats.map((item) => (_jsxs("div", { className: "rounded-2xl border border-white/50 bg-white/70 px-5 py-4 shadow-sm shadow-white/50 backdrop-blur", children: [_jsx("dt", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: item.label }), _jsx("dd", { className: "mt-2 text-2xl font-semibold text-slate-900", children: item.value })] }, item.label))) })] }), _jsx(AuthPanel, { mode: authMode, onModeChange: setAuthMode, onSubmit: handleSubmit })] }), _jsxs("section", { id: "respaldo", className: "grid gap-6 rounded-[2.5rem] border border-white/60 bg-white/80 p-10 shadow-xl shadow-slate-900/10 backdrop-blur", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-semibold text-slate-900", children: "Respaldos que importan" }), _jsx("p", { className: "mt-2 max-w-xl text-sm text-slate-500", children: "Nuestra gobernanza combina tecnolog\u00EDa auditada y custodios certificados para proteger cada decisi\u00F3n." })] })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-3", children: assurances.map((item) => (_jsxs("article", { className: "rounded-2xl border border-white/70 bg-white px-5 py-6 shadow-sm shadow-white/50", children: [_jsx("h3", { className: "text-base font-semibold text-slate-900", children: item.title }), _jsx("p", { className: "mt-2 text-sm text-slate-500", children: item.caption })] }, item.title))) })] })] })] }));
};
const container = document.getElementById("root");
if (container) {
    createRoot(container).render(_jsx(App, {}));
}
