
import React, { useEffect } from 'react';
import { useSimulation } from '../store/simulationStore.js';

export const SimulationHistory: React.FC = () => {
    const { history, loadHistory } = useSimulation();

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-CL', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (history.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-slate-200">
                <div className="text-4xl mb-4">📂</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No hay simulaciones guardadas</h3>
                <p className="text-slate-500">
                    Tus simulaciones guardadas aparecerán aquí. Ve al inicio para crear una nueva.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {history.map((sim) => (
                <div key={sim.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                                    Crédito de Consumo
                                </span>
                                <h3 className="text-xl font-bold text-slate-900">{formatMoney(sim.amount)}</h3>
                                <p className="text-sm text-slate-500">{formatDate(sim.date)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Cuota Mensual</p>
                                <p className="text-2xl font-bold text-slate-900">{formatMoney(sim.monthlyPayment)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-100">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Plazo</p>
                                <p className="font-semibold text-slate-700">{sim.months} meses</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Total a Pagar</p>
                                <p className="font-semibold text-slate-700">{formatMoney(sim.totalPayment)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Intereses</p>
                                <p className="font-semibold text-slate-700">{formatMoney(sim.totalInterest)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
