// Store simple usando React hooks para el estado global
export type AppStore = {
  // Datos del simulador
  loanAmount: number;
  loanMonths: number;
  
  // Estado de autenticación
  isAuthenticated: boolean;
  userName: string | null;
  
  // Acciones
  setLoanAmount: (amount: number) => void;
  setLoanMonths: (months: number) => void;
  login: (name: string) => void;
  logout: () => void;
};

// Hook personalizado para usar el store
export const createStore = () => {
  const store: AppStore = {
    loanAmount: 5000000,
    loanMonths: 24,
    isAuthenticated: false,
    userName: null,
    
    setLoanAmount: (amount: number) => {
      store.loanAmount = amount;
    },
    
    setLoanMonths: (months: number) => {
      store.loanMonths = months;
    },
    
    login: (name: string) => {
      store.isAuthenticated = true;
      store.userName = name;
    },
    
    logout: () => {
      store.isAuthenticated = false;
      store.userName = null;
    }
  };
  
  return store;
};
