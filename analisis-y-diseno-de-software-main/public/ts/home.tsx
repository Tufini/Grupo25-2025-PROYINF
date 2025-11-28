import React, { FormEvent, ReactNode, useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { PublicSimulator } from "./components/PublicSimulator.js";
import { useAuth } from "./store/authStore.js";

// --- Types & Helpers ---

type AuthMode = "login" | "signup" | "forgot-password";

type ToastState = {
  message: string;
  tone: "success" | "info" | "error";
} | null;

const validateRUT = (rut: string): boolean => {
  const cleanRUT = rut.replace(/[.-]/g, '');
  if (cleanRUT.length < 8) return false;
  const body = cleanRUT.slice(0, -1);
  const verifier = cleanRUT.slice(-1).toLowerCase();
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expectedVerifier = 11 - (sum % 11);
  const finalVerifier = expectedVerifier === 11 ? '0' : expectedVerifier === 10 ? 'k' : expectedVerifier.toString();
  return verifier === finalVerifier;
};

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const suggestions: string[] = [];
  if (password.length >= 8) score++; else suggestions.push("Mínimo 8 caracteres");
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++; else suggestions.push("Incluye mayúsculas");
  if (/[a-z]/.test(password)) score++; else suggestions.push("Incluye minúsculas");
  if (/[0-9]/.test(password)) score++; else suggestions.push("Incluye números");
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++; else suggestions.push("Incluye símbolos");

  const maxScore = 6;
  const normalizedScore = Math.min(4, Math.floor((score / maxScore) * 5));
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

  return {
    score: normalizedScore,
    label: labels[normalizedScore] || 'Muy débil',
    color: colors[normalizedScore] || '#ef4444',
    suggestions: suggestions.slice(0, 3)
  };
};

// --- UI Components ---

const Navbar = ({ onLogin, onRegister }: { onLogin: () => void, onRegister: () => void }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">AP</div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Aurora Privé</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">Características</a>
          <a href="#security" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">Seguridad</a>
          <button onClick={onLogin} className="text-sm font-medium text-slate-900 hover:text-indigo-600 transition">Iniciar Sesión</button>
          <button onClick={onRegister} className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
            Registrarse
          </button>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => (
  <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl"></div>
    </div>
    <div className="max-w-7xl mx-auto px-6 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-8 border border-indigo-100">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        Nueva Banca Digital v2.0
      </div>
      <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
        Tu futuro financiero <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">reimaginado.</span>
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
        Gestiona tus créditos, simula préstamos y controla tus finanzas con la plataforma más avanzada y segura del mercado. Sin filas, sin papeleo.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onClick={onGetStarted} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20">
          Comenzar ahora
        </button>
        <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold text-lg hover:bg-slate-50 transition">
          Ver demostración
        </button>
      </div>
    </div>
  </section>
);

const Features = () => (
  <section id="features" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Todo lo que necesitas</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">Una suite completa de herramientas financieras diseñadas para darte el control total.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: "⚡", title: "Rápido y Simple", desc: "Solicitudes aprobadas en minutos con nuestra IA de evaluación de riesgo." },
          { icon: "🛡️", title: "Seguridad Total", desc: "Encriptación de grado militar y autenticación biométrica para proteger tus activos." },
          { icon: "📱", title: "100% Digital", desc: "Olvídate de las sucursales. Gestiona todo desde tu dispositivo, donde sea." }
        ].map((f, i) => (
          <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition duration-300">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm mb-6">{f.icon}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
            <p className="text-slate-600 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const InputField = ({ label, type, name, placeholder, required, error, success, helperText, onChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <div className="relative">
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-100' : success ? 'border-green-300 focus:ring-green-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
          }`}
      />
      {error && <span className="absolute right-3 top-3 text-red-500">✕</span>}
      {success && <span className="absolute right-3 top-3 text-green-500">✓</span>}
    </div>
    {helperText && <p className={`text-xs ${error ? 'text-red-500' : 'text-slate-500'}`}>{helperText}</p>}
  </div>
);

const AuthPanel = ({ mode, onModeChange, onSubmit }: any) => {
  const [formValues, setFormValues] = useState({ fullName: '', rut: '', email: '', password: '' });
  const [validations, setValidations] = useState({ rut: false, email: false, password: false });

  const handleFieldChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    if (field === 'rut') setValidations(prev => ({ ...prev, rut: validateRUT(value) }));
    if (field === 'email') setValidations(prev => ({ ...prev, email: validateEmail(value) }));
    if (field === 'password') {
      const strength = calculatePasswordStrength(value);
      setValidations(prev => ({ ...prev, password: strength.score >= 2 }));
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          {mode === 'login' ? 'Bienvenido de nuevo' : mode === 'signup' ? 'Crea tu cuenta' : 'Recuperar acceso'}
        </h3>
        <p className="text-slate-500">
          {mode === 'login' ? 'Ingresa a tu banca digital.' : mode === 'signup' ? 'Comienza tu viaje financiero hoy.' : 'Te enviaremos instrucciones.'}
        </p>
      </div>

      <form onSubmit={(e) => onSubmit(mode, e)} className="space-y-5">
        {mode === 'signup' && (
          <>
            <InputField label="Nombre Completo" type="text" name="fullName" placeholder="Juan Pérez" required onChange={(v: string) => handleFieldChange('fullName', v)} />
            <InputField label="RUT" type="text" name="rut" placeholder="12.345.678-9" required error={formValues.rut && !validations.rut} success={validations.rut} helperText={formValues.rut && !validations.rut ? "RUT inválido" : ""} onChange={(v: string) => handleFieldChange('rut', v)} />
          </>
        )}

        <InputField label="Correo Electrónico" type="email" name="email" placeholder="juan@ejemplo.com" required error={formValues.email && !validations.email} success={validations.email} onChange={(v: string) => handleFieldChange('email', v)} />

        {mode !== 'forgot-password' && (
          <InputField label="Contraseña" type="password" name="password" placeholder="••••••••" required onChange={(v: string) => handleFieldChange('password', v)} />
        )}

        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20">
          {mode === 'login' ? 'Ingresar' : mode === 'signup' ? 'Crear Cuenta' : 'Enviar Instrucciones'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        {mode === 'login' ? (
          <>
            <button onClick={() => onModeChange('forgot-password')} className="text-slate-500 hover:text-indigo-600">¿Olvidaste tu contraseña?</button>
            <button onClick={() => onModeChange('signup')} className="font-semibold text-indigo-600 hover:text-indigo-700">Crear cuenta</button>
          </>
        ) : (
          <button onClick={() => onModeChange('login')} className="w-full text-center text-slate-500 hover:text-indigo-600">Volver al inicio de sesión</button>
        )}
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-slate-400 py-12">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
      <div className="col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">AP</div>
          <span className="text-lg font-bold text-white">Aurora Privé</span>
        </div>
        <p className="max-w-xs text-sm">La banca del futuro, hoy. Segura, rápida y diseñada para ti.</p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Producto</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-white transition">Créditos</a></li>
          <li><a href="#" className="hover:text-white transition">Cuentas</a></li>
          <li><a href="#" className="hover:text-white transition">Inversiones</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Legal</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-white transition">Términos</a></li>
          <li><a href="#" className="hover:text-white transition">Privacidad</a></li>
          <li><a href="#" className="hover:text-white transition">Seguridad</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-xs text-center">
      © 2025 Aurora Privé Bank. Todos los derechos reservados.
    </div>
  </footer>
);

const App = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const { login, register } = useAuth();

  const handleAuthSubmit = async (mode: AuthMode, e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email")?.toString() || "";
    const password = form.get("password")?.toString() || "";

    try {
      if (mode === "login") {
        await login(email, password);
        window.location.href = '/dashboard';
      } else if (mode === "signup") {
        const fullName = form.get("fullName")?.toString() || "";
        const [nombre, ...rest] = fullName.split(" ");
        await register({
          email, password, nombre, apellido: rest.join(" ") || nombre,
          rut: form.get("rut")?.toString() || "",
          telefono: ""
        });
        window.location.href = '/dashboard';
      }
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
  };

  const scrollToAuth = () => {
    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar onLogin={() => { setAuthMode('login'); scrollToAuth(); }} onRegister={() => { setAuthMode('signup'); scrollToAuth(); }} />
      <Hero onGetStarted={() => { setAuthMode('signup'); scrollToAuth(); }} />
      <Features />

      <section id="auth-section" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Simula tu crédito ideal</h2>
                <p className="text-slate-600">Calcula cuotas, intereses y plazos en tiempo real. Sin compromisos.</p>
              </div>
              <PublicSimulator onRequestLoan={() => { setAuthMode('signup'); scrollToAuth(); }} />
            </div>
            <div className="lg:mt-0 mt-12">
              <AuthPanel mode={authMode} onModeChange={setAuthMode} onSubmit={handleAuthSubmit} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
