const authPanels = document.getElementById('auth-panels');
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const toastElement = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const currentYearElement = document.getElementById('copyright-year');

type AuthMode = 'login' | 'signup';

let activeAuthMode: AuthMode = 'login';
let toastTimeout: number | undefined;

const authCopies: Record<AuthMode, { title: string; subtitle: string; cta: string }> = {
  login: {
    title: 'Bienvenido de vuelta',
    subtitle: 'Accede a tu panel financiero para continuar administrando tus préstamos.',
    cta: 'Iniciar sesión',
  },
  signup: {
    title: 'Crea tu cuenta',
    subtitle: 'Regístrate en minutos para simular, solicitar y gestionar créditos inteligentes.',
    cta: 'Crear cuenta',
  },
};

const buildInput = (options: {
  id: string;
  label: string;
  type?: string;
  autocomplete?: string;
  placeholder?: string;
}) => {
  const inputType = options.type ?? 'text';
  const field = document.createElement('label');
  field.className = 'grid gap-2 text-sm font-medium text-slate-600';
  field.htmlFor = options.id;

  const span = document.createElement('span');
  span.textContent = options.label;
  span.className = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  const input = document.createElement('input');
  input.id = options.id;
  input.name = options.id;
  input.type = inputType;
  input.placeholder = options.placeholder ?? '';
  input.setAttribute('autocomplete', options.autocomplete ?? 'off');
  input.required = true;
  input.className = 'w-full rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

  field.append(span, input);
  return field;
};

const buildAuthForm = (mode: AuthMode): HTMLFormElement => {
  const form = document.createElement('form');
  form.id = `${mode}-form`;
  form.className = 'grid gap-4';
  form.setAttribute('aria-label', mode === 'login' ? 'Formulario de inicio de sesión' : 'Formulario de registro');

  const controls: HTMLLabelElement[] = [];

  if (mode === 'signup') {
    controls.push(
      buildInput({
        id: 'fullName',
        label: 'Nombre completo',
        placeholder: 'Camila González',
        autocomplete: 'name',
      }),
    );
  }

  controls.push(
    buildInput({
      id: 'email',
      label: 'Correo electrónico',
      type: 'email',
      placeholder: 'tu@email.com',
      autocomplete: 'email',
    }),
  );

  controls.push(
    buildInput({
      id: 'password',
      label: 'Contraseña',
      type: 'password',
      placeholder: '••••••••',
      autocomplete: mode === 'login' ? 'current-password' : 'new-password',
    }),
  );

  if (mode === 'signup') {
    const termsWrapper = document.createElement('label');
    termsWrapper.className = 'flex items-start gap-3 text-xs text-slate-500';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.required = true;
    checkbox.className = 'mt-1 h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-300';

    const text = document.createElement('span');
    text.innerHTML =
      'Acepto recibir comunicaciones relevantes y confirmo que he leído la política de privacidad.';

    termsWrapper.append(checkbox, text);
    form.append(...controls, termsWrapper);
  } else {
    const rememberWrapper = document.createElement('label');
    rememberWrapper.className = 'flex items-center justify-between text-xs text-slate-500';

    const rememberBox = document.createElement('label');
    rememberBox.className = 'flex items-center gap-2';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-300';

    const rememberText = document.createElement('span');
    rememberText.textContent = 'Recordar acceso seguro';

    rememberBox.append(checkbox, rememberText);

    const recoveryLink = document.createElement('a');
    recoveryLink.href = '#';
    recoveryLink.className = 'font-semibold text-indigo-500 hover:text-indigo-400';
    recoveryLink.textContent = '¿Olvidaste tu contraseña?';

    rememberWrapper.append(rememberBox, recoveryLink);
    form.append(...controls, rememberWrapper);
  }

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'group flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500';
  submitButton.innerHTML = `
    <span>${authCopies[mode].cta}</span>
    <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  `;

  form.append(submitButton);
  return form;
};

const renderAuthPanels = (mode: AuthMode) => {
  if (!authPanels) return;
  authPanels.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between';

  const copyGroup = document.createElement('div');
  copyGroup.className = 'space-y-1';

  const title = document.createElement('h3');
  title.className = 'text-lg font-semibold text-slate-900';
  title.textContent = authCopies[mode].title;

  const subtitle = document.createElement('p');
  subtitle.className = 'text-sm text-slate-500';
  subtitle.textContent = authCopies[mode].subtitle;

  copyGroup.append(title, subtitle);

  const modeSwitcher = document.createElement('div');
  modeSwitcher.className = 'rounded-full border border-slate-200/80 bg-white/70 p-1 text-xs font-semibold text-slate-500 shadow-inner shadow-slate-900/5';

  (['login', 'signup'] as AuthMode[]).forEach((authMode) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mode = authMode;
    button.textContent = authMode === 'login' ? 'Ingresar' : 'Registrarme';
    button.className = `rounded-full px-4 py-1.5 transition ${
      authMode === mode
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
        : 'text-slate-500 hover:text-indigo-500'
    }`;
    button.addEventListener('click', () => setActiveAuthMode(authMode));
    modeSwitcher.appendChild(button);
  });

  header.append(copyGroup, modeSwitcher);
  authPanels.append(header, buildAuthForm(mode));

  const form = document.getElementById(`${mode}-form`) as HTMLFormElement | null;
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    if (!email) {
      showToast('Por favor ingresa un correo válido.');
      return;
    }

    showToast(
      mode === 'login'
        ? 'Inicio de sesión simulado. Pronto podrás acceder a tu panel.'
        : 'Registro simulado con éxito. Te daremos la bienvenida muy pronto!',
    );
    form.reset();
  });
};

const showToast = (message: string) => {
  if (!toastElement || !toastMessage) return;
  toastMessage.textContent = message;
  toastElement.classList.remove('hidden');
  toastElement.classList.add('flex');

  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
  }

  toastTimeout = window.setTimeout(() => {
    toastElement.classList.add('hidden');
    toastElement.classList.remove('flex');
  }, 3600);
};

const setActiveAuthMode = (mode: AuthMode) => {
  activeAuthMode = mode;
  renderAuthPanels(mode);
};

const initialiseMobileMenu = () => {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.addEventListener('click', () => {
    const isHidden = mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    menuToggle.setAttribute('aria-expanded', String(isHidden));
  });
};

const initialiseFaqAccordion = () => {
  const faqItems = document.querySelectorAll<HTMLElement>('#faq-list .faq-item');
  faqItems.forEach((item) => {
    const button = item.querySelector('button');
    const content = item.querySelector('div:last-of-type');
    const icon = item.querySelector('svg');

    if (!button || !content || !icon) return;

    content.classList.add('hidden');
    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      content.classList.toggle('hidden');
      icon.classList.toggle('rotate-180');
    });
  });
};

const initialiseAuthTriggers = () => {
  const triggers = document.querySelectorAll<HTMLButtonElement>('[data-auth]');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const mode = trigger.dataset.auth as AuthMode | undefined;
      if (!mode) return;
      setActiveAuthMode(mode);
      toastElement?.classList.add('hidden');
      toastElement?.classList.remove('flex');
      const panel = authPanels?.getBoundingClientRect();
      if (!panel) return;
      window.scrollTo({ top: window.scrollY + panel.top - 120, behavior: 'smooth' });
    });
  });
};

const initialiseFooterYear = () => {
  if (!currentYearElement) return;
  currentYearElement.textContent = String(new Date().getFullYear());
};

const init = () => {
  initialiseMobileMenu();
  initialiseFaqAccordion();
  initialiseAuthTriggers();
  initialiseFooterYear();
  setActiveAuthMode(activeAuthMode);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
