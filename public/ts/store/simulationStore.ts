import { create } from 'zustand';
import { CompetitorSimulation, EconomicIndicators } from '../services/MarketDataService.js';

export interface SimulationState {
  // Datos del simulador
  loanAmount: number;
  loanMonths: number;
  lastSimulation: {
    amount: number;
    months: number;
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
  } | null;

  history: SimulationResult[];
  competitorResults: CompetitorSimulation[];
  economicContext: EconomicIndicators | null;

  // Acciones
  setLoanAmount: (amount: number) => void;
  setLoanMonths: (months: number) => void;
  saveSimulation: (simulation: SimulationResult) => void;
  addCompetitorResult: (result: CompetitorSimulation) => void;
  clearCompetitorResults: () => void;
  setEconomicContext: (context: EconomicIndicators) => void;
  loadHistory: () => void;
  resetSimulation: () => void;
}

export interface SimulationResult {
  id: string;
  date: string;
  amount: number;
  months: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}



export const useSimulation = create<SimulationState>((set, get) => ({
  loanAmount: 5000000,
  loanMonths: 24,
  lastSimulation: null,
  history: [],
  competitorResults: [],
  economicContext: null,

  setLoanAmount: (amount) => set({ loanAmount: amount }),

  setLoanMonths: (months) => set({ loanMonths: months }),

  saveSimulation: (simulation) => {
    const newSimulation = { ...simulation, id: crypto.randomUUID(), date: new Date().toISOString() };
    const currentHistory = get().history;
    const newHistory = [newSimulation, ...currentHistory].slice(0, 10); // Guardar últimos 10

    // Persistir en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('simulation_history', JSON.stringify(newHistory));
    }

    set({
      lastSimulation: newSimulation,
      history: newHistory
    });
  },

  addCompetitorResult: (result) => set((state) => ({
    competitorResults: [...state.competitorResults, result]
  })),

  clearCompetitorResults: () => set({ competitorResults: [] }),

  setEconomicContext: (context) => set({ economicContext: context }),

  loadHistory: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('simulation_history');
      if (saved) {
        set({ history: JSON.parse(saved) });
      }
    }
  },

  resetSimulation: () => set({
    loanAmount: 5000000,
    loanMonths: 24,
    lastSimulation: null,
    competitorResults: [],
  }),
}));
