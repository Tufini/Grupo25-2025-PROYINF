
import React from 'react';

interface ScenarioRecommenderProps {
    amount: number;
    currentMonths: number;
    rate: number;
    onSelectScenario: (months: number) => void;
}

export const ScenarioRecommender: React.FC<ScenarioRecommenderProps> = ({
    amount,
    currentMonths,
    rate,
    onSelectScenario
}) => {

    const calculatePayment = (months: number) => {
        const r = rate / 100;
        return amount * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

    // Escenarios Predefinidos (Presets)
    const scenarios = [
        {
            id: 'fast',
            title: 'Corto Plazo',
            months: 12,
            icon: '🚀',
            description: 'Ahorro máximo de intereses.'
        },
        {
            id: 'medium',
            title: 'Plazo Medio',
            months: 24,
            icon: '⚖️',
            description: 'Balance ideal cuota/plazo.'
        },
        {
            id: 'extended',
            title: 'Largo Plazo',
            months: 48,
            icon: '🛡️',
            description: 'Cuota mensual más baja.'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {scenarios.map((scenario) => {
                const payment = calculatePayment(scenario.months);
                const total = payment * scenario.months;
                const interest = total - amount;
                const isSelected = scenario.months === currentMonths;

                return (
                    <div
                        key={scenario.id}
                        onClick={() => onSelectScenario(scenario.months)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                            ? 'bg-white border-green-500 shadow-lg scale-105 z-10'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                    >
                        {isSelected && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white bg-green-500">
                                Seleccionado
                            </div>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{scenario.icon}</span>
                            <h4 className="font-bold text-slate-900 text-sm">{scenario.title}</h4>
                        </div>

                        <p className="text-2xl font-bold text-slate-800 mb-1">{formatMoney(payment)}</p>
                        <p className="text-xs text-slate-500 mb-3">x {scenario.months} meses</p>

                        <div className="space-y-1 pt-3 border-t border-slate-100">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Interés total:</span>
                                <span className="font-medium text-slate-700">{formatMoney(interest)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
