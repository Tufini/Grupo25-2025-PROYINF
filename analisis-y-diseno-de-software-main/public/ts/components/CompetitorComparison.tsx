
import React, { useState, useEffect } from 'react';
import { marketDataService, Competitor, CompetitorSimulation } from '../services/MarketDataService.js';
import { useSimulation } from '../store/simulationStore.js';

interface CompetitorComparisonProps {
    amount: number;
    months: number;
    ourRate: number;
    ourPayment: number;
}

type ScenarioType = 'conservative' | 'balanced' | 'risky';

interface SmartScenarios {
    conservative: CompetitorSimulation;
    balanced: CompetitorSimulation;
    risky: CompetitorSimulation;
}

export const CompetitorComparison: React.FC<CompetitorComparisonProps> = ({
    amount,
    months,
    ourRate,
    ourPayment
}) => {
    const { economicContext, saveSimulation } = useSimulation();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availableCompetitors, setAvailableCompetitors] = useState<Competitor[]>([]);
    const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
    const [smartResults, setSmartResults] = useState<SmartScenarios | null>(null);
    const [competitorData, setCompetitorData] = useState<CompetitorSimulation | null>(null);
    const [activeScenario, setActiveScenario] = useState<ScenarioType>('balanced');
    const [error, setError] = useState<string | null>(null);

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
        if (!selectedCompetitorId) return;

        setLoading(true);
        setError(null);
        setSmartResults(null);
        setCompetitorData(null);

        try {
            // 1. Simular al competidor seleccionado (Escenario base)
            const competitorResult = await marketDataService.simulateCompetitor(
                selectedCompetitorId,
                amount,
                months,
                economicContext?.countryCode || 'CL'
            );

            setCompetitorData(competitorResult);

            // 2. Comparar con nuestra oferta actual
            const isCompetitorBetter = competitorResult.monthlyPayment < ourPayment;
            let results: SmartScenarios;
            let explanationPrefix = '';

            if (isCompetitorBetter) {
                // CASO 1: El banco es más barato -> Generamos Contra-Oferta (Beat the Bank)
                results = await marketDataService.generateCounterOffers(
                    competitorResult.monthlyPayment,
                    amount,
                    months
                );
                explanationPrefix = `¡Atención! ${competitorResult.competitor.name} tiene una oferta competitiva. **Pero no te preocupes, hemos generado 3 ofertas exclusivas para superarlos:**`;
            } else {
                // CASO 2: Nosotros somos más baratos -> Mostramos nuestras opciones estándar optimizadas
                results = await marketDataService.generateCounterOffers(
                    ourPayment, // Usamos nuestra cuota base
                    amount,
                    months
                );
                explanationPrefix = `¡Excelente elección! Nuestra oferta estándar ya es mejor que la de ${competitorResult.competitor.name}. Aquí tienes tus 3 opciones optimizadas:`;
            }

            setSmartResults(results);
            setActiveScenario('balanced');
            // Guardamos el mensaje de contexto en el estado (hack simple)
            (results as any).contextMessage = explanationPrefix;

        } catch (error) {
            console.error("Error simulating competitors:", error);
            setError("Error al realizar el análisis inteligente. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

    const getScenarioInfo = (type: ScenarioType) => {
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
        if (!smartResults) return '';
        const current = smartResults[activeScenario];
        const balanced = smartResults.balanced;
        const contextMsg = (smartResults as any).contextMessage || '';

        const diffInterest = current.totalInterest - balanced.totalInterest;
        const diffPayment = current.monthlyPayment - balanced.monthlyPayment;

        let specificMsg = '';
        if (activeScenario === 'conservative') {
            specificMsg = `Has elegido la estrategia de **Ahorro Máximo**. Esta es **la decisión financiera más inteligente** si puedes permitirte una cuota de ${formatMoney(current.monthlyPayment)}. Al reducir el plazo, **te ahorras ${formatMoney(Math.abs(diffInterest))}** en intereses totales.`;
        } else if (activeScenario === 'risky') {
            specificMsg = `Has elegido la estrategia de **Cuota Baja**. Esta decisión prioriza tu **liquidez mensual**, bajando tu carga a ${formatMoney(current.monthlyPayment)}. Ten en cuenta que pagarás **${formatMoney(diffInterest)} extra** en intereses a largo plazo.`;
        } else {
            specificMsg = `Has mantenido la **Selección Equilibrada**. Es un punto medio saludable entre cuota y plazo.`;
        }

        return `${contextMsg} ${specificMsg}`;
    };

    return (
        <div className="mt-8 border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Comparativa Inteligente de Mercado</h3>
                {!isOpen ? (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        🧠 Análisis Inteligente
                    </button>
                ) : (
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-sm text-slate-500 hover:text-slate-700"
                    >
                        Ocultar
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="bg-slate-50 rounded-xl p-6 animate-fadeIn">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            ⚠️ {error}
                        </div>
                    )}

                    {!smartResults ? (
                        <>
                            <p className="text-sm text-slate-600 mb-4">Selecciona <b>una institución</b> para comparar y generar contra-ofertas:</p>
                            <div className="flex flex-wrap gap-3 mb-6">
                                {availableCompetitors.map(comp => (
                                    <button
                                        key={comp.id}
                                        onClick={() => setSelectedCompetitorId(comp.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${selectedCompetitorId === comp.id
                                            ? 'bg-white border-green-500 shadow-md ring-1 ring-green-500'
                                            : 'bg-white border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <span>{comp.logo}</span>
                                        <span className="text-sm font-medium">{comp.name}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={!selectedCompetitorId || loading}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Analizando Mercado...' : '✨ Generar Oferta Ganadora'}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {/* 1. Oferta del Competidor (Referencia) */}
                            {competitorData && (
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Oferta {competitorData.competitor.name}</h4>
                                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Referencia</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{competitorData.competitor.logo}</span>
                                            <div>
                                                <p className="font-bold text-slate-700">{competitorData.competitor.name}</p>
                                                <p className="text-xs text-slate-500">Tasa Mercado</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-slate-600">{formatMoney(competitorData.monthlyPayment)}</p>
                                            <p className="text-xs text-slate-400">Costo Total: {formatMoney(competitorData.totalPayment)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Separador VS */}
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative bg-slate-50 px-4">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                        MEJORAMOS LA OFERTA ▼
                                    </span>
                                </div>
                            </div>

                            {/* 2. Header Aurora */}
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">💎</span>
                                <h4 className="font-bold text-slate-800">Propuesta Aurora Privé (Mejorada)</h4>
                            </div>

                            {/* Tarjetas de Escenarios */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(['conservative', 'balanced', 'risky'] as ScenarioType[]).map((type) => {
                                    const info = getScenarioInfo(type);
                                    const data = smartResults[type];
                                    const estimatedMonths = Math.round(data.totalPayment / data.monthlyPayment);
                                    const isSelected = activeScenario === type;

                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setActiveScenario(type)}
                                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                                ? 'bg-white border-green-500 shadow-lg scale-105 z-10'
                                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    SELECCIONADO
                                                </div>
                                            )}
                                            {!isSelected && type === 'conservative' && (
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                    RECOMENDADO
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">{info.icon}</span>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 text-sm leading-tight">{info.title}</span>
                                                    <span className="text-[10px] text-slate-400">{info.desc}</span>
                                                </div>
                                            </div>
                                            <div className="mb-1">
                                                <span className="text-2xl font-bold text-slate-900">{formatMoney(data.monthlyPayment)}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mb-2">
                                                x {estimatedMonths} cuotas
                                            </div>
                                            <div className="pt-2 border-t border-slate-200">
                                                <p className="text-[10px] text-slate-400">Interés Total</p>
                                                <p className="text-xs font-semibold text-slate-600 mb-2">{formatMoney(data.totalInterest)}</p>

                                                <button
                                                    onClick={(e) => {
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
                                                    }}
                                                    className="w-full py-1.5 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <span>💾</span> Guardar
                                                </button>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explicación Detallada */}
                            <div className={`border rounded-xl p-5 animate-fadeIn transition-colors ${activeScenario === 'conservative' ? 'bg-blue-50 border-blue-100' :
                                activeScenario === 'risky' ? 'bg-orange-50 border-orange-100' :
                                    'bg-slate-50 border-slate-200'
                                }`}>
                                <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    💡 Análisis de tu Decisión
                                </h5>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    {getExplanation().split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i} className="text-slate-900">{part}</strong> : part
                                    )}
                                </p>
                            </div>

                            <button
                                onClick={() => setSmartResults(null)}
                                className="text-xs text-slate-500 underline w-full text-center hover:text-slate-800"
                            >
                                Volver a selección de bancos
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
