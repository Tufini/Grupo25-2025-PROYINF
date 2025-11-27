// Hook personalizado para usar el store
export const createStore = () => {
    const store = {
        loanAmount: 5000000,
        loanMonths: 24,
        isAuthenticated: false,
        userName: null,
        setLoanAmount: (amount) => {
            store.loanAmount = amount;
        },
        setLoanMonths: (months) => {
            store.loanMonths = months;
        },
        login: (name) => {
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
