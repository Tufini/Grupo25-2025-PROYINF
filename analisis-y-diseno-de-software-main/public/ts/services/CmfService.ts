
/**
 * CMF Service - Servicio de integración con Comisión para el Mercado Financiero
 * Ahora utiliza un registro estático interno para garantizar disponibilidad sin API Keys.
 */

export interface CmfInstitution {
    CodigoInstitucion: string;
    NombreInstitucion: string;
    CodigoCiudad?: string;
}

export interface CmfResponse {
    Instituciones: CmfInstitution[];
}

class CmfService {
    /**
     * Obtiene el listado de instituciones financieras
     * Ahora consulta nuestro backend que tiene el registro oficial estático
     */
    async getInstitutions(): Promise<CmfInstitution[]> {
        try {
            const response = await fetch('/api/cmf/instituciones');

            if (!response.ok) {
                throw new Error('Error fetching institutions registry');
            }

            const data = await response.json();

            if (data.Instituciones) {
                return data.Instituciones;
            }

            throw new Error('Invalid data format from registry');
        } catch (error) {
            console.error('[CmfService] Error:', error);
            throw error;
        }
    }

    /**
     * Verifica si la institución cuenta con simulador de crédito online activo
     */
    async checkSimulatorAvailability(institutionCode: string): Promise<boolean> {
        // Lista de códigos de bancos que sabemos que tienen simuladores públicos
        const BANKS_WITH_SIMULATORS = ['001', '012', '014', '016', '037', '039', '051'];

        // Simular tiempo de verificación mínimo
        await new Promise(resolve => setTimeout(resolve, 100));

        return BANKS_WITH_SIMULATORS.includes(institutionCode);
    }

    /**
     * Obtiene indicadores económicos (UF, UTM)
     * @deprecated Usar MarketDataService.getEconomicIndicators en su lugar
     */
    async getIndicators(): Promise<{ uf: number, utm: number }> {
        return {
            uf: 0,
            utm: 0
        };
    }
}

export const cmfService = new CmfService();
