
import React, { useEffect, useState } from 'react';
import { marketDataService, EconomicIndicators } from '../services/MarketDataService.js';
import { useSimulation } from '../store/simulationStore.js';

export const EconomicContextPanel: React.FC = () => {
    const { economicContext, setEconomicContext } = useSimulation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setError(null);
                // 1. Obtener ubicación (simulada por ahora)
                const location = await marketDataService.getUserLocation();

                // 2. Obtener datos económicos
                const data = await marketDataService.getEconomicIndicators(location.countryCode);

                setEconomicContext(data);
            } catch (error) {
                console.error("Error loading economic context:", error);
                setError("No se pudieron cargar los datos económicos reales. Verifique su conexión o las llaves de API.");
            } finally {
                setLoading(false);
            }
        };

        if (!economicContext) {
            loadData();
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) return <div className="animate-pulse h-20 bg-slate-100 rounded-xl"></div>;

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Error de Conexión</p>
                <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
        );
    }

    if (!economicContext) return null;

    return (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl" role="img" aria-label={`Bandera de ${economicContext.country}`}>
                        {economicContext.flag}
                    </span>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contexto Económico</p>
                        <p className="text-sm font-bold text-slate-900">{economicContext.country}</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${economicContext.trend === 'DOWN' ? 'bg-green-100 text-green-700' :
                    economicContext.trend === 'UP' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {economicContext.trend === 'DOWN' ? '▼ Tasas Bajando' :
                        economicContext.trend === 'UP' ? '▲ Tasas Subiendo' : '● Estable'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <p className="text-xs text-slate-500">Inflación Anual</p>
                    <p className="text-lg font-bold text-slate-800">{economicContext.inflationRate}%</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Tasa Central</p>
                    <p className="text-lg font-bold text-slate-800">{economicContext.centralBankRate}%</p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600 italic border-l-2 border-blue-400">
                "{economicContext.advice}"
            </div>
        </div>
    );
};
