import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useSimulation } from '../store/simulationStore.js';
// Formatear moneda chilena
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(value);
};
// Calcular cuota con Sistema Francés (Amortización Francesa)
const calculateMonthlyPayment = (principal, monthlyRate, months) => {
    if (monthlyRate === 0)
        return principal / months;
    const rate = monthlyRate / 100;
    return principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
};
// Hook personalizado para debounce
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};
export const PublicSimulator = ({ onRequestLoan }) => {
    const { loanAmount, loanMonths, setLoanAmount, setLoanMonths, saveSimulation } = useSimulation();
    const monthlyRate = 1.5; // Tasa fija del 1.5% mensual (18% anual)
    // Calcular valores en tiempo real
    const monthlyPayment = calculateMonthlyPayment(loanAmount, monthlyRate, loanMonths);
    const totalPayment = monthlyPayment * loanMonths;
    const totalInterest = totalPayment - loanAmount;
    // Debounce de 500ms para guardar simulación
    const debouncedAmount = useDebounce(loanAmount, 500);
    const debouncedMonths = useDebounce(loanMonths, 500);
    useEffect(() => {
        // Guardar simulación después del debounce
        saveSimulation({
            id: '',
            date: '',
            amount: debouncedAmount,
            months: debouncedMonths,
            monthlyPayment: calculateMonthlyPayment(debouncedAmount, monthlyRate, debouncedMonths),
            totalPayment: calculateMonthlyPayment(debouncedAmount, monthlyRate, debouncedMonths) * debouncedMonths,
            totalInterest: (calculateMonthlyPayment(debouncedAmount, monthlyRate, debouncedMonths) * debouncedMonths) - debouncedAmount
        });
    }, [debouncedAmount, debouncedMonths, saveSimulation]);
    // Calcular progreso del slider para gradiente
    const amountProgress = ((loanAmount - 1000000) / (50000000 - 1000000)) * 100;
    const monthsProgress = ((loanMonths - 6) / (48 - 6)) * 100;
    return (_jsxs("div", { className: "relative isolate overflow-hidden rounded-[2rem] bg-white/75 p-8 shadow-xl shadow-slate-900/10 ring-1 ring-white/60 backdrop-blur", children: [_jsx("div", { className: "absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_rgba(15,23,42,0.08))]" }), _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsxs("div", { className: "mb-3 flex items-end justify-between", children: [_jsx("label", { className: "text-sm font-medium text-slate-600", children: "Monto" }), _jsx("span", { className: "text-3xl font-bold text-slate-900", children: formatCurrency(loanAmount) })] }), _jsx("input", { type: "range", min: "1000000", max: "50000000", step: "500000", value: loanAmount, onChange: (e) => setLoanAmount(Number(e.target.value)), className: "h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 outline-none\r\n              [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none \r\n              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 \r\n              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform\r\n              [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-105", style: {
                                    background: `linear-gradient(to right, #0f172a ${amountProgress}%, #e2e8f0 ${amountProgress}%)`
                                } })] }), _jsxs("div", { children: [_jsxs("div", { className: "mb-3 flex items-end justify-between", children: [_jsx("label", { className: "text-sm font-medium text-slate-600", children: "Plazo" }), _jsxs("span", { className: "text-3xl font-bold text-slate-900", children: [loanMonths, " meses"] })] }), _jsx("input", { type: "range", min: "6", max: "48", step: "6", value: loanMonths, onChange: (e) => setLoanMonths(Number(e.target.value)), className: "h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 outline-none\r\n              [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none \r\n              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 \r\n              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform\r\n              [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-105", style: {
                                    background: `linear-gradient(to right, #0f172a ${monthsProgress}%, #e2e8f0 ${monthsProgress}%)`
                                } })] }), _jsxs("div", { className: "rounded-2xl bg-slate-900 p-6 text-center", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Cuota mensual" }), _jsx("p", { className: "mt-2 text-5xl font-bold text-white", children: formatCurrency(monthlyPayment) }), _jsx("p", { className: "mt-3 text-sm text-slate-400", children: "Tasa 1.5% mensual" })] }), _jsx("button", { onClick: onRequestLoan, className: "w-full rounded-full bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-[0.98]", children: "Solicitar este cr\u00E9dito" })] })] }));
};
