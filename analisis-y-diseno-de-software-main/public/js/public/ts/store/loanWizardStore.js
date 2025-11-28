/**
 * Loan Wizard Store - Manejo del estado del wizard de solicitud
 */
import { create } from 'zustand';
// ============================================================================
// STORE
// ============================================================================
export const useLoanWizard = create((set) => ({
    // Estado inicial
    monto: 5000000,
    plazo: 24,
    tasa: 1.1,
    tipo_credito: 'CONSUMO',
    seguroDesgravamen: false,
    seguroCesantia: false,
    primerVencimiento: null,
    currentStep: 1,
    isOpen: false,
    /**
     * Actualizar datos del formulario
     */
    setFormData: (data) => set((state) => ({
        ...state,
        ...data,
    })),
    /**
     * Toggle seguro de desgravamen
     */
    setSeguroDesgravamen: (value) => set({ seguroDesgravamen: value }),
    /**
     * Toggle seguro de cesantía
     */
    setSeguroCesantia: (value) => set({ seguroCesantia: value }),
    /**
     * Establecer fecha de primer vencimiento
     */
    setPrimerVencimiento: (date) => set({ primerVencimiento: date }),
    /**
     * Cambiar paso del wizard
     */
    setCurrentStep: (step) => set({ currentStep: step }),
    /**
     * Abrir wizard
     */
    openWizard: () => set({ isOpen: true, currentStep: 1 }),
    /**
     * Cerrar wizard
     */
    closeWizard: () => set({ isOpen: false }),
    /**
     * Resetear wizard a valores iniciales
     */
    reset: () => set({
        monto: 5000000,
        plazo: 24,
        tasa: 1.1,
        tipo_credito: 'CONSUMO',
        seguroDesgravamen: false,
        seguroCesantia: false,
        primerVencimiento: null,
        currentStep: 1,
        isOpen: false,
    }),
}));
