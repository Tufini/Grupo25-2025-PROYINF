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

import React, { useState, useEffect } from 'react';
import { ScoringEngine, UserData, LoanRequest, RiskResult } from '../engine/ScoringEngine.js';
import { useSimulation } from '../store/simulationStore.js';
import { createWorker } from 'tesseract.js';

// ============================================================================
// TIPOS
// ============================================================================

type WizardStep = 1 | 2 | 3 | 4;

interface FormData {
  // Paso 1: Identidad
  nombre: string;
  apellido: string;
  rut: string;
  fechaNacimiento: string;
  
  // Paso 2: Finanzas
  ingresoLiquido: number;
  situacionLaboral: 'INDEFINIDO' | 'PLAZO_FIJO' | 'INDEPENDIENTE' | 'TEMPORAL';
  antiguedadLaboral: number; // en meses
  tieneDeudaMorosa: boolean;
  otrasDeudas: number;
  esPropietario: boolean;
  esProfesional: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const LoanApplicationWizard: React.FC = () => {
  // Estado del store (simulación previa)
  const { loanAmount, loanMonths } = useSimulation();

  // Estado del wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<FormData>({
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Estado para análisis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);

  // Estado para confetti
  const [showConfetti, setShowConfetti] = useState(false);

  // Estado para envío al backend
  const [isSaving, setIsSaving] = useState(false);
  const [savedCreditId, setSavedCreditId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      const headers: Record<string, string> = {
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

    } catch (error) {
      console.error('❌ Error al guardar solicitud:', error);
      setSaveError(error instanceof Error ? error.message : 'Error desconocido');
      
      // Si no hay autenticación, mostrar mensaje amigable
      if (error instanceof Error && error.message.includes('token')) {
        setSaveError('Para guardar la solicitud debes estar registrado. Los datos se mostrarán solo en esta sesión.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // OCR REAL CON TESSERACT.JS
  // =========================================================================

  /**
   * Extrae datos de la cédula usando OCR real
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    } catch (error) {
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
  const extractDataFromText = (text: string): Partial<FormData> => {
    const extractedData: Partial<FormData> = {};

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
      const filteredWords = upperCaseWords.filter(word => 
        !['REPUBLICA', 'CHILE', 'CEDULA', 'IDENTIDAD', 'CHILENA', 'NACIONALIDAD', 
         'SEXO', 'DIRECCION', 'COMUNA', 'REGION', 'RUT', 'NAC', 'DOC'].includes(word)
      );

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
  const parseDateString = (dateStr: string): string | null => {
    const monthMap: { [key: string]: string } = {
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
  const capitalize = (str: string): string => {
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
    const userData: UserData = {
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

    const loanRequest: LoanRequest = {
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

  const canContinue = (): boolean => {
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
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep !== 3) {
      setCurrentStep((currentStep - 1) as WizardStep);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Solicitud de Crédito
          </h1>
          <p className="text-gray-600">
            Completa los datos para evaluar tu solicitud
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Paso {currentStep} de 4
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 4) * 100)}% completado
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Step Content */}
            <div className="relative">
              {/* Paso 1: Identidad */}
              {currentStep === 1 && (
                <div className="animate-slideInRight">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    📋 Identidad
                  </h2>

                  {/* Botón Escanear Cédula con Preview y Progreso OCR */}
                  <div className="mb-8">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isScanning || hasScanned}
                      />
                      <div
                        className={`
                          relative cursor-pointer border-2 border-dashed rounded-xl p-8 text-center
                          transition-all duration-300
                          ${hasScanned
                            ? 'border-green-400 bg-green-50'
                            : isScanning
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }
                        `}
                      >
                        {/* Preview de la imagen si existe */}
                        {selectedImage && (
                          <div className="mb-6">
                            <img 
                              src={selectedImage} 
                              alt="Cédula de identidad" 
                              className="max-h-64 mx-auto rounded-lg shadow-md border border-gray-200"
                            />
                          </div>
                        )}

                        {/* Estado: Escaneando con progreso */}
                        {isScanning ? (
                          <>
                            <div className="flex justify-center mb-4">
                              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" />
                            </div>
                            <p className="text-blue-700 font-semibold text-lg mb-3">
                              {ocrStatus}
                            </p>
                            {/* Barra de progreso */}
                            <div className="max-w-md mx-auto">
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out"
                                  style={{ width: `${ocrProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-600">{ocrProgress}% completado</p>
                            </div>
                          </>
                        ) : hasScanned ? (
                          // Estado: Completado
                          <>
                            <div className="text-6xl mb-4">✅</div>
                            <p className="text-green-600 font-medium text-lg mb-2">
                              {ocrStatus}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                              Los datos han sido extraídos y autocompletados
                            </p>
                            <button
                              onClick={(e) => {
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
                              }}
                              className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              🔄 Escanear otra cédula
                            </button>
                          </>
                        ) : (
                          // Estado: Inicial
                          <>
                            <div className="text-6xl mb-4">📸</div>
                            <p className="text-gray-700 font-medium text-lg mb-2">
                              Escanear Cédula de Identidad
                            </p>
                            <p className="text-gray-500 text-sm mb-1">
                              Haz clic para seleccionar una imagen de tu cédula
                            </p>
                            <p className="text-xs text-gray-400 mt-3">
                              💡 Usa el anverso de la cédula con buena iluminación
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Campos Auto-completados */}
                  {hasScanned && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Juan"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={formData.apellido}
                          onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Pérez"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          RUT
                        </label>
                        <input
                          type="text"
                          value={formData.rut}
                          onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="12.345.678-9"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="date"
                          value={formData.fechaNacimiento}
                          onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 2: Finanzas */}
              {currentStep === 2 && (
                <div className="animate-slideInRight">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    💰 Información Financiera
                  </h2>

                  <div className="space-y-6">
                    {/* Ingreso Líquido */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ingreso Líquido Mensual (CLP)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={formData.ingresoLiquido || ''}
                          onChange={(e) => setFormData({ ...formData, ingresoLiquido: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="800.000"
                          min="0"
                          step="10000"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Sueldo líquido después de descuentos
                      </p>
                    </div>

                    {/* Situación Laboral */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Situación Laboral
                      </label>
                      <select
                        value={formData.situacionLaboral}
                        onChange={(e) => setFormData({ ...formData, situacionLaboral: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="INDEFINIDO">Contrato Indefinido</option>
                        <option value="PLAZO_FIJO">Contrato a Plazo Fijo</option>
                        <option value="INDEPENDIENTE">Trabajador Independiente</option>
                        <option value="TEMPORAL">Contrato Temporal</option>
                      </select>
                    </div>

                    {/* Antigüedad Laboral */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Antigüedad Laboral: {Math.floor(formData.antiguedadLaboral / 12)} años {formData.antiguedadLaboral % 12} meses
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        step="6"
                        value={formData.antiguedadLaboral}
                        onChange={(e) => setFormData({ ...formData, antiguedadLaboral: Number(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Nuevo</span>
                        <span>10 años</span>
                      </div>
                    </div>

                    {/* Otras Deudas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Otras Deudas Mensuales (CLP)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={formData.otrasDeudas || ''}
                          onChange={(e) => setFormData({ ...formData, otrasDeudas: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                          min="0"
                          step="10000"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Suma de cuotas mensuales de otras deudas (tarjetas, créditos, etc.)
                      </p>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <label className="flex items-start cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.tieneDeudaMorosa}
                          onChange={(e) => setFormData({ ...formData, tieneDeudaMorosa: e.target.checked })}
                          className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                          <span className="font-medium">Tengo deudas impagas vigentes</span>
                          <span className="block text-xs text-gray-500 mt-1">
                            Registros en DICOM u otros sistemas de información comercial
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.esPropietario}
                          onChange={(e) => setFormData({ ...formData, esPropietario: e.target.checked })}
                          className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                          <span className="font-medium">Soy propietario de bien raíz o vehículo</span>
                        </span>
                      </label>

                      <label className="flex items-start cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.esProfesional}
                          onChange={(e) => setFormData({ ...formData, esProfesional: e.target.checked })}
                          className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                          <span className="font-medium">Poseo título profesional universitario</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Análisis */}
              {currentStep === 3 && (
                <div className="animate-fadeIn">
                  <div className="text-center py-12">
                    <div className="inline-block relative mb-8">
                      <div className="animate-spin rounded-full h-24 w-24 border-8 border-blue-500 border-t-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-3xl">🎯</div>
                      </div>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Analizando tu Solicitud
                    </h2>

                    <p className="text-xl text-blue-600 font-medium mb-8 animate-pulse">
                      {analysisMessage}
                    </p>

                    <div className="max-w-md mx-auto space-y-3 text-left">
                      <div className="flex items-center space-x-3 text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Validación de identidad</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span>Consulta histórica crediticia</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        <span>Cálculo de capacidad de pago</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                        <span>Evaluación de riesgo crediticio</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 4: Veredicto */}
              {currentStep === 4 && riskResult && (
                <div className="animate-slideInRight">
                  {/* Indicador de guardado en BD */}
                  {isSaving && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                      <span className="text-blue-700 font-medium">
                        Guardando solicitud en la base de datos...
                      </span>
                    </div>
                  )}

                  {!isSaving && savedCreditId && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700 font-medium">
                        ✅ Solicitud guardada exitosamente (ID: #{savedCreditId})
                      </span>
                    </div>
                  )}

                  {!isSaving && saveError && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-yellow-800 font-medium mb-1">
                            ⚠️ Nota: Los datos no se guardaron en la base de datos
                          </p>
                          <p className="text-sm text-yellow-700">
                            {saveError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Confetti Effect */}
                  {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-50">
                      {[...Array(50)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute animate-confetti"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `-${Math.random() * 20}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                          }}
                        >
                          🎉
                        </div>
                      ))}
                    </div>
                  )}

                  {/* APROBADO o PREMIUM */}
                  {(riskResult.status === 'APROBADO' || riskResult.status === 'APROBADO_PREMIUM') && (
                    <div className="text-center">
                      <div className="inline-block p-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 animate-bounce">
                        <div className="text-6xl text-white">
                          {riskResult.status === 'APROBADO_PREMIUM' ? '🌟' : '✅'}
                        </div>
                      </div>

                      <h2 className="text-4xl font-bold text-gray-900 mb-3">
                        {riskResult.status === 'APROBADO_PREMIUM' 
                          ? '¡Felicidades! Eres Cliente Premium' 
                          : '¡Crédito Aprobado!'}
                      </h2>

                      <p className="text-xl text-gray-600 mb-8">
                        {riskResult.mensaje}
                      </p>

                      {/* Detalles de Aprobación */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Score</p>
                            <p className="text-2xl font-bold text-green-600">
                              {riskResult.score}/1000
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Monto Aprobado</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ${riskResult.montoAprobado.toLocaleString('es-CL')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Tasa Mensual</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {(riskResult.tasaOfrecida * 100).toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Cuota Mensual</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ${riskResult.cuotaEstimada.toLocaleString('es-CL')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recomendaciones */}
                      {riskResult.recomendaciones.length > 0 && (
                        <div className="text-left mb-8">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            💡 Información Importante:
                          </h3>
                          <ul className="space-y-2">
                            {riskResult.recomendaciones.map((rec, idx) => (
                              <li key={idx} className="flex items-start space-x-2 text-gray-700">
                                <span className="text-green-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Botón Principal */}
                      <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                        📝 Firmar Contrato Digital
                      </button>
                    </div>
                  )}

                  {/* CONDICIONAL */}
                  {riskResult.status === 'CONDICIONAL' && (
                    <div className="text-center">
                      <div className="inline-block p-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mb-6">
                        <div className="text-6xl text-white">⚠️</div>
                      </div>

                      <h2 className="text-4xl font-bold text-gray-900 mb-3">
                        Aprobación Condicional
                      </h2>

                      <p className="text-xl text-gray-600 mb-8">
                        {riskResult.mensaje}
                      </p>

                      {/* Detalles */}
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 mb-8">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Score</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {riskResult.score}/1000
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Monto Ajustado</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ${riskResult.montoAprobado.toLocaleString('es-CL')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Tasa Mensual</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {(riskResult.tasaOfrecida * 100).toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Cuota Estimada</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ${riskResult.cuotaEstimada.toLocaleString('es-CL')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recomendaciones */}
                      <div className="text-left mb-8">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          💡 Recomendaciones:
                        </h3>
                        <ul className="space-y-2">
                          {riskResult.recomendaciones.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-gray-700">
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Botones */}
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={handleRestart}
                          className="bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors"
                        >
                          Revisar Solicitud
                        </button>
                        <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all">
                          Aceptar Oferta
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RECHAZADO */}
                  {riskResult.status === 'RECHAZADO' && (
                    <div className="text-center">
                      <div className="inline-block p-8 bg-gradient-to-br from-red-400 to-pink-400 rounded-full mb-6">
                        <div className="text-6xl text-white">❌</div>
                      </div>

                      <h2 className="text-4xl font-bold text-gray-900 mb-3">
                        Lo sentimos
                      </h2>

                      <p className="text-xl text-gray-600 mb-8">
                        {riskResult.mensaje}
                      </p>

                      {/* Factores de Riesgo */}
                      {riskResult.riskFactors.length > 0 && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
                          <h3 className="font-semibold text-gray-900 mb-4">
                            Razones del Rechazo:
                          </h3>
                          <ul className="space-y-3">
                            {riskResult.riskFactors.map((factor, idx) => (
                              <li key={idx} className="flex items-start space-x-3 text-left">
                                <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {factor.descripcion}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Impacto: {factor.impacto}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recomendaciones */}
                      <div className="text-left mb-8">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          💡 ¿Qué puedo hacer?
                        </h3>
                        <ul className="space-y-2">
                          {riskResult.recomendaciones.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-gray-700">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Botón */}
                      <button
                        onClick={handleRestart}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        🔄 Volver al Inicio
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {currentStep !== 3 && currentStep !== 4 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all
                    ${currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  ← Atrás
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canContinue()}
                  className={`
                    px-8 py-3 rounded-lg font-bold transition-all transform
                    ${canContinue()
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  Continuar →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            🔒 Tus datos están protegidos y encriptados según normativa vigente
          </p>
        </div>
      </div>

      {/* Estilos CSS personalizados */}
      <style>{`
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
      `}</style>
    </div>
  );
};
