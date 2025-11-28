import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../store/authStore.js';
// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export const DashboardLayout = ({ children, currentView = 'inicio', onNavigate, user }) => {
    const { logout } = useAuth();
    if (!user) {
        return null;
    }
    const handleNavigation = (view) => {
        if (onNavigate) {
            onNavigate(view);
        }
    };
    // Obtener iniciales del usuario
    const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
    // Tipo de cliente con color
    const getClientBadgeColor = () => {
        switch (user.cliente?.tipo) {
            case 'VIP':
                return 'bg-gradient-to-r from-amber-400 to-yellow-500';
            case 'PREMIUM':
                return 'bg-gradient-to-r from-purple-500 to-pink-500';
            default:
                return 'bg-gradient-to-r from-blue-500 to-indigo-600';
        }
    };
    return (_jsxs("div", { className: "flex min-h-screen bg-slate-50", children: [_jsxs("aside", { className: "w-72 bg-gradient-to-b from-slate-800 to-slate-900 text-white fixed h-full shadow-2xl", children: [_jsx("div", { className: "p-6 border-b border-slate-700", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg", children: _jsx("span", { className: "text-xl font-bold", children: "AP" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold", children: "Aurora Priv\u00E9" }), _jsx("p", { className: "text-xs text-slate-400", children: "Banking Excellence" })] })] }) }), _jsx("div", { className: "p-6 border-b border-slate-700", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold border-2 border-slate-600 shadow-lg", children: initials }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("h3", { className: "font-semibold text-white truncate", children: [user.nombre, " ", user.apellido] }), _jsx("p", { className: "text-xs text-slate-400 truncate", children: user.email }), _jsx("div", { className: "mt-2", children: _jsxs("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getClientBadgeColor()} text-white shadow-sm`, children: [_jsx("svg", { className: "w-3 h-3 mr-1", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), user.cliente?.tipo || 'REGULAR'] }) })] })] }) }), _jsxs("nav", { className: "p-4 space-y-2", children: [_jsxs("button", { onClick: () => handleNavigation('inicio'), className: `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === 'inicio'
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`, children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }) }), _jsx("span", { className: "font-medium", children: "Inicio" })] }), _jsxs("button", { onClick: () => handleNavigation('solicitudes'), className: `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === 'solicitudes'
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`, children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }), _jsx("span", { className: "font-medium", children: "Mis Solicitudes" })] }), _jsxs("button", { onClick: () => handleNavigation('historial'), className: `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === 'historial'
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`, children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { className: "font-medium", children: "Historial" })] }), _jsxs("button", { onClick: () => handleNavigation('perfil'), className: `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === 'perfil'
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`, children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }), _jsx("span", { className: "font-medium", children: "Mi Perfil" })] })] }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700", children: _jsxs("button", { onClick: () => {
                                logout();
                                window.location.href = '/';
                            }, className: "w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), _jsx("span", { className: "font-medium", children: "Cerrar Sesi\u00F3n" })] }) })] }), _jsx("main", { className: "ml-72 flex-1 p-8", children: children })] }));
};
