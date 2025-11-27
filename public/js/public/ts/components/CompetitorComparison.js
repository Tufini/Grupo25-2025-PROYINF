import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { marketDataService } from '../services/MarketDataService.js';
import { useSimulation } from '../store/simulationStore.js';
export const CompetitorComparison = ({ amount, months, ourRate, ourPayment }) => {
    const { economicContext, saveSimulation } = useSimulation();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availableCompetitors, setAvailableCompetitors] = useState([]);
    const [selectedCompetitorId, setSelectedCompetitorId] = useState(null);
    const [smartResults, setSmartResults] = useState(null);
    const [competitorData, setCompetitorData] = useState(null);
    const [activeScenario, setActiveScenario] = useState('balanced');
    const [error, setError] = useState(null);
    useEffect(() => {
        if (isOpen && availableCompetitors.length === 0 && economicContext) {
            setError(null);
            marketDataService.getAvailableCompetitors(economicContext.countryCode)
                .then(setAvailableCompetitors)
                .catch(err => {
                console.error("Error fetching competitors:", err);
                setError("No se pudieron cargar las instituciones financieras. Verifique la conexión con la CMF.");
            });
        }
    }, [isOpen, economicContext]);
    const handleAnalyze = async () => {
        if (!selectedCompetitorId)
            return;
        setLoading(true);
        setError(null);
        setSmartResults(null);
        setCompetitorData(null);
        try {
            // 1. Simular al competidor seleccionado (Escenario base)
            const competitorResult = await marketDataService.simulateCompetitor(selectedCompetitorId, amount, months, economicContext?.countryCode || 'CL');
            setCompetitorData(competitorResult);
            // 2. Comparar con nuestra oferta actual
            const isCompetitorBetter = competitorResult.monthlyPayment < ourPayment;
            let results;
            let explanationPrefix = '';
            if (isCompetitorBetter) {
                // CASO 1: El banco es más barato -> Generamos Contra-Oferta (Beat the Bank)
                results = await marketDataService.generateCounterOffers(competitorResult.monthlyPayment, amount, months);
                explanationPrefix = `¡Atención! ${competitorResult.competitor.name} tiene una oferta competitiva. **Pero no te preocupes, hemos generado 3 ofertas exclusivas para superarlos:**`;
            }
            else {
                // CASO 2: Nosotros somos más baratos -> Mostramos nuestras opciones estándar optimizadas
                results = await marketDataService.generateCounterOffers(ourPayment, // Usamos nuestra cuota base
                amount, months);
                explanationPrefix = `¡Excelente elección! Nuestra oferta estándar ya es mejor que la de ${competitorResult.competitor.name}. Aquí tienes tus 3 opciones optimizadas:`;
            }
            setSmartResults(results);
            setActiveScenario('balanced');
            // Guardamos el mensaje de contexto en el estado (hack simple)
            results.contextMessage = explanationPrefix;
        }
        catch (error) {
            console.error("Error simulating competitors:", error);
            setError("Error al realizar el análisis inteligente. Intente nuevamente.");
        }
        finally {
            setLoading(false);
        }
    };
    const formatMoney = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    const getScenarioInfo = (type) => {
        switch (type) {
            case 'conservative':
                return {
                    title: 'Ahorro Máximo',
                    icon: '🚀',
                    desc: 'Pagas más rápido, ahorras intereses.',
                    badge: 'Mejor Financieramente'
                };
            case 'balanced':
                return {
                    title: 'Tu Selección',
                    icon: '⚖️',
                    desc: 'Equilibrio entre cuota y plazo.',
                    badge: 'Original'
                };
            case 'risky':
                return {
                    title: 'Cuota Baja',
                    icon: '🛡️',
                    desc: 'Mayor liquidez mensual.',
                    badge: 'Más Cómodo'
                };
        }
    };
    const getExplanation = () => {
        if (!smartResults)
            return '';
        const current = smartResults[activeScenario];
        const balanced = smartResults.balanced;
        const contextMsg = smartResults.contextMessage || '';
        const diffInterest = current.totalInterest - balanced.totalInterest;
        const diffPayment = current.monthlyPayment - balanced.monthlyPayment;
        let specificMsg = '';
        if (activeScenario === 'conservative') {
            specificMsg = `Has elegido la estrategia de **Ahorro Máximo**. Esta es **la decisión financiera más inteligente** si puedes permitirte una cuota de ${formatMoney(current.monthlyPayment)}. Al reducir el plazo, **te ahorras ${formatMoney(Math.abs(diffInterest))}** en intereses totales.`;
        }
        else if (activeScenario === 'risky') {
            specificMsg = `Has elegido la estrategia de **Cuota Baja**. Esta decisión prioriza tu **liquidez mensual**, bajando tu carga a ${formatMoney(current.monthlyPayment)}. Ten en cuenta que pagarás **${formatMoney(diffInterest)} extra** en intereses a largo plazo.`;
        }
        else {
            specificMsg = `Has mantenido la **Selección Equilibrada**. Es un punto medio saludable entre cuota y plazo.`;
        }
        return `${contextMsg} ${specificMsg}`;
    };
    return (_jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-slate-900", children: "Comparativa Inteligente de Mercado" }), !isOpen ? (_jsx("button", { onClick: () => setIsOpen(true), className: "text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1", children: "\uD83E\uDDE0 An\u00E1lisis Inteligente" })) : (_jsx("button", { onClick: () => setIsOpen(false), className: "text-sm text-slate-500 hover:text-slate-700", children: "Ocultar" }))] }), isOpen && (_jsxs("div", { className: "bg-slate-50 rounded-xl p-6 animate-fadeIn", children: [error && (_jsxs("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700", children: ["\u26A0\uFE0F ", error] })), !smartResults ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-sm text-slate-600 mb-4", children: ["Selecciona ", _jsx("b", { children: "una instituci\u00F3n" }), " para comparar y generar contra-ofertas:"] }), _jsx("div", { className: "flex flex-wrap gap-3 mb-6", children: availableCompetitors.map(comp => (_jsxs("button", { onClick: () => setSelectedCompetitorId(comp.id), className: `flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${selectedCompetitorId === comp.id
                                        ? 'bg-white border-green-500 shadow-md ring-1 ring-green-500'
                                        : 'bg-white border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'}`, children: [_jsx("span", { children: comp.logo }), _jsx("span", { className: "text-sm font-medium", children: comp.name })] }, comp.id))) }), _jsx("button", { onClick: handleAnalyze, disabled: !selectedCompetitorId || loading, className: "w-full py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: loading ? 'Analizando Mercado...' : '✨ Generar Oferta Ganadora' })] })) : (_jsxs("div", { className: "space-y-6", children: [competitorData && (_jsxs("div", { className: "bg-slate-100 p-4 rounded-xl border border-slate-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("h4", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: ["Oferta ", competitorData.competitor.name] }), _jsx("span", { className: "text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded", children: "Referencia" })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-3xl", children: competitorData.competitor.logo }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-slate-700", children: competitorData.competitor.name }), _jsx("p", { className: "text-xs text-slate-500", children: "Tasa Mercado" })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xl font-bold text-slate-600", children: formatMoney(competitorData.monthlyPayment) }), _jsxs("p", { className: "text-xs text-slate-400", children: ["Costo Total: ", formatMoney(competitorData.totalPayment)] })] })] })] })), _jsxs("div", { className: "relative flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-slate-200" }) }), _jsx("div", { className: "relative bg-slate-50 px-4", children: _jsx("span", { className: "text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100", children: "MEJORAMOS LA OFERTA \u25BC" }) })] }), _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDC8E" }), _jsx("h4", { className: "font-bold text-slate-800", children: "Propuesta Aurora Priv\u00E9 (Mejorada)" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: ['conservative', 'balanced', 'risky'].map((type) => {
                                    const info = getScenarioInfo(type);
                                    const data = smartResults[type];
                                    const estimatedMonths = Math.round(data.totalPayment / data.monthlyPayment);
                                    const isSelected = activeScenario === type;
                                    return (_jsxs("button", { onClick: () => setActiveScenario(type), className: `relative p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                            ? 'bg-white border-green-500 shadow-lg scale-105 z-10'
                                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`, children: [isSelected && (_jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", children: "SELECCIONADO" })), !isSelected && type === 'conservative' && (_jsx("div", { className: "absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full", children: "RECOMENDADO" })), _jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-xl", children: info.icon }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-bold text-slate-700 text-sm leading-tight", children: info.title }), _jsx("span", { className: "text-[10px] text-slate-400", children: info.desc })] })] }), _jsx("div", { className: "mb-1", children: _jsx("span", { className: "text-2xl font-bold text-slate-900", children: formatMoney(data.monthlyPayment) }) }), _jsxs("div", { className: "text-xs text-slate-500 mb-2", children: ["x ", estimatedMonths, " cuotas"] }), _jsxs("div", { className: "pt-2 border-t border-slate-200", children: [_jsx("p", { className: "text-[10px] text-slate-400", children: "Inter\u00E9s Total" }), _jsx("p", { className: "text-xs font-semibold text-slate-600 mb-2", children: formatMoney(data.totalInterest) }), _jsxs("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            saveSimulation({
                                                                id: crypto.randomUUID(),
                                                                date: new Date().toISOString(),
                                                                amount: amount,
                                                                months: estimatedMonths,
                                                                monthlyPayment: data.monthlyPayment,
                                                                totalPayment: data.totalPayment,
                                                                totalInterest: data.totalInterest
                                                            });
                                                            alert("✅ Simulación guardada en tu historial");
                                                        }, className: "w-full py-1.5 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-700 transition-colors flex items-center justify-center gap-1", children: [_jsx("span", { children: "\uD83D\uDCBE" }), " Guardar"] })] })] }, type));
                                }) }), _jsxs("div", { className: `border rounded-xl p-5 animate-fadeIn transition-colors ${activeScenario === 'conservative' ? 'bg-blue-50 border-blue-100' :
                                    activeScenario === 'risky' ? 'bg-orange-50 border-orange-100' :
                                        'bg-slate-50 border-slate-200'}`, children: [_jsx("h5", { className: "font-bold text-slate-800 mb-2 flex items-center gap-2", children: "\uD83D\uDCA1 An\u00E1lisis de tu Decisi\u00F3n" }), _jsx("p", { className: "text-sm text-slate-700 leading-relaxed", children: getExplanation().split('**').map((part, i) => i % 2 === 1 ? _jsx("strong", { className: "text-slate-900", children: part }, i) : part) })] }), _jsx("button", { onClick: () => setSmartResults(null), className: "text-xs text-slate-500 underline w-full text-center hover:text-slate-800", children: "Volver a selecci\u00F3n de bancos" })] }))] }))] }));
};
