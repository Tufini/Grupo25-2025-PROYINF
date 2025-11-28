import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useSimulation } from '../store/simulationStore.js';
export const SimulationHistory = () => {
    const { history, loadHistory } = useSimulation();
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);
    const formatMoney = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('es-CL', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    if (history.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-xl shadow-sm p-8 text-center border border-slate-200", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDCC2" }), _jsx("h3", { className: "text-lg font-bold text-slate-800 mb-2", children: "No hay simulaciones guardadas" }), _jsx("p", { className: "text-slate-500", children: "Tus simulaciones guardadas aparecer\u00E1n aqu\u00ED. Ve al inicio para crear una nueva." })] }));
    }
    return (_jsx("div", { className: "space-y-6", children: history.map((sim) => (_jsx("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("span", { className: "inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2", children: "Cr\u00E9dito de Consumo" }), _jsx("h3", { className: "text-xl font-bold text-slate-900", children: formatMoney(sim.amount) }), _jsx("p", { className: "text-sm text-slate-500", children: formatDate(sim.date) })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-slate-500", children: "Cuota Mensual" }), _jsx("p", { className: "text-2xl font-bold text-slate-900", children: formatMoney(sim.monthlyPayment) })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 py-4 border-t border-slate-100", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wider", children: "Plazo" }), _jsxs("p", { className: "font-semibold text-slate-700", children: [sim.months, " meses"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wider", children: "Total a Pagar" }), _jsx("p", { className: "font-semibold text-slate-700", children: formatMoney(sim.totalPayment) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wider", children: "Intereses" }), _jsx("p", { className: "font-semibold text-slate-700", children: formatMoney(sim.totalInterest) })] })] })] }) }, sim.id))) }));
};
