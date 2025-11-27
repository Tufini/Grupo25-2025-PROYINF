import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { marketDataService } from '../services/MarketDataService.js';
import { useSimulation } from '../store/simulationStore.js';
export const EconomicContextPanel = () => {
    const { economicContext, setEconomicContext } = useSimulation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const loadData = async () => {
            try {
                setError(null);
                // 1. Obtener ubicación (simulada por ahora)
                const location = await marketDataService.getUserLocation();
                // 2. Obtener datos económicos
                const data = await marketDataService.getEconomicIndicators(location.countryCode);
                setEconomicContext(data);
            }
            catch (error) {
                console.error("Error loading economic context:", error);
                setError("No se pudieron cargar los datos económicos reales. Verifique su conexión o las llaves de API.");
            }
            finally {
                setLoading(false);
            }
        };
        if (!economicContext) {
            loadData();
        }
        else {
            setLoading(false);
        }
    }, []);
    if (loading)
        return _jsx("div", { className: "animate-pulse h-20 bg-slate-100 rounded-xl" });
    if (error) {
        return (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm", children: [_jsx("p", { className: "text-xs font-bold text-red-600 uppercase tracking-wider", children: "Error de Conexi\u00F3n" }), _jsx("p", { className: "text-sm text-red-800 mt-1", children: error })] }));
    }
    if (!economicContext)
        return null;
    return (_jsxs("div", { className: "bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", role: "img", "aria-label": `Bandera de ${economicContext.country}`, children: economicContext.flag }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Contexto Econ\u00F3mico" }), _jsx("p", { className: "text-sm font-bold text-slate-900", children: economicContext.country })] })] }), _jsx("div", { className: `px-2 py-1 rounded-full text-xs font-bold ${economicContext.trend === 'DOWN' ? 'bg-green-100 text-green-700' :
                            economicContext.trend === 'UP' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`, children: economicContext.trend === 'DOWN' ? '▼ Tasas Bajando' :
                            economicContext.trend === 'UP' ? '▲ Tasas Subiendo' : '● Estable' })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500", children: "Inflaci\u00F3n Anual" }), _jsxs("p", { className: "text-lg font-bold text-slate-800", children: [economicContext.inflationRate, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500", children: "Tasa Central" }), _jsxs("p", { className: "text-lg font-bold text-slate-800", children: [economicContext.centralBankRate, "%"] })] })] }), _jsxs("div", { className: "bg-slate-50 rounded-lg p-2 text-xs text-slate-600 italic border-l-2 border-blue-400", children: ["\"", economicContext.advice, "\""] })] }));
};
