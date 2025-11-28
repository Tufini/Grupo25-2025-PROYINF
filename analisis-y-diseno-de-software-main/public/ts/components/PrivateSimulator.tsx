/**
 * Private Simulator - Simulador avanzado para usuarios autenticados
 * Con seguros opcionales, primer vencimiento y tasas preferenciales
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore.js';
import { useSimulation } from '../store/simulationStore.js';
import { useLoanWizard } from '../store/loanWizardStore.js';

// Nuevos componentes
import { SimulationChart } from './SimulationChart.js';
import { EconomicContextPanel } from './EconomicContextPanel.js';
import { ScenarioRecommender } from './ScenarioRecommender.js';
import { CompetitorComparison } from './CompetitorComparison.js';

// ============================================================================
// UTILIDADES
// ============================================================================

const calculateMonthlyPayment = (principal: number, monthlyRate: number, months: number): number => {
  if (monthlyRate === 0) return principal / months;
  const rate = monthlyRate / 100;
  return principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const PrivateSimulator: React.FC = () => {
  const { user } = useAuth();
  const { setLoanAmount, setLoanMonths, saveSimulation } = useSimulation();
  const { setFormData, openWizard, reset: resetWizard } = useLoanWizard();

  // Estado local
  const [monto, setMonto] = useState(5000000);
  const [plazo, setPlazo] = useState(24);
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'risky'>('balanced');
  const [seguroDesgravamen, setSeguroDesgravamen] = useState(false);
  const [seguroCesantia, setSeguroCesantia] = useState(false);
  const [primerVencimiento, setPrimerVencimiento] = useState('');

  // Tasa según perfil de riesgo
  const getTasaMensual = (): number => {
    switch (riskProfile) {
      case 'conservative': return 0.95; // Tasa preferencial
      case 'balanced': return 1.25;     // Tasa estándar
      case 'risky': return 1.65;        // Tasa con prima de riesgo
    }
  };

  const tasaMensual = getTasaMensual();

  // Cálculos
  const cuotaBase = calculateMonthlyPayment(monto, tasaMensual, plazo);
  const costoDesgravamen = seguroDesgravamen ? cuotaBase * 0.02 : 0;
  const costoCesantia = seguroCesantia ? cuotaBase * 0.02 : 0;
  const cuotaFinal = cuotaBase + costoDesgravamen + costoCesantia;
  const totalPagar = cuotaFinal * plazo;
  const totalIntereses = totalPagar - monto;
  const cae = ((totalPagar / monto) * (12 / plazo) * 100).toFixed(1);

  const handleGuardarSimulacion = () => {
    saveSimulation({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: monto,
      months: plazo,
      monthlyPayment: cuotaFinal,
      totalPayment: totalPagar,
      totalInterest: totalIntereses,
    });

    // Feedback visual simple (podría ser un toast mejorado después)
    alert("✅ Simulación guardada en tu historial.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* COLUMNA IZQUIERDA: Controles */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
            Configura tu Crédito
          </h3>

          {/* Selector de Perfil de Riesgo */}
          <div className="mb-8">
            <label className="text-sm font-medium text-slate-700 mb-3 block">Tu Perfil Financiero</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setRiskProfile('conservative')}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${riskProfile === 'conservative'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Conservador
              </button>
              <button
                onClick={() => setRiskProfile('balanced')}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${riskProfile === 'balanced'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Equilibrado
              </button>
              <button
                onClick={() => setRiskProfile('risky')}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${riskProfile === 'risky'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Arriesgado
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              {riskProfile === 'conservative' && "Tasa Preferencial 0.95% - Requisitos estrictos"}
              {riskProfile === 'balanced' && "Tasa Estándar 1.25% - Requisitos normales"}
              {riskProfile === 'risky' && "Tasa Flexible 1.65% - Mínimos requisitos"}
            </p>
          </div>

          {/* Slider Monto */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Monto</label>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(monto)}</span>
            </div>
            <input
              type="range"
              min="1000000"
              max="50000000"
              step="100000"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Slider Plazo */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Plazo</label>
              <span className="text-lg font-bold text-slate-900">{plazo} meses</span>
            </div>
            <input
              type="range"
              min="6"
              max="48"
              step="6"
              value={plazo}
              onChange={(e) => setPlazo(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
          </div>

          {/* Seguros */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSeguroDesgravamen(!seguroDesgravamen)}
              className={`p-3 rounded-xl border text-left transition-all ${seguroDesgravamen ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-slate-900">Desgravamen</span>
                {seguroDesgravamen && <span className="text-blue-600">✓</span>}
              </div>
              <span className="text-xs text-slate-500 block">Cubre fallecimiento</span>
            </button>

            <button
              onClick={() => setSeguroCesantia(!seguroCesantia)}
              className={`p-3 rounded-xl border text-left transition-all ${seguroCesantia ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-slate-900">Cesantía</span>
                {seguroCesantia && <span className="text-green-600">✓</span>}
              </div>
              <span className="text-xs text-slate-500 block">Cubre desempleo</span>
            </button>
          </div>

          <EconomicContextPanel />
        </div>
      </div>

      {/* COLUMNA DERECHA: Visualización y Resultados */}
      <div className="lg:col-span-7 space-y-6">

        {/* Tarjeta Principal de Resultados */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-6 bg-slate-900 text-white">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Cuota Mensual Estimada</p>
                <h2 className="text-5xl font-bold tracking-tight">{formatCurrency(cuotaFinal)}</h2>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Tasa {tasaMensual}%
                </div>
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm border border-white/5">
              <SimulationChart
                amount={monto}
                months={plazo}
                monthlyPayment={cuotaFinal}
                interestRate={tasaMensual}
              />
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-6 text-center mb-8">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Crédito</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(totalPagar)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Intereses</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(totalIntereses)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">CAE</p>
                <p className="text-lg font-bold text-slate-900">{cae}%</p>
              </div>
            </div>

            <button
              onClick={handleGuardarSimulacion}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-slate-900/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>💾</span> Guardar Simulación
            </button>

            <ScenarioRecommender
              amount={monto}
              currentMonths={plazo}
              rate={tasaMensual}
              onSelectScenario={setPlazo}
            />

            <CompetitorComparison
              amount={monto}
              months={plazo}
              ourRate={tasaMensual}
              ourPayment={cuotaFinal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
