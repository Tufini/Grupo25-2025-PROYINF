import { create } from 'zustand';
export const useSimulation = create((set, get) => ({
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
