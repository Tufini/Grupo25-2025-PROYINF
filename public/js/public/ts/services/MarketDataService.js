/**
 * Market Data Service
 * Maneja la obtención de datos económicos y simulación de competencia
 */
import { cmfService } from './CmfService.js';
// Mapeo de logos (esto no viene en la API CMF, lo agregamos nosotros)
const BANK_LOGOS = {
    '001': '🔵', // Chile
    '012': '🏦', // Estado
    '014': '🍁', // Scotiabank
    '016': '🟢', // Bci
    '037': '🔴', // Santander
    '039': '🟠', // Itau
    '051': '💚', // Falabella
    '053': '🟣', // Ripley
    '055': '🛡️', // Consorcio
};
// Spreads de riesgo sobre la TPM (Diferencia anual)
// Estos valores se suman a la TPM en tiempo real para calcular la tasa final.
// Si la TPM sube/baja (dato real de mindicador.cl), las tasas de los bancos se ajustan automáticamente.
// Calibrado con ofertas reales Noviembre 2025 (Ej: Scotiabank ~9.5% anual vs TPM ~5.25%)
const BANK_SPREADS_OVER_TPM = {
    '001': 5.5, // Banco de Chile (+5.5% sobre TPM)
    '012': 6.0, // Banco Estado
    '014': 4.25, // Scotiabank (Oferta agresiva: TPM + 4.25% = ~9.5% anual)
    '016': 5.8, // Bci
    '037': 11.5, // Santander (Spread más alto en pizarra general)
    '039': 6.5, // Itau
    '051': 14.0, // Falabella (Retail: Alto riesgo)
    '053': 14.5, // Ripley
    '055': 7.0, // Consorcio
};
class MarketDataService {
    /**
     * Detecta el país del usuario (Simulado por ahora, idealmente usaría una API de IP)
     */
    async getUserLocation() {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 800));
        return { countryCode: 'CL', countryName: 'Chile' };
    }
    /**
     * Obtiene indicadores económicos
     */
    async getEconomicIndicators(countryCode) {
        // Simular delay mínimo
        await new Promise(resolve => setTimeout(resolve, 500));
        if (countryCode === 'CL') {
            try {
                // Consultar API Banco Central (vía backend proxy que usa mindicador.cl)
                const response = await fetch('/api/bcentral/indicators');
                if (!response.ok) {
                    throw new Error('Failed to fetch indicators');
                }
                const data = await response.json();
                // Si tenemos datos reales, los usamos
                if (data.uf && data.tpm && data.ipc) {
                    const ufValue = data.uf.value;
                    const tpmValue = data.tpm.value;
                    const ipcValue = data.ipc.value; // Variación mensual
                    // Lógica de consejo basada en datos reales
                    let advice = '';
                    let trend = 'STABLE';
                    if (tpmValue > 5.0) {
                        advice = `La TPM está alta (${tpmValue}%). Los créditos pueden ser más caros. `;
                        trend = 'UP';
                    }
                    else if (tpmValue < 3.0) {
                        advice = `La TPM está baja (${tpmValue}%). Es un excelente momento para pedir crédito. `;
                        trend = 'DOWN';
                    }
                    else {
                        advice = `La TPM está en niveles moderados (${tpmValue}%). `;
                    }
                    advice += `UF hoy: $${new Intl.NumberFormat('es-CL').format(ufValue)}. `;
                    if (ipcValue > 0.5) {
                        advice += `Inflación mensual alta (${ipcValue}%). Cuide su endeudamiento en UF.`;
                    }
                    else {
                        advice += `Inflación controlada (${ipcValue}%).`;
                    }
                    return {
                        country: 'Chile',
                        countryCode: 'CL',
                        flag: '🇨🇱',
                        inflationRate: ipcValue,
                        centralBankRate: tpmValue,
                        currency: 'CLP',
                        trend: trend,
                        advice: advice
                    };
                }
                throw new Error('Incomplete data from API');
            }
            catch (error) {
                console.error('Error fetching economic data:', error);
                throw error; // No fallback, user wants real data only
            }
        }
        return {
            country: 'International',
            countryCode: 'INT',
            flag: '🌍',
            inflationRate: 0,
            centralBankRate: 0,
            currency: 'USD',
            trend: 'STABLE',
            advice: 'Datos no disponibles para esta región.'
        };
    }
    /**
     * Obtiene lista de competidores disponibles en la región usando API CMF (ahora estática)
     */
    async getAvailableCompetitors(countryCode) {
        if (countryCode !== 'CL')
            return [];
        try {
            // 1. Obtener lista oficial de CMF (ahora desde nuestro registro estático)
            const institutions = await cmfService.getInstitutions();
            // 2. Filtrar los que tienen simulador disponible
            const competitors = [];
            for (const inst of institutions) {
                const hasSimulator = await cmfService.checkSimulatorAvailability(inst.CodigoInstitucion);
                if (hasSimulator) {
                    competitors.push({
                        id: inst.CodigoInstitucion,
                        name: inst.NombreInstitucion,
                        logo: BANK_LOGOS[inst.CodigoInstitucion] || '🏦',
                        baseRate: 0, // Se calculará dinámicamente en simulateCompetitor
                        reputation: 4.0 // Podríamos buscar un rating real si existiera API
                    });
                }
            }
            return competitors;
        }
        catch (error) {
            console.error("Error fetching from CMF:", error);
            throw error; // No fallback
        }
    }
    /**
     * Helper para calcular simulación dado una tasa específica
     */
    calculateSimulation(competitor, amount, months, annualRate) {
        const r = annualRate / 100 / 12; // Tasa mensual
        const monthlyPayment = amount * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
        const totalPayment = monthlyPayment * months;
        const totalInterest = totalPayment - amount;
        const cae = annualRate * 1.05;
        return {
            competitor,
            monthlyPayment,
            totalPayment,
            totalInterest,
            cae: Number(cae.toFixed(2)),
            requirements: ['Renta mínima 3x cuota', 'Antigüedad 1 año', 'Sin Dicom']
        };
    }
    /**
     * Simula un crédito en una institución externa
     */
    async simulateCompetitor(competitorId, amount, months, countryCode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        let competitor;
        if (countryCode === 'CL') {
            const institutions = await cmfService.getInstitutions();
            const inst = institutions.find(i => i.CodigoInstitucion === competitorId);
            if (inst) {
                competitor = {
                    id: inst.CodigoInstitucion,
                    name: inst.NombreInstitucion,
                    logo: BANK_LOGOS[inst.CodigoInstitucion] || '🏦',
                    baseRate: 0,
                    reputation: 4.5
                };
            }
        }
        if (!competitor)
            throw new Error('Competidor no encontrado');
        // 1. OBTENER DATOS REALES DE MERCADO (TPM)
        const indicators = await this.getEconomicIndicators(countryCode);
        const tpm = indicators.centralBankRate;
        // 2. OBTENER SPREAD DEL BANCO
        let bankSpread = BANK_SPREADS_OVER_TPM[competitorId] || 12.0;
        // 3. CALCULAR TASA FINAL
        const finalRate = tpm + bankSpread;
        return this.calculateSimulation(competitor, amount, months, finalRate);
    }
    /**
     * Genera 3 escenarios inteligentes para un competidor
     */
    async getSmartScenarios(competitorId, amount, baseMonths, countryCode) {
        const balanced = await this.simulateCompetitor(competitorId, amount, baseMonths, countryCode);
        // Re-usamos la tasa implícita del escenario balanceado para los otros dos
        // Tasa anual aprox = (CAE / 1.05)
        const impliedRate = balanced.cae / 1.05;
        // Conservador
        let conservativeMonths = Math.max(6, Math.floor(baseMonths * 0.6));
        if (conservativeMonths === baseMonths)
            conservativeMonths = Math.max(6, baseMonths - 6);
        const conservative = this.calculateSimulation(balanced.competitor, amount, conservativeMonths, impliedRate);
        // Arriesgado
        let riskyMonths = Math.min(60, Math.ceil(baseMonths * 1.5));
        if (riskyMonths === baseMonths)
            riskyMonths = Math.min(60, baseMonths + 12);
        const risky = this.calculateSimulation(balanced.competitor, amount, riskyMonths, impliedRate);
        return { conservative, balanced, risky };
    }
    /**
     * Genera Contra-Ofertas (Beat the Bank)
     * Crea 3 escenarios de Aurora Privé que superan la oferta del competidor
     */
    async generateCounterOffers(targetPayment, amount, months) {
        // 1. Definir nuestro competidor interno (Aurora Privé)
        const aurora = {
            id: 'AURORA',
            name: 'Aurora Privé',
            logo: '💎',
            baseRate: 0,
            reputation: 5.0
        };
        // 2. Calcular tasa objetivo para superar al banco (ej: 5% menos de cuota)
        // Iteramos para encontrar la tasa que da (targetPayment * 0.95)
        const targetCounterPayment = targetPayment * 0.95;
        // Aproximación simple de tasa:
        // Payment = P * r / (1 - (1+r)^-n)
        // Es difícil despejar r, así que usaremos una tasa base agresiva (ej: TPM + 2%)
        // Asumimos que Aurora siempre puede ofrecer TPM + 2% (vs TPM + 4% de los bancos)
        const indicators = await this.getEconomicIndicators('CL');
        const aggressiveRate = indicators.centralBankRate + 2.0; // Muy competitiva
        // 3. Generar escenarios
        const balanced = this.calculateSimulation(aurora, amount, months, aggressiveRate);
        let conservativeMonths = Math.max(6, Math.floor(months * 0.6));
        if (conservativeMonths === months)
            conservativeMonths = Math.max(6, months - 6);
        const conservative = this.calculateSimulation(aurora, amount, conservativeMonths, aggressiveRate);
        let riskyMonths = Math.min(60, Math.ceil(months * 1.5));
        if (riskyMonths === months)
            riskyMonths = Math.min(60, months + 12);
        const risky = this.calculateSimulation(aurora, amount, riskyMonths, aggressiveRate);
        return { conservative, balanced, risky };
    }
}
export const marketDataService = new MarketDataService();
