import { FormEvent, ReactNode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";


type AuthMode = "login" | "signup";

type ToastState = {
  message: string;
  tone: "success" | "info";
} | null;

const navLinks = [
  { href: "#acceso", label: "Acceso" },
  { href: "#respaldo", label: "Respaldo" },
];

const stats = [
  { value: "12", label: "Años diseñando patrimonio" },
  { value: "98%", label: "Clientes renuevan" },
  { value: "$320M", label: "Activos privados" },
];

const assurances = [
  { title: "Gobierno serio", caption: "Comités de riesgo y auditoría continua." },
  { title: "Custodia blindada", caption: "Infraestructura certificada y cifrado integral." },
  { title: "Equipo privado", caption: "Asesores senior para decisiones sensibles." },
];

const authCopy: Record<AuthMode, { title: string; hint: string; cta: string }> = {
  signup: {
    title: "Abre tu acceso",
    hint: "Consolida tus créditos en UsmBank.",
    cta: "Crear cuenta",
  },
  login: {
    title: "Bienvenido",
    hint: "Ingresa a tu portafolio seguro.",
    cta: "Continuar",
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
}: {
  label: string;
  type: string;
  name: string;
  placeholder: string;
  autoComplete?: string;
}) => (
  <label className="grid gap-1 text-left">
    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</span>
    <input
      className="w-full rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 shadow-inner shadow-white/70 outline-none transition focus:border-slate-900 focus:bg-white focus:ring focus:ring-slate-900/10"
      type={type}
      name={name}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required
    />
  </label>
);

const AuthPanel = ({
  mode,
  onModeChange,
  onSubmit,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (mode: AuthMode, event: FormEvent<HTMLFormElement>) => void;
}) => {
  const fields = useMemo(() => {
    if (mode === "signup") {
      return (
        <>
          <InputField
            label="Nombre"
            type="text"
            name="fullName"
            placeholder="Sofía Ramírez"
            autoComplete="name"
          />
          <InputField
            label="Correo"
            type="email"
            name="email"
            placeholder="sofia@usmbank.com"
            autoComplete="email"
          />
          <InputField
            label="Contraseña"
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </>
      );
    }
    return (
      <>
        <InputField
          label="Correo"
          type="email"
          name="email"
          placeholder="tu@usmbank.com"
          autoComplete="email"
        />
        <InputField
          label="Contraseña"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </>
    );
  }, [mode]);

  const copy = authCopy[mode];

  return (
    <section id="acceso" className="relative isolate overflow-hidden rounded-[2rem] bg-white/75 p-8 shadow-xl shadow-slate-900/10 ring-1 ring-white/60 backdrop-blur">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_rgba(15,23,42,0.08))]" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">
            {mode === "signup" ? "Alta" : "Ingreso"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{copy.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{copy.hint}</p>
        </div>
        <div className="flex gap-2 rounded-full bg-slate-900/5 p-1">
          <button
            type="button"
            onClick={() => onModeChange("signup")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              mode === "signup" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Registro
          </button>
          <button
            type="button"
            onClick={() => onModeChange("login")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              mode === "login" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Ingreso
          </button>
        </div>
      </div>
      <form className="mt-6 grid gap-5" onSubmit={(event: FormEvent<HTMLFormElement>) => onSubmit(mode, event)}>
        {fields}
        <PrimaryButton className="mt-2 w-full" type="submit">
          {copy.cta}
        </PrimaryButton>
      </form>
      <p className="mt-5 text-center text-xs text-slate-400">Al continuar aceptas el acuerdo de servicio.</p>
    </section>
  );
};

const Toast = ({ state, onClose }: { state: ToastState; onClose: () => void }) => {
  if (!state) return null;
  const toneStyles =
    state.tone === "success"
      ? "bg-emerald-500 text-white shadow-emerald-600/40"
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
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [toast, setToast] = useState<ToastState>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSubmit = (mode: AuthMode, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("fullName")?.toString();
    const email = form.get("email")?.toString();

    setToast({
      tone: mode === "signup" ? "success" : "info",
      message: mode === "signup" ? `Cuenta activada para ${name ?? email ?? "nuevo cliente"}` : `Bienvenido de nuevo, ${email ?? "cliente"}`,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3600);
  };

  return (
    <div className="relative min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(15,23,42,0.09),_rgba(15,23,42,0))]" />
        <div className="absolute right-[10%] top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(30,64,175,0.22),_rgba(30,64,175,0))]" />
        <div className="absolute left-[8%] bottom-14 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(14,116,144,0.22),_rgba(14,116,144,0))]" />
      </div>

      <Toast state={toast} onClose={() => setToast(null)} />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <a href="#" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">UB</span>
          UsmBank
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-slate-900">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden gap-3 md:flex">
          <OutlineButton onClick={() => setAuthMode("login")}>Iniciar sesión</OutlineButton>
          <PrimaryButton onClick={() => setAuthMode("signup")}>Abrir cuenta</PrimaryButton>
        </div>
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Alternar navegación"
        >
          <span className="block h-0.5 w-6 bg-slate-900" />
          <span className="mt-1 block h-0.5 w-6 bg-slate-900" />
          <span className="mt-1 block h-0.5 w-6 bg-slate-900" />
        </button>
      </header>

      {mobileOpen ? (
        <div className="mx-6 mb-6 rounded-3xl border border-slate-200/60 bg-white/90 p-6 text-sm text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur md:hidden">
          <nav className="grid gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-medium text-slate-700"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-6 grid gap-3">
            <OutlineButton className="w-full" onClick={() => setAuthMode("login")}>Iniciar sesión</OutlineButton>
            <PrimaryButton className="w-full" onClick={() => setAuthMode("signup")}>Abrir cuenta</PrimaryButton>
          </div>
        </div>
      ) : null}

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24">
        <section className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div className="flex flex-col gap-10">
            <div className="max-w-xl space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-white/60 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                UsmBank
                <span className="h-1 w-1 rounded-full bg-slate-400" />
                Banca confidencial
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Crédito inteligente con criterio privado
              </h1>
              <p className="text-base text-slate-600">
                Experimenta una plataforma diseñada para ejecutivos que priorizan control, transparencia y confianza.
              </p>
              <div className="flex flex-wrap items-center gap-3">
              </div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/50 bg-white/70 px-5 py-4 shadow-sm shadow-white/50 backdrop-blur">
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{item.label}</dt>
                  <dd className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <AuthPanel mode={authMode} onModeChange={setAuthMode} onSubmit={handleSubmit} />
        </section>


      </main>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
