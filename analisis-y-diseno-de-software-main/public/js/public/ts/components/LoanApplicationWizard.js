import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ============================================================================
 * LOAN APPLICATION WIZARD - Formulario de Solicitud de Crédito
 * ============================================================================
 *
 * Wizard de múltiples pasos con integración al motor de scoring crediticio.
 * Recolecta datos del usuario y ejecuta evaluación de riesgo en tiempo real.
 *
 * Incluye OCR REAL con Tesseract.js para extracción de datos de cédula.
 */
import { useState, useEffect } from 'react';
import { ScoringEngine } from '../engine/ScoringEngine.js';
import { useSimulation } from '../store/simulationStore.js';
import { createWorker } from 'tesseract.js';
// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export const LoanApplicationWizard = () => {
    // Estado del store (simulación previa)
    const { loanAmount, loanMonths } = useSimulation();
    // Estado del wizard
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        rut: '',
        fechaNacimiento: '',
        ingresoLiquido: 0,
        situacionLaboral: 'INDEFINIDO',
        antiguedadLaboral: 12,
        tieneDeudaMorosa: false,
        otrasDeudas: 0,
        esPropietario: false,
        esProfesional: false,
    });
    // Estado para simulación OCR
    const [isScanning, setIsScanning] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    // Estado para análisis
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisMessage, setAnalysisMessage] = useState('');
    const [riskResult, setRiskResult] = useState(null);
    // Estado para confetti
    const [showConfetti, setShowConfetti] = useState(false);
    // Estado para envío al backend
    const [isSaving, setIsSaving] = useState(false);
    const [savedCreditId, setSavedCreditId] = useState(null);
    const [saveError, setSaveError] = useState(null);
    // =========================================================================
    // INTEGRACIÓN CON BACKEND
    // =========================================================================
    /**
     * Envía la solicitud de crédito al backend
     * Se ejecuta después de mostrar el resultado del scoring
     */
    const submitLoanApplication = async () => {
        if (!riskResult) {
            console.error('No hay resultado de scoring para enviar');
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            // Obtener token de autenticación (si existe)
            const token = localStorage.getItem('token');
            // Preparar datos para el backend
            const payload = {
                tipo_credito: 'CONSUMO', // Por ahora siempre es consumo
                monto_solicitado: loanAmount,
                monto_aprobado: riskResult.montoAprobado,
                plazo_meses: loanMonths,
                tasa_interes: riskResult.tasaOfrecida, // Usar tasaOfrecida, no tasaInteres
                cuota_mensual: riskResult.cuotaEstimada, // Usar cuotaEstimada, no cuotaMensual
                // Datos del scoring
                score_crediticio: riskResult.score,
                estado_evaluacion: riskResult.status,
                // Datos del cliente (extraídos por OCR)
                datos_cliente: {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    rut: formData.rut,
                    fecha_nacimiento: formData.fechaNacimiento,
                    ingreso_liquido: formData.ingresoLiquido,
                    situacion_laboral: formData.situacionLaboral,
                    antiguedad_laboral: formData.antiguedadLaboral,
                    tiene_deuda_morosa: formData.tieneDeudaMorosa,
                    otras_deudas: formData.otrasDeudas,
                    es_propietario: formData.esPropietario,
                    es_profesional: formData.esProfesional,
                },
                // Metadatos del scoring
                scoring_detalles: {
                    componentes: riskResult.breakdown, // Usar breakdown, no desglose
                    factores_riesgo: riskResult.riskFactors, // Agregar factores de riesgo
                    recomendaciones: riskResult.recomendaciones,
                    capacidad_maxima: riskResult.maxAmount, // Usar maxAmount, no capacidadMaxima
                },
            };
            // Construir headers
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // Enviar al backend
            const response = await fetch('http://localhost:3000/api/creditos', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Error al guardar la solicitud');
            }
            // Guardar ID del crédito creado
            setSavedCreditId(result.data.id);
            console.log('✅ Solicitud guardada exitosamente:', result.data);
        }
        catch (error) {
            console.error('❌ Error al guardar solicitud:', error);
            setSaveError(error instanceof Error ? error.message : 'Error desconocido');
            // Si no hay autenticación, mostrar mensaje amigable
            if (error instanceof Error && error.message.includes('token')) {
                setSaveError('Para guardar la solicitud debes estar registrado. Los datos se mostrarán solo en esta sesión.');
            }
        }
        finally {
            setIsSaving(false);
        }
    };
    // =========================================================================
    // OCR REAL CON TESSERACT.JS
    // =========================================================================
    /**
     * Extrae datos de la cédula usando OCR real
     */
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida');
            return;
        }
        setIsScanning(true);
        setOcrProgress(0);
        setOcrStatus('Cargando imagen...');
        try {
            // Crear URL de la imagen para preview
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
            // Crear worker de Tesseract
            setOcrStatus('Inicializando motor OCR...');
            const worker = await createWorker('spa', 1, {
                logger: (m) => {
                    // Actualizar progreso
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        setOcrProgress(progress);
                        setOcrStatus(`Extrayendo texto... ${progress}%`);
                    }
                },
            });
            // Ejecutar OCR
            setOcrStatus('Analizando documento...');
            const { data: { text } } = await worker.recognize(file);
            setOcrStatus('Procesando datos extraídos...');
            // Extraer información usando expresiones regulares
            const extractedData = extractDataFromText(text);
            // Llenar formulario con datos extraídos
            setFormData(prev => ({
                ...prev,
                ...extractedData,
            }));
            // Terminar worker
            await worker.terminate();
            setOcrStatus('✅ Datos extraídos exitosamente');
            setIsScanning(false);
            setHasScanned(true);
            // Limpiar URL después de 5 segundos
            setTimeout(() => {
                URL.revokeObjectURL(imageUrl);
            }, 5000);
        }
        catch (error) {
            console.error('Error en OCR:', error);
            setOcrStatus('❌ Error al procesar la imagen');
            setIsScanning(false);
            alert('Hubo un error al procesar la imagen. Por favor intenta con otra foto más clara.');
        }
    };
    /**
     * Extrae información estructurada del texto OCR
     * Busca patrones específicos de cédula chilena
     */
    const extractDataFromText = (text) => {
        const extractedData = {};
        // Limpiar texto (remover saltos de línea múltiples, espacios extra)
        const cleanText = text.replace(/\s+/g, ' ').trim();
        // 1. EXTRAER RUT (formato: 12.345.678-9 o 12345678-9)
        const rutPattern = /(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])/gi;
        const rutMatch = cleanText.match(rutPattern);
        if (rutMatch) {
            // Tomar el primer RUT encontrado y normalizarlo
            let rut = rutMatch[0].replace(/\./g, ''); // Remover puntos
            // Asegurar formato con puntos
            const rutNumbers = rut.slice(0, -2);
            const rutDv = rut.slice(-1);
            const formattedRut = rutNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + rutDv;
            extractedData.rut = formattedRut;
        }
        // 2. EXTRAER FECHA DE NACIMIENTO (formatos: DD MMM YYYY, DD-MM-YYYY, DD/MM/YYYY)
        const datePatterns = [
            /(\d{1,2})\s*(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[A-Z]*\s*(\d{4})/gi,
            /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/g,
        ];
        for (const pattern of datePatterns) {
            const dateMatch = cleanText.match(pattern);
            if (dateMatch) {
                const dateStr = dateMatch[0];
                const parsedDate = parseDateString(dateStr);
                if (parsedDate) {
                    extractedData.fechaNacimiento = parsedDate;
                    break;
                }
            }
        }
        // 3. EXTRAER NOMBRE Y APELLIDO
        // Buscar palabras en mayúsculas (típico de cédulas)
        const upperCaseWords = text.match(/[A-ZÁÉÍÓÚÑ]{3,}/g);
        if (upperCaseWords && upperCaseWords.length >= 2) {
            // Filtrar palabras comunes de cédulas
            const filteredWords = upperCaseWords.filter(word => !['REPUBLICA', 'CHILE', 'CEDULA', 'IDENTIDAD', 'CHILENA', 'NACIONALIDAD',
                'SEXO', 'DIRECCION', 'COMUNA', 'REGION', 'RUT', 'NAC', 'DOC'].includes(word));
            if (filteredWords.length >= 2) {
                // Primer palabra: nombre, siguientes: apellidos
                extractedData.nombre = capitalize(filteredWords[0]);
                extractedData.apellido = filteredWords.slice(1, 3).map(w => capitalize(w)).join(' ');
            }
        }
        // 4. Si no se pudo extraer nombre, buscar patrón "NOMBRES: XXX"
        if (!extractedData.nombre) {
            const nombrePattern = /NOMBRES?:?\s*([A-ZÁÉÍÓÚÑ\s]+)/i;
            const nombreMatch = cleanText.match(nombrePattern);
            if (nombreMatch) {
                const nombres = nombreMatch[1].trim().split(/\s+/);
                extractedData.nombre = capitalize(nombres[0]);
            }
        }
        // 5. Si no se pudo extraer apellido, buscar patrón "APELLIDOS: XXX"
        if (!extractedData.apellido) {
            const apellidoPattern = /APELLIDOS?:?\s*([A-ZÁÉÍÓÚÑ\s]+)/i;
            const apellidoMatch = cleanText.match(apellidoPattern);
            if (apellidoMatch) {
                const apellidos = apellidoMatch[1].trim().split(/\s+/).slice(0, 2);
                extractedData.apellido = apellidos.map(a => capitalize(a)).join(' ');
            }
        }
        return extractedData;
    };
    /**
     * Convierte fecha de texto a formato ISO (YYYY-MM-DD)
     */
    const parseDateString = (dateStr) => {
        const monthMap = {
            'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
            'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
            'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12',
        };
        // Formato: DD MMM YYYY
        const textDatePattern = /(\d{1,2})\s*(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[A-Z]*\s*(\d{4})/i;
        const textMatch = dateStr.match(textDatePattern);
        if (textMatch) {
            const day = textMatch[1].padStart(2, '0');
            const month = monthMap[textMatch[2].toUpperCase()];
            const year = textMatch[3];
            return `${year}-${month}-${day}`;
        }
        // Formato: DD-MM-YYYY o DD/MM/YYYY
        const numericDatePattern = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/;
        const numericMatch = dateStr.match(numericDatePattern);
        if (numericMatch) {
            const day = numericMatch[1].padStart(2, '0');
            const month = numericMatch[2].padStart(2, '0');
            const year = numericMatch[3];
            return `${year}-${month}-${day}`;
        }
        return null;
    };
    /**
     * Capitaliza primera letra de cada palabra
     */
    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };
    // =========================================================================
    // ANÁLISIS DE RIESGO
    // =========================================================================
    useEffect(() => {
        if (currentStep === 3 && !isAnalyzing && !riskResult) {
            executeRiskAnalysis();
        }
    }, [currentStep]);
    const executeRiskAnalysis = async () => {
        setIsAnalyzing(true);
        // Mensajes progresivos
        const messages = [
            '🔍 Conectando con Buró de Crédito...',
            '📊 Analizando Capacidad de Pago...',
            '🎯 Calculando Score de Riesgo...',
            '✨ Generando Oferta Personalizada...',
        ];
        let messageIndex = 0;
        setAnalysisMessage(messages[0]);
        const messageInterval = setInterval(() => {
            messageIndex++;
            if (messageIndex < messages.length) {
                setAnalysisMessage(messages[messageIndex]);
            }
        }, 750);
        // Simular delay de análisis (3 segundos)
        await new Promise(resolve => setTimeout(resolve, 3000));
        clearInterval(messageInterval);
        // Calcular edad desde fecha de nacimiento
        const birthDate = new Date(formData.fechaNacimiento);
        const today = new Date();
        const edad = today.getFullYear() - birthDate.getFullYear() -
            (today.getMonth() < birthDate.getMonth() ||
                (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
        // Preparar datos para el motor de scoring
        const userData = {
            edad,
            ingresoLiquido: formData.ingresoLiquido,
            otrasDeudas: formData.otrasDeudas,
            tieneDeudaMorosa: formData.tieneDeudaMorosa,
            tipoContrato: formData.situacionLaboral,
            antiguedadLaboral: formData.antiguedadLaboral,
            esPropietario: formData.esPropietario,
            esProfesional: formData.esProfesional,
            historialCrediticio: 'IMPECABLE', // Simulado
        };
        const loanRequest = {
            montoSolicitado: loanAmount,
            plazoMeses: loanMonths,
        };
        // EJECUTAR MOTOR DE SCORING
        const resultado = ScoringEngine.evaluateRisk(userData, loanRequest);
        setRiskResult(resultado);
        setIsAnalyzing(false);
        // Avanzar automáticamente al paso 4 después de 1 segundo
        setTimeout(async () => {
            setCurrentStep(4);
            // Mostrar confetti si fue aprobado o premium
            if (resultado.status === 'APROBADO' || resultado.status === 'APROBADO_PREMIUM') {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }
            // GUARDAR EN BASE DE DATOS
            // Se ejecuta automáticamente después de mostrar el resultado
            await submitLoanApplication();
        }, 1000);
    };
    // =========================================================================
    // NAVEGACIÓN
    // =========================================================================
    const canContinue = () => {
        switch (currentStep) {
            case 1:
                return hasScanned &&
                    formData.nombre !== '' &&
                    formData.apellido !== '' &&
                    formData.rut !== '' &&
                    formData.fechaNacimiento !== '';
            case 2:
                return formData.ingresoLiquido > 0 && formData.antiguedadLaboral > 0;
            case 3:
                return false; // No se puede avanzar manualmente desde análisis
            case 4:
                return false; // Paso final
            default:
                return false;
        }
    };
    const handleNext = () => {
        if (canContinue() && currentStep < 4) {
            setCurrentStep((currentStep + 1));
        }
    };
    const handleBack = () => {
        if (currentStep > 1 && currentStep !== 3) {
            setCurrentStep((currentStep - 1));
        }
    };
    const handleRestart = () => {
        setCurrentStep(1);
        setFormData({
            nombre: '',
            apellido: '',
            rut: '',
            fechaNacimiento: '',
            ingresoLiquido: 0,
            situacionLaboral: 'INDEFINIDO',
            antiguedadLaboral: 12,
            tieneDeudaMorosa: false,
            otrasDeudas: 0,
            esPropietario: false,
            esProfesional: false,
        });
        setHasScanned(false);
        setRiskResult(null);
        setShowConfetti(false);
    };
    // =========================================================================
    // RENDERIZADO
    // =========================================================================
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4", children: [_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-2", children: "Solicitud de Cr\u00E9dito" }), _jsx("p", { className: "text-gray-600", children: "Completa los datos para evaluar tu solicitud" })] }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-gray-700", children: ["Paso ", currentStep, " de 4"] }), _jsxs("span", { className: "text-sm text-gray-500", children: [Math.round((currentStep / 4) * 100), "% completado"] })] }), _jsx("div", { className: "h-2 bg-gray-200 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out", style: { width: `${(currentStep / 4) * 100}%` } }) })] }), _jsx("div", { className: "bg-white rounded-2xl shadow-xl overflow-hidden", children: _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "relative", children: [currentStep === 1 && (_jsxs("div", { className: "animate-slideInRight", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "\uD83D\uDCCB Identidad" }), _jsx("div", { className: "mb-8", children: _jsxs("label", { className: "block", children: [_jsx("input", { type: "file", accept: "image/*", onChange: handleFileSelect, className: "hidden", disabled: isScanning || hasScanned }), _jsxs("div", { className: `
                          relative cursor-pointer border-2 border-dashed rounded-xl p-8 text-center
                          transition-all duration-300
                          ${hasScanned
                                                                    ? 'border-green-400 bg-green-50'
                                                                    : isScanning
                                                                        ? 'border-blue-400 bg-blue-50'
                                                                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
                        `, children: [selectedImage && (_jsx("div", { className: "mb-6", children: _jsx("img", { src: selectedImage, alt: "C\u00E9dula de identidad", className: "max-h-64 mx-auto rounded-lg shadow-md border border-gray-200" }) })), isScanning ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" }) }), _jsx("p", { className: "text-blue-700 font-semibold text-lg mb-3", children: ocrStatus }), _jsxs("div", { className: "max-w-md mx-auto", children: [_jsx("div", { className: "w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2", children: _jsx("div", { className: "bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out", style: { width: `${ocrProgress}%` } }) }), _jsxs("p", { className: "text-sm text-gray-600", children: [ocrProgress, "% completado"] })] })] })) : hasScanned ? (
                                                                    // Estado: Completado
                                                                    _jsxs(_Fragment, { children: [_jsx("div", { className: "text-6xl mb-4", children: "\u2705" }), _jsx("p", { className: "text-green-600 font-medium text-lg mb-2", children: ocrStatus }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Los datos han sido extra\u00EDdos y autocompletados" }), _jsx("button", { onClick: (e) => {
                                                                                    e.preventDefault();
                                                                                    setHasScanned(false);
                                                                                    setSelectedImage(null);
                                                                                    setOcrProgress(0);
                                                                                    setFormData({
                                                                                        ...formData,
                                                                                        nombre: '',
                                                                                        apellido: '',
                                                                                        rut: '',
                                                                                        fechaNacimiento: '',
                                                                                    });
                                                                                }, className: "mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors", children: "\uD83D\uDD04 Escanear otra c\u00E9dula" })] })) : (
                                                                    // Estado: Inicial
                                                                    _jsxs(_Fragment, { children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCF8" }), _jsx("p", { className: "text-gray-700 font-medium text-lg mb-2", children: "Escanear C\u00E9dula de Identidad" }), _jsx("p", { className: "text-gray-500 text-sm mb-1", children: "Haz clic para seleccionar una imagen de tu c\u00E9dula" }), _jsx("p", { className: "text-xs text-gray-400 mt-3", children: "\uD83D\uDCA1 Usa el anverso de la c\u00E9dula con buena iluminaci\u00F3n" })] }))] })] }) }), hasScanned && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nombre" }), _jsx("input", { type: "text", value: formData.nombre, onChange: (e) => setFormData({ ...formData, nombre: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "Juan" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Apellido" }), _jsx("input", { type: "text", value: formData.apellido, onChange: (e) => setFormData({ ...formData, apellido: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "P\u00E9rez" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "RUT" }), _jsx("input", { type: "text", value: formData.rut, onChange: (e) => setFormData({ ...formData, rut: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "12.345.678-9" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Fecha de Nacimiento" }), _jsx("input", { type: "date", value: formData.fechaNacimiento, onChange: (e) => setFormData({ ...formData, fechaNacimiento: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })] }))] })), currentStep === 2 && (_jsxs("div", { className: "animate-slideInRight", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "\uD83D\uDCB0 Informaci\u00F3n Financiera" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Ingreso L\u00EDquido Mensual (CLP)" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-500", children: "$" }), _jsx("input", { type: "number", value: formData.ingresoLiquido || '', onChange: (e) => setFormData({ ...formData, ingresoLiquido: Number(e.target.value) }), className: "w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "800.000", min: "0", step: "10000" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Sueldo l\u00EDquido despu\u00E9s de descuentos" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Situaci\u00F3n Laboral" }), _jsxs("select", { value: formData.situacionLaboral, onChange: (e) => setFormData({ ...formData, situacionLaboral: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "INDEFINIDO", children: "Contrato Indefinido" }), _jsx("option", { value: "PLAZO_FIJO", children: "Contrato a Plazo Fijo" }), _jsx("option", { value: "INDEPENDIENTE", children: "Trabajador Independiente" }), _jsx("option", { value: "TEMPORAL", children: "Contrato Temporal" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Antig\u00FCedad Laboral: ", Math.floor(formData.antiguedadLaboral / 12), " a\u00F1os ", formData.antiguedadLaboral % 12, " meses"] }), _jsx("input", { type: "range", min: "0", max: "120", step: "6", value: formData.antiguedadLaboral, onChange: (e) => setFormData({ ...formData, antiguedadLaboral: Number(e.target.value) }), className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" }), _jsxs("div", { className: "flex justify-between text-xs text-gray-500 mt-1", children: [_jsx("span", { children: "Nuevo" }), _jsx("span", { children: "10 a\u00F1os" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Otras Deudas Mensuales (CLP)" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-500", children: "$" }), _jsx("input", { type: "number", value: formData.otrasDeudas || '', onChange: (e) => setFormData({ ...formData, otrasDeudas: Number(e.target.value) }), className: "w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "0", min: "0", step: "10000" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Suma de cuotas mensuales de otras deudas (tarjetas, cr\u00E9ditos, etc.)" })] }), _jsxs("div", { className: "space-y-3 pt-4 border-t border-gray-200", children: [_jsxs("label", { className: "flex items-start cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: formData.tieneDeudaMorosa, onChange: (e) => setFormData({ ...formData, tieneDeudaMorosa: e.target.checked }), className: "mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsxs("span", { className: "ml-3 text-sm text-gray-700 group-hover:text-gray-900", children: [_jsx("span", { className: "font-medium", children: "Tengo deudas impagas vigentes" }), _jsx("span", { className: "block text-xs text-gray-500 mt-1", children: "Registros en DICOM u otros sistemas de informaci\u00F3n comercial" })] })] }), _jsxs("label", { className: "flex items-start cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: formData.esPropietario, onChange: (e) => setFormData({ ...formData, esPropietario: e.target.checked }), className: "mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "ml-3 text-sm text-gray-700 group-hover:text-gray-900", children: _jsx("span", { className: "font-medium", children: "Soy propietario de bien ra\u00EDz o veh\u00EDculo" }) })] }), _jsxs("label", { className: "flex items-start cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: formData.esProfesional, onChange: (e) => setFormData({ ...formData, esProfesional: e.target.checked }), className: "mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "ml-3 text-sm text-gray-700 group-hover:text-gray-900", children: _jsx("span", { className: "font-medium", children: "Poseo t\u00EDtulo profesional universitario" }) })] })] })] })] })), currentStep === 3 && (_jsx("div", { className: "animate-fadeIn", children: _jsxs("div", { className: "text-center py-12", children: [_jsxs("div", { className: "inline-block relative mb-8", children: [_jsx("div", { className: "animate-spin rounded-full h-24 w-24 border-8 border-blue-500 border-t-transparent" }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "text-3xl", children: "\uD83C\uDFAF" }) })] }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Analizando tu Solicitud" }), _jsx("p", { className: "text-xl text-blue-600 font-medium mb-8 animate-pulse", children: analysisMessage }), _jsxs("div", { className: "max-w-md mx-auto space-y-3 text-left", children: [_jsxs("div", { className: "flex items-center space-x-3 text-gray-600", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }), _jsx("span", { children: "Validaci\u00F3n de identidad" })] }), _jsxs("div", { className: "flex items-center space-x-3 text-gray-600", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse", style: { animationDelay: '0.2s' } }), _jsx("span", { children: "Consulta hist\u00F3rica crediticia" })] }), _jsxs("div", { className: "flex items-center space-x-3 text-gray-600", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse", style: { animationDelay: '0.4s' } }), _jsx("span", { children: "C\u00E1lculo de capacidad de pago" })] }), _jsxs("div", { className: "flex items-center space-x-3 text-gray-600", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse", style: { animationDelay: '0.6s' } }), _jsx("span", { children: "Evaluaci\u00F3n de riesgo crediticio" })] })] })] }) })), currentStep === 4 && riskResult && (_jsxs("div", { className: "animate-slideInRight", children: [isSaving && (_jsxs("div", { className: "mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3", children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" }), _jsx("span", { className: "text-blue-700 font-medium", children: "Guardando solicitud en la base de datos..." })] })), !isSaving && savedCreditId && (_jsxs("div", { className: "mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3", children: [_jsx("svg", { className: "w-5 h-5 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }), _jsxs("span", { className: "text-green-700 font-medium", children: ["\u2705 Solicitud guardada exitosamente (ID: #", savedCreditId, ")"] })] })), !isSaving && saveError && (_jsx("div", { className: "mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("svg", { className: "w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-yellow-800 font-medium mb-1", children: "\u26A0\uFE0F Nota: Los datos no se guardaron en la base de datos" }), _jsx("p", { className: "text-sm text-yellow-700", children: saveError })] })] }) })), showConfetti && (_jsx("div", { className: "fixed inset-0 pointer-events-none z-50", children: [...Array(50)].map((_, i) => (_jsx("div", { className: "absolute animate-confetti", style: {
                                                            left: `${Math.random() * 100}%`,
                                                            top: `-${Math.random() * 20}%`,
                                                            animationDelay: `${Math.random() * 2}s`,
                                                            animationDuration: `${2 + Math.random() * 2}s`,
                                                        }, children: "\uD83C\uDF89" }, i))) })), (riskResult.status === 'APROBADO' || riskResult.status === 'APROBADO_PREMIUM') && (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block p-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 animate-bounce", children: _jsx("div", { className: "text-6xl text-white", children: riskResult.status === 'APROBADO_PREMIUM' ? '🌟' : '✅' }) }), _jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-3", children: riskResult.status === 'APROBADO_PREMIUM'
                                                                ? '¡Felicidades! Eres Cliente Premium'
                                                                : '¡Crédito Aprobado!' }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: riskResult.mensaje }), _jsx("div", { className: "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 mb-8", children: _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Score" }), _jsxs("p", { className: "text-2xl font-bold text-green-600", children: [riskResult.score, "/1000"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Monto Aprobado" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["$", riskResult.montoAprobado.toLocaleString('es-CL')] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Tasa Mensual" }), _jsxs("p", { className: "text-2xl font-bold text-blue-600", children: [(riskResult.tasaOfrecida * 100).toFixed(2), "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Cuota Mensual" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["$", riskResult.cuotaEstimada.toLocaleString('es-CL')] })] })] }) }), riskResult.recomendaciones.length > 0 && (_jsxs("div", { className: "text-left mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "\uD83D\uDCA1 Informaci\u00F3n Importante:" }), _jsx("ul", { className: "space-y-2", children: riskResult.recomendaciones.map((rec, idx) => (_jsxs("li", { className: "flex items-start space-x-2 text-gray-700", children: [_jsx("span", { className: "text-green-500 mt-1", children: "\u2022" }), _jsx("span", { children: rec })] }, idx))) })] })), _jsx("button", { className: "w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200", children: "\uD83D\uDCDD Firmar Contrato Digital" })] })), riskResult.status === 'CONDICIONAL' && (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block p-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mb-6", children: _jsx("div", { className: "text-6xl text-white", children: "\u26A0\uFE0F" }) }), _jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-3", children: "Aprobaci\u00F3n Condicional" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: riskResult.mensaje }), _jsx("div", { className: "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 mb-8", children: _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Score" }), _jsxs("p", { className: "text-2xl font-bold text-orange-600", children: [riskResult.score, "/1000"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Monto Ajustado" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["$", riskResult.montoAprobado.toLocaleString('es-CL')] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Tasa Mensual" }), _jsxs("p", { className: "text-2xl font-bold text-blue-600", children: [(riskResult.tasaOfrecida * 100).toFixed(2), "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Cuota Estimada" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["$", riskResult.cuotaEstimada.toLocaleString('es-CL')] })] })] }) }), _jsxs("div", { className: "text-left mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "\uD83D\uDCA1 Recomendaciones:" }), _jsx("ul", { className: "space-y-2", children: riskResult.recomendaciones.map((rec, idx) => (_jsxs("li", { className: "flex items-start space-x-2 text-gray-700", children: [_jsx("span", { className: "text-yellow-500 mt-1", children: "\u2022" }), _jsx("span", { children: rec })] }, idx))) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("button", { onClick: handleRestart, className: "bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors", children: "Revisar Solicitud" }), _jsx("button", { className: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all", children: "Aceptar Oferta" })] })] })), riskResult.status === 'RECHAZADO' && (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block p-8 bg-gradient-to-br from-red-400 to-pink-400 rounded-full mb-6", children: _jsx("div", { className: "text-6xl text-white", children: "\u274C" }) }), _jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-3", children: "Lo sentimos" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: riskResult.mensaje }), riskResult.riskFactors.length > 0 && (_jsxs("div", { className: "bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Razones del Rechazo:" }), _jsx("ul", { className: "space-y-3", children: riskResult.riskFactors.map((factor, idx) => (_jsxs("li", { className: "flex items-start space-x-3 text-left", children: [_jsx("span", { className: "flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold", children: idx + 1 }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: factor.descripcion }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Impacto: ", factor.impacto] })] })] }, idx))) })] })), _jsxs("div", { className: "text-left mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "\uD83D\uDCA1 \u00BFQu\u00E9 puedo hacer?" }), _jsx("ul", { className: "space-y-2", children: riskResult.recomendaciones.map((rec, idx) => (_jsxs("li", { className: "flex items-start space-x-2 text-gray-700", children: [_jsx("span", { className: "text-blue-500 mt-1", children: "\u2022" }), _jsx("span", { children: rec })] }, idx))) })] }), _jsx("button", { onClick: handleRestart, className: "w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200", children: "\uD83D\uDD04 Volver al Inicio" })] }))] }))] }), currentStep !== 3 && currentStep !== 4 && (_jsxs("div", { className: "flex justify-between items-center mt-8 pt-6 border-t border-gray-200", children: [_jsx("button", { onClick: handleBack, disabled: currentStep === 1, className: `
                    px-6 py-3 rounded-lg font-medium transition-all
                    ${currentStep === 1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                  `, children: "\u2190 Atr\u00E1s" }), _jsx("button", { onClick: handleNext, disabled: !canContinue(), className: `
                    px-8 py-3 rounded-lg font-bold transition-all transform
                    ${canContinue()
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `, children: "Continuar \u2192" })] }))] }) }), _jsx("div", { className: "mt-6 text-center text-sm text-gray-600", children: _jsx("p", { children: "\uD83D\uDD12 Tus datos est\u00E1n protegidos y encriptados seg\u00FAn normativa vigente" }) })] }), _jsx("style", { children: `
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }
      ` })] }));
};
