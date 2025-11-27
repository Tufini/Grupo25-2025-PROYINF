import React, { FormEvent, ReactNode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { PublicSimulator } from "./components/PublicSimulator.js";
import { ConversionModal } from "./components/ConversionModal.js";
import { useAuth } from "./store/authStore.js";


type AuthMode = "login" | "signup" | "forgot-password";

type ToastState = {
  message: string;
  tone: "success" | "info" | "error";
} | null;

// Validaciones
const validateRUT = (rut: string): boolean => {
  // Limpiar RUT
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const suggestions: string[] = [];

  // Longitud
  if (password.length >= 8) score++;
  else suggestions.push("Mínimo 8 caracteres");

  if (password.length >= 12) score++;

  // Mayúsculas
  if (/[A-Z]/.test(password)) score++;
  else suggestions.push("Incluye mayúsculas");

  // Minúsculas
  if (/[a-z]/.test(password)) score++;
  else suggestions.push("Incluye minúsculas");

  // Números
  if (/[0-9]/.test(password)) score++;
  else suggestions.push("Incluye números");

  // Caracteres especiales
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else suggestions.push("Incluye símbolos (!@#$...)");

  // No patrones comunes
  const commonPatterns = ['123', 'abc', 'password', 'qwerty'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 2);
    suggestions.push("Evita patrones comunes");
  }

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

const navLinks = [
  { href: "#simulador", label: "Simulador" },
  { href: "#acceso", label: "Acceso" },
  { href: "#respaldo", label: "Respaldo" },
];

const stats = [
  { icon: "⚡", value: "Instantáneo", label: "Aprobación automática" },
  { icon: "🔒", value: "Banco-nivel", label: "Seguridad certificada" },
  { icon: "📊", value: "Transparente", label: "Sin costos ocultos" },
];

const assurances = [
  { title: "Decisiones instantáneas", caption: "IA avanzada evalúa tu solicitud en tiempo real sin esperas." },
  { title: "Seguridad bancaria", caption: "Encriptación de nivel bancario y cumplimiento regulatorio total." },
  { title: "Transparencia radical", caption: "Cero letra chica. Todos los costos visibles desde el inicio." },
];

const authCopy: Record<AuthMode, { title: string; hint: string; cta: string }> = {
  signup: {
    title: "Abre tu acceso",
    hint: "Consolida tus créditos en Aurora Privé.",
    cta: "Crear cuenta",
  },
  login: {
    title: "Bienvenido",
    hint: "Ingresa a tu portafolio seguro.",
    cta: "Continuar",
  },
  "forgot-password": {
    title: "Recuperar contraseña",
    hint: "Te ayudaremos a recuperar el acceso.",
    cta: "Enviar instrucciones",
  },
};

const OutlineButton = ({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-full border border-slate-300/70 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 ${className}`.trim()}
  >
    {children}
  </button>
);

const PrimaryButton = ({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-700 ${className}`.trim()}
  >
    {children}
  </button>
);

const InputField = ({
  label,
  type,
  name,
  placeholder,
  autoComplete,
  required = false,
  error,
  success,
  helperText,
  onChange,
}: {
  label: string;
  type: string;
  name: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  error?: boolean;
  success?: boolean;
  helperText?: string;
  onChange?: (value: string) => void;
}) => {
  const borderColor = error
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
    : success
      ? 'border-green-400 focus:border-green-500 focus:ring-green-500/10'
      : 'border-white/40 focus:border-slate-900 focus:ring-slate-900/10';

  return (
    <label className="grid gap-1 text-left">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <div className="relative">
        <input
          className={`w-full rounded-xl border bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 shadow-inner shadow-white/70 outline-none transition focus:bg-white focus:ring ${borderColor}`}
          type={type}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {error && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        {success && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {helperText && (
        <span className={`text-xs ${error ? 'text-red-600' : success ? 'text-green-600' : 'text-slate-500'}`}>
          {helperText}
        </span>
      )}
    </label>
  );
};

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const widthPercentage = ((strength.score + 1) / 5) * 100;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Seguridad:</span>
        <span className="text-xs font-semibold" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${widthPercentage}%`,
            backgroundColor: strength.color
          }}
        />
      </div>

      {strength.suggestions.length > 0 && (
        <ul className="text-xs text-slate-600 space-y-1">
          {strength.suggestions.map((suggestion, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AuthPanel = ({
  mode,
  onModeChange,
  onSubmit,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (mode: AuthMode, event: FormEvent<HTMLFormElement>) => void;
}) => {
  const [formValues, setFormValues] = useState({
    fullName: '',
    rut: '',
    email: '',
    telefono: '',
    password: '',
  });

  const [validations, setValidations] = useState({
    rut: { valid: false, checked: false },
    email: { valid: false, checked: false },
    password: { valid: false, checked: false },
  });

  const [loginAttempts, setLoginAttempts] = useState(0);

  const handleFieldChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));

    // Validar en tiempo real
    if (field === 'rut' && value) {
      const isValid = validateRUT(value);
      setValidations(prev => ({ ...prev, rut: { valid: isValid, checked: true } }));
    }

    if (field === 'email' && value) {
      const isValid = validateEmail(value);
      setValidations(prev => ({ ...prev, email: { valid: isValid, checked: true } }));
    }

    if (field === 'password' && value) {
      const strength = calculatePasswordStrength(value);
      setValidations(prev => ({ ...prev, password: { valid: strength.score >= 2, checked: true } }));
    }
  };

  const fields = useMemo(() => {
    if (mode === "forgot-password") {
      return (
        <>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              Ingresa tu correo electrónico y te enviaremos instrucciones para recuperar tu contraseña.
            </p>
          </div>
          <InputField
            label="Correo electrónico"
            type="email"
            name="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            required
            onChange={(value) => handleFieldChange('email', value)}
            success={validations.email.checked && validations.email.valid}
            error={validations.email.checked && !validations.email.valid}
            helperText={validations.email.checked && !validations.email.valid ? "Correo inválido" : undefined}
          />
        </>
      );
    }

    if (mode === "signup") {
      return (
        <>
          <InputField
            label="Nombre completo"
            type="text"
            name="fullName"
            placeholder="Sofía Ramírez González"
            autoComplete="name"
            required
            onChange={(value) => handleFieldChange('fullName', value)}
          />
          <InputField
            label="RUT"
            type="text"
            name="rut"
            placeholder="12.345.678-9"
            required
            onChange={(value) => handleFieldChange('rut', value)}
            success={validations.rut.checked && validations.rut.valid}
            error={validations.rut.checked && !validations.rut.valid}
            helperText={validations.rut.checked && !validations.rut.valid ? "RUT inválido" : undefined}
          />
          <InputField
            label="Correo"
            type="email"
            name="email"
            placeholder="sofia@correo.com"
            autoComplete="email"
            required
            onChange={(value) => handleFieldChange('email', value)}
            success={validations.email.checked && validations.email.valid}
            error={validations.email.checked && !validations.email.valid}
            helperText={validations.email.checked && !validations.email.valid ? "Correo inválido" : undefined}
          />
          <InputField
            label="Teléfono (opcional)"
            type="tel"
            name="telefono"
            placeholder="+56912345678"
            autoComplete="tel"
            onChange={(value) => handleFieldChange('telefono', value)}
          />
          <div>
            <InputField
              label="Contraseña"
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              onChange={(value) => handleFieldChange('password', value)}
            />
            <PasswordStrengthMeter password={formValues.password} />
          </div>
        </>
      );
    }

    return (
      <>
        <InputField
          label="Correo"
          type="email"
          name="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
          onChange={(value) => handleFieldChange('email', value)}
        />
        <InputField
          label="Contraseña"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          onChange={(value) => handleFieldChange('password', value)}
        />

        {loginAttempts >= 2 && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => onModeChange("forgot-password")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
      </>
    );
  }, [mode, formValues, validations, loginAttempts]);

  const copy = mode === "forgot-password"
    ? authCopy["forgot-password"]
    : authCopy[mode === "signup" ? "signup" : "login"];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (mode === "login") {
      setLoginAttempts(prev => prev + 1);
    }
    onSubmit(mode, e);
  };

  return (
    <section id="acceso" className="relative isolate overflow-hidden rounded-xl bg-white/75 p-5 shadow-lg ring-1 ring-white/60 backdrop-blur">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.15),_rgba(15,23,42,0.05))]" />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{copy.title}</h2>
          <p className="text-xs text-slate-500">{copy.hint}</p>
        </div>
        {mode !== "forgot-password" && (
          <div className="flex gap-1 rounded-full bg-slate-900/5 p-0.5">
            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${mode === "signup" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Nuevo
            </button>
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${mode === "login" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Cliente
            </button>
          </div>
        )}
      </div>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        {fields}
        <PrimaryButton className="mt-1 w-full" type="submit">
          {copy.cta}
        </PrimaryButton>

        {mode === "forgot-password" && (
          <button
            type="button"
            onClick={() => onModeChange("login")}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            ← Volver al inicio de sesión
          </button>
        )}
      </form>
      <p className="mt-3 text-center text-[0.65rem] text-slate-400">Al continuar aceptas el acuerdo de servicio.</p>
    </section>
  );
};
const Toast = ({ state, onClose }: { state: ToastState; onClose: () => void }) => {
  if (!state) return null;
  const toneStyles =
    state.tone === "success"
      ? "bg-emerald-500 text-white shadow-emerald-600/40"
      : state.tone === "error"
        ? "bg-red-500 text-white shadow-red-600/40"
        : "bg-slate-900 text-white shadow-slate-900/30";
  return (
    <div className={`pointer-events-auto fixed inset-x-0 top-6 z-50 mx-auto w-fit rounded-full px-5 py-3 text-sm font-medium shadow-lg ${toneStyles}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/70" />
        <span>{state.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/80 transition hover:bg-white/30"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

const App = () => {
  console.log("App component is rendering");

  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [toast, setToast] = useState<ToastState>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const { login, register } = useAuth();

  console.log("Rendering AuthPanel with authMode:", authMode);
  console.log("Rendering PublicSimulator");

  const handleSubmit = async (mode: AuthMode, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted with mode:", mode);
    const form = new FormData(event.currentTarget);
    const email = form.get("email")?.toString() || "";
    const password = form.get("password")?.toString() || "";

    try {
      if (mode === "forgot-password") {
        console.log("Forgot password flow");
        setToast({
          tone: "success",
          message: `Instrucciones enviadas a ${email}. Revisa tu bandeja de entrada.`
        });
        setTimeout(() => {
          setAuthMode("login");
          setToast(null);
        }, 3000);
        return;
      }

      if (mode === "login") {
        console.log("Login flow");
        await login(email, password);

        setToast({
          tone: "success",
          message: "Inicio de sesión exitoso. Redirigiendo..."
        });

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);

        return;
      } else {
        console.log("Signup flow");
        const fullName = form.get("fullName")?.toString() || "";
        const [nombre, ...apellidoParts] = fullName.split(" ");
        const apellido = apellidoParts.join(" ") || nombre;
        const rut = form.get("rut")?.toString() || "";
        const telefono = form.get("telefono")?.toString();

        await register({
          email,
          password,
          nombre,
          apellido,
          rut,
          telefono
        });

        setToast({
          tone: "success",
          message: `Cuenta creada para ${nombre}. Redirigiendo al dashboard...`
        });

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error during form submission:", error);
      setToast({
        tone: "error",
        message: error.message || "Error al procesar la solicitud"
      });

      setTimeout(() => {
        setToast(null);
      }, 3600);
    }

    setShowConversionModal(false);
  };

  console.log("Rendering App with authMode:", authMode);

  return (
    <div className="relative min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 border-b border-slate-200">
        <a href="#" className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <span className="text-sm font-bold text-white">AP</span>
          </div>
          Aurora Privé
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-20 pt-6">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <AuthPanel mode={authMode} onModeChange={setAuthMode} onSubmit={handleSubmit} />
          <PublicSimulator onRequestLoan={() => { }} />
        </section>
      </main>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
