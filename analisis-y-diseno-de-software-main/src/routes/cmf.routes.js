
import { Router } from 'express';

const router = Router();

// Lista oficial de bancos en Chile (Fuente: CMF)
// Hardcoded para evitar dependencias de API Keys y errores de conexión
const OFFICIAL_BANKS = [
    { CodigoInstitucion: "001", NombreInstitucion: "BANCO DE CHILE" },
    { CodigoInstitucion: "009", NombreInstitucion: "BANCO INTERNACIONAL" },
    { CodigoInstitucion: "012", NombreInstitucion: "BANCO DEL ESTADO DE CHILE" },
    { CodigoInstitucion: "014", NombreInstitucion: "SCOTIABANK CHILE" },
    { CodigoInstitucion: "016", NombreInstitucion: "BANCO DE CREDITO E INVERSIONES" },
    { CodigoInstitucion: "028", NombreInstitucion: "BANCO BICE" },
    { CodigoInstitucion: "037", NombreInstitucion: "BANCO SANTANDER-CHILE" },
    { CodigoInstitucion: "039", NombreInstitucion: "ITAÚ CORPBANCA" },
    { CodigoInstitucion: "049", NombreInstitucion: "BANCO SECURITY" },
    { CodigoInstitucion: "051", NombreInstitucion: "BANCO FALABELLA" },
    { CodigoInstitucion: "053", NombreInstitucion: "BANCO RIPLEY" },
    { CodigoInstitucion: "055", NombreInstitucion: "BANCO CONSORCIO" }
];

// Endpoint para obtener instituciones (Simulado con datos reales estáticos)
router.get('/instituciones', (req, res) => {
    console.log('[CMF Registry] Serving static bank list');
    res.json({ Instituciones: OFFICIAL_BANKS });
});

export default router;
