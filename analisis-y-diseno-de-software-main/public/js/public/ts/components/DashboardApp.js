import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { DashboardLayout } from './DashboardLayout.js';
import { useAuth } from '../store/authStore.js';
import { SimulationHistory } from './SimulationHistory.js';
export const DashboardApp = () => {
    const { user, isLoading, checkAuth } = useAuth();
    const [currentView, setCurrentView] = useState('inicio');
    console.log('DashboardApp render - user:', user, 'isLoading:', isLoading);
    // Verificar autenticación al cargar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
        checkAuth();
    }, [checkAuth]);
    // Redirigir a login si no está autenticado
    useEffect(() => {
        if (!isLoading && !user) {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/index.html';
            }
        }
    }, [user, isLoading]);
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Cargando..." })] }) }));
    }
    if (!user) {
        console.log('DashboardApp render - no user, returning null');
        return null;
    }
    // Renderizar contenido según vista activa
    const renderContent = () => {
        const score = user.cliente?.scoreCredito || 950;
        const ingresos = user.cliente?.ingresosMensuales || 0;
        switch (currentView) {
            case 'inicio':
                return (_jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: ["Bienvenido, ", user.nombre, " \uD83D\uDC4B"] }), _jsx("p", { className: "text-gray-600", children: "Gestiona tus cr\u00E9ditos y simula nuevas opciones de financiamiento" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-2xl p-6 shadow", children: [_jsx("h3", { className: "text-lg font-bold mb-4", children: "Score Crediticio" }), _jsx("p", { className: "text-5xl font-bold text-blue-600", children: score })] }), _jsxs("div", { className: "bg-white rounded-2xl p-6 shadow", children: [_jsx("h3", { className: "text-lg font-bold mb-4", children: "Ingresos Mensuales" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: ingresos > 0 ? `$${ingresos.toLocaleString('es-CL')}` : 'No registrado' })] })] })] }));
            case 'solicitudes':
                return (_jsxs("div", { className: "p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Mis Solicitudes" }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsx("p", { className: "text-gray-600", children: "Aqu\u00ED ver\u00E1s el historial de tus solicitudes de cr\u00E9dito." }) })] }));
            case 'historial':
                return (_jsxs("div", { className: "p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Historial de Simulaciones" }), _jsx(SimulationHistory, {})] }));
            case 'perfil':
                return (_jsxs("div", { className: "p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Mi Perfil" }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsx("p", { className: "text-gray-600", children: "Gestiona tu informaci\u00F3n personal." }) })] }));
            default:
                return (_jsx("div", { className: "p-8", children: _jsx("h1", { children: "Dashboard" }) }));
        }
    };
    return (_jsx(DashboardLayout, { currentView: currentView, onNavigate: setCurrentView, user: user, children: renderContent() }));
};
