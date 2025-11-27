
import { Router } from 'express';

const router = Router();

// Endpoint para obtener indicadores económicos desde mindicador.cl (Pública)
router.get('/indicators', async (req, res) => {
    try {
        const url = 'https://mindicador.cl/api';
        console.log(`[Public API] Fetching economic indicators from: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error fetching from mindicador.cl: ${response.statusText}`);
        }

        const data = await response.json();

        // Transformar formato de mindicador.cl al formato que espera nuestro frontend
        // mindicador.cl devuelve: { uf: { valor: 36000, ... }, ... }
        // Frontend espera: { uf: { value: 36000 }, ... }

        const transformedData = {
            uf: { value: data.uf.valor, date: data.uf.fecha },
            utm: { value: data.utm.valor, date: data.utm.fecha },
            tpm: { value: data.tpm.valor, date: data.tpm.fecha },
            ipc: { value: data.ipc.valor, date: data.ipc.fecha }, // IPC es variación mensual
            dolar: { value: data.dolar.valor, date: data.dolar.fecha }
        };

        res.json(transformedData);

    } catch (error) {
        console.error('[Public API] Exception:', error);
        res.status(500).json({
            error: 'Error al obtener indicadores económicos',
            details: error.message
        });
    }
});

export default router;
