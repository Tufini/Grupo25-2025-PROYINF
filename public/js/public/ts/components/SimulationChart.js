import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
export const SimulationChart = ({ amount, months, monthlyPayment, interestRate }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    useEffect(() => {
        if (!chartRef.current)
            return;
        // Destruir gráfico anterior si existe
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        // Datos para gráfico de barras comparativo
        const totalPayment = monthlyPayment * months;
        const totalInterest = totalPayment - amount;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx)
            return;
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Análisis de Costo'],
                datasets: [
                    {
                        label: 'Monto Solicitado',
                        data: [amount],
                        backgroundColor: '#3b82f6',
                        borderRadius: 8,
                        barPercentage: 0.6,
                    },
                    {
                        label: 'Total a Pagar',
                        data: [totalPayment],
                        backgroundColor: '#ef4444',
                        borderRadius: 8,
                        barPercentage: 0.6,
                    }
                ]
            },
            options: {
                indexAxis: 'y', // Gráfico horizontal para mejor lectura
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: 'Manrope' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label)
                                    label += ': ';
                                if (context.parsed.x !== null) {
                                    label += new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(context.parsed.x);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Manrope' },
                            callback: (value) => new Intl.NumberFormat('es-CL', { notation: "compact" }).format(Number(value))
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { display: false } // Ocultar etiqueta del eje Y
                    }
                }
            }
        });
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [amount, months, monthlyPayment, interestRate]);
    return (_jsx("div", { className: "w-full h-64", children: _jsx("canvas", { ref: chartRef }) }));
};
