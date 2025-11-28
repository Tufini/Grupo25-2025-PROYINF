import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Dashboard Home - Vista principal con widgets profesionales
 * Inspirado en Upstart, SoFi y Marcus by Goldman Sachs
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore.js';
import { PrivateSimulator } from './PrivateSimulator.js';
// ============================================================================
// UTILIDADES
// ============================================================================
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
};
const ScoreGauge = ({ score, maxScore = 1000 }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    // Animación del score
    useEffect(() => {
        const duration = 1000; // 1 segundo
        const steps = 60;
        const increment = score / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setAnimatedScore(score);
                clearInterval(timer);
            }
            else {
                setAnimatedScore(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [score]);
    // Calcular porcentaje y color
    const percentage = (score / maxScore) * 100;
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const getColor = () => {
        if (percentage >= 80)
            return '#10b981'; // Verde
        if (percentage >= 60)
            return '#3b82f6'; // Azul
        if (percentage >= 40)
            return '#f59e0b'; // Amarillo
        return '#ef4444'; // Rojo
    };
    const getLabel = () => {
        if (percentage >= 80)
            return 'Excelente';
        if (percentage >= 60)
            return 'Muy Bueno';
        if (percentage >= 40)
            return 'Bueno';
        return 'Regular';
    };
    return (_jsxs("div", { className: "bg-white rounded-2xl shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900 mb-4", children: "Tu Puntuaci\u00F3n Crediticia" }), _jsxs("div", { className: "relative w-40 h-40 mx-auto mb-4", children: [_jsxs("svg", { className: "transform -rotate-90 w-40 h-40", children: [_jsx("circle", { cx: "80", cy: "80", r: radius, stroke: "#e5e7eb", strokeWidth: "12", fill: "none" }), _jsx("circle", { cx: "80", cy: "80", r: radius, stroke: getColor(), strokeWidth: "12", fill: "none", strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: "round", style: {
                                    transition: 'stroke-dashoffset 1s ease-in-out',
                                } })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("span", { className: "text-4xl font-bold text-gray-900", children: animatedScore }), _jsxs("span", { className: "text-sm text-gray-500", children: ["de ", maxScore] }), _jsx("span", { className: "text-xs font-medium mt-1", style: { color: getColor() }, children: getLabel() })] })] }), _jsxs("div", { className: "space-y-3 mb-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Historial de pagos" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-24 h-2 bg-gray-200 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-green-500 rounded-full", style: { width: '95%' } }) }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: "95%" })] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Utilizaci\u00F3n de cr\u00E9dito" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-24 h-2 bg-gray-200 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-500 rounded-full", style: { width: '32%' } }) }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: "32%" })] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Antig\u00FCedad crediticia" }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: "5 a\u00F1os" })] })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("svg", { className: "w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-blue-900", children: "Consejo para mejorar" }), _jsx("p", { className: "text-xs text-blue-700 mt-1", children: "Mant\u00E9n tu utilizaci\u00F3n de cr\u00E9dito bajo el 30% para aumentar tu score." })] })] }) })] }));
};
const CupoPreAprobado = ({ ingresos }) => {
    // Calcular cupo: máximo 3x ingresos o $10M
    const cupo = Math.min(ingresos * 3, 10000000);
    return (_jsxs("div", { className: "relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl p-8 text-white overflow-hidden group", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-4", children: [_jsx("svg", { className: "w-6 h-6 text-emerald-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" }) }), _jsx("h3", { className: "text-lg font-bold", children: "Cupo Pre-Aprobado" })] }), _jsx("p", { className: "text-4xl font-bold mb-2", children: formatCurrency(cupo) }), _jsx("div", { className: "flex items-center space-x-2 mb-6", children: _jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-300", children: [_jsx("svg", { className: "w-4 h-4 mr-1", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), "Aprobaci\u00F3n instant\u00E1nea"] }) }), _jsxs("div", { className: "bg-white bg-opacity-10 rounded-lg p-4", children: [_jsxs("p", { className: "text-sm opacity-90", children: ["\uD83D\uDCCA Basado en tus ingresos de ", formatCurrency(ingresos), "/mes"] }), _jsx("p", { className: "text-xs opacity-75 mt-2", children: "Puedes solicitar hasta este monto con aprobaci\u00F3n inmediata" })] })] })] }));
};
// ============================================================================
// COMPONENTE PRINCIPAL: DASHBOARD HOME
// ============================================================================
export const DashboardHome = () => {
    const { user } = useAuth();
    if (!user) {
        return null;
    }
    const score = user.cliente?.scoreCredito || 950;
    const ingresos = user.cliente?.ingresosMensuales || 0;
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-8", children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: ["Bienvenido, ", user.nombre, " \uD83D\uDC4B"] }), _jsx("p", { className: "text-gray-600", children: "Gestiona tus cr\u00E9ditos y simula nuevas opciones de financiamiento" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsx(ScoreGauge, { score: score }), _jsx(CupoPreAprobado, { ingresos: ingresos })] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Simula tu Cr\u00E9dito" }), _jsx(PrivateSimulator, {})] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900 mb-3", children: "\u00BFNecesitas ayuda?" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Nuestro equipo est\u00E1 disponible para asesorarte" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { className: "w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all", children: [_jsx("svg", { className: "w-5 h-5 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" }) }), _jsx("span", { className: "font-medium text-gray-700", children: "Llamar ahora" })] }), _jsxs("button", { className: "w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) }), _jsx("span", { className: "font-medium", children: "Chat en vivo" })] })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900 mb-3", children: "Recursos \u00DAtiles" }), _jsxs("ul", { className: "space-y-3", children: [_jsx("li", { children: _jsxs("a", { href: "#", className: "flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }), _jsx("span", { children: "Documentaci\u00F3n requerida" })] }) }), _jsx("li", { children: _jsxs("a", { href: "#", className: "flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }) }), _jsx("span", { children: "Gu\u00EDa de cr\u00E9ditos" })] }) }), _jsx("li", { children: _jsxs("a", { href: "#", className: "flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: "Preguntas frecuentes" })] }) })] })] })] })] }));
};
