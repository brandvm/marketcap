// Plans gate (development template › Plans): email + PIN access, checked by
// the Plans access Apps Script (integrations/plans-access/). No PIN ships in
// this bundle.
//   · Login: an email field and four PIN boxes. Typing the fourth digit sends
//     email + PIN; the script answers with a signed token (30 days by
//     default), kept in localStorage, so the device stays unlocked.
//   · A remembered device is checked again on every page view: the script
//     logs the view (email, page title, URL) and refuses revoked emails.
//   · No PIN: "Request a PIN" swaps in a short form (name, email, company).
//     The script logs it and emails the client an Approve button; an email
//     that is already approved just gets its PIN again.
//   · Until unlocked, repo CSS hides [data-gate-content] on the published
//     site (the canvas shows everything), and the images inside lose their
//     src/srcset/sizes, kept only in memory, so they aren't in the DOM.
//     The images still come from the CMS, so this keeps casual visitors out;
//     it isn't encryption.
//   · Unlocking restores the images, adds .is-unlocked, re-measures the
//     slider and ScrollTrigger, and moves focus to the section.
// Markup: <section data-gate="plans" data-gate-endpoint="<web app URL>">
//   [data-gate-panel] (Gate Stage: blurred dummy slider + the panel)
//     login view, each element marked [data-gate-login]: the title and
//       text, input[data-gate-email], [data-gate-digits] with four
//       input[data-gate-digit], [data-gate-error], button[data-gate-view="request"]
//     request view, each element marked [data-gate-request]: the title and
//       text, input[data-gate-field="name|email|company|website"] (website
//       is a hidden honeypot), button[data-gate-submit], [data-gate-status],
//       button[data-gate-view="login"]
//     (the elements sit directly in Gate Panel, so its gap spaces them)
//   the gated parts carry [data-gate-content].
// Messages can be reworded in Webflow with data-msg-<reason> attributes on
// [data-gate-error] / [data-gate-status]; the defaults are below.
import { ScrollTrigger, reducedMotion } from './gsap';

const IMAGE_ATTRS = ['src', 'srcset', 'sizes'] as const;
const STORE = 'mc-plans-access';
const TIMEOUT = 15000;

const MESSAGES: Record<string, string> = {
  wrong: "That email and PIN don't match. Check both and try again.",
  email: 'Enter the email address your PIN was sent to first.',
  pending: "Your request is waiting for approval. We'll email your PIN as soon as it's approved.",
  locked: 'Too many tries. Please wait 15 minutes, or request your PIN again.',
  offline: "We couldn't check your PIN just now. Please try again.",
  requested: "Thanks. We'll email your PIN as soon as your request is approved.",
  sent: 'Your PIN is on its way to {email}.',
  wait: 'Your request has just been sent. Please check your inbox.',
  invalid: 'Please enter a valid email address.',
  missing: 'Please enter your name and email.',
};

type Stored = { token: string; email: string };

function readStore(): Stored | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function writeStore(value: Stored | null) {
  try {
    if (value) localStorage.setItem(STORE, JSON.stringify(value));
    else localStorage.removeItem(STORE);
  } catch {
    /* private mode: the gate just asks again next time */
  }
}

const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

/** POST JSON as text/plain: Apps Script web apps don't answer a CORS preflight. */
async function call(endpoint: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        title: document.title,
        url: location.href,
        ua: navigator.userAgent,
      }),
      signal: controller.signal,
    });
    return (await response.json()) as Record<string, string | boolean>;
  } finally {
    window.clearTimeout(timer);
  }
}

export function initPlansGate() {
  document.querySelectorAll<HTMLElement>('[data-gate]').forEach((gate) => {
    const endpoint = gate.getAttribute('data-gate-endpoint')?.trim() ?? '';
    const emailInput = gate.querySelector<HTMLInputElement>('[data-gate-email]');
    const digits = Array.from(gate.querySelectorAll<HTMLInputElement>('[data-gate-digit]'));
    const row = gate.querySelector<HTMLElement>('[data-gate-digits]');
    const error = gate.querySelector<HTMLElement>('[data-gate-error]');
    const status = gate.querySelector<HTMLElement>('[data-gate-status]');
    const field = (name: string) => gate.querySelector<HTMLInputElement>(`[data-gate-field="${name}"]`);
    const submit = gate.querySelector<HTMLButtonElement>('[data-gate-submit]');
    const stash = new Map<HTMLImageElement, Partial<Record<(typeof IMAGE_ATTRS)[number], string>>>();

    const message = (el: HTMLElement | null, reason: string, email = '') =>
      (el?.getAttribute(`data-msg-${reason}`) ?? MESSAGES[reason] ?? MESSAGES.offline).replace('{email}', email);

    const showError = (reason: string | null) => {
      if (!error) return;
      if (reason) error.textContent = message(error, reason);
      error.classList.toggle('is-shown', Boolean(reason));
    };
    const showStatus = (reason: string | null, email = '') => {
      if (!status) return;
      status.textContent = reason ? message(status, reason, email) : '';
      status.classList.toggle('is-shown', Boolean(reason));
    };

    const unlock = (focus = true) => {
      stash.forEach((attrs, img) => {
        IMAGE_ATTRS.forEach((name) => {
          const value = attrs[name];
          if (value != null) img.setAttribute(name, value);
        });
      });
      stash.clear();
      gate.classList.remove('is-requesting', 'is-checking');
      gate.classList.add('is-unlocked');
      // The slider measures on resize; ScrollTrigger and Lenis need the new height.
      window.dispatchEvent(new Event('resize'));
      ScrollTrigger.refresh();
      if (focus) {
        gate.setAttribute('tabindex', '-1');
        gate.focus({ preventScroll: true });
      }
    };

    gate.querySelectorAll<HTMLImageElement>('[data-gate-content] img').forEach((img) => {
      const attrs: Partial<Record<(typeof IMAGE_ATTRS)[number], string>> = {};
      IMAGE_ATTRS.forEach((name) => {
        const value = img.getAttribute(name);
        if (value != null) {
          attrs[name] = value;
          img.removeAttribute(name);
        }
      });
      stash.set(img, attrs);
    });
    if (!digits.length) return;
    if (!endpoint) console.error('[plans-gate] data-gate-endpoint is missing: logins cannot be checked.');

    const setBusy = (busy: boolean) => {
      gate.toggleAttribute('aria-busy', busy);
      [emailInput, ...digits, submit].forEach((el) => el && (el.disabled = busy));
    };

    // ---- a remembered device: check (and log) this view ----
    const stored = readStore();
    if (stored?.email && emailInput) emailInput.value = stored.email;
    if (stored?.token && endpoint) {
      gate.classList.add('is-checking');
      call(endpoint, { action: 'check', token: stored.token })
        .then((reply) => {
          if (reply.ok) unlock(false);
          else writeStore({ token: '', email: stored.email });
        })
        .catch(() => undefined)
        .finally(() => gate.classList.remove('is-checking'));
    }

    // ---- login: email + four digits ----
    const fill = (from: number, text: string) => {
      text
        .replace(/\D/g, '')
        .split('')
        .slice(0, digits.length - from)
        .forEach((d, i) => (digits[from + i].value = d));
    };
    const wrong = (reason: string) => {
      showError(reason);
      digits.forEach((d) => (d.value = ''));
      (reason === 'email' && emailInput ? emailInput : digits[0]).focus();
      if (row && !reducedMotion() && reason !== 'offline') {
        row.classList.remove('is-shake');
        void row.offsetWidth; // restart the animation
        row.classList.add('is-shake');
      }
    };
    let sending = false;
    const check = async () => {
      const pin = digits.map((d) => d.value).join('');
      if (pin.length < digits.length || sending) return;
      const email = (emailInput?.value ?? '').trim().toLowerCase();
      if (!validEmail(email)) return wrong('email');
      if (!endpoint) return wrong('offline');
      sending = true;
      setBusy(true);
      try {
        const reply = await call(endpoint, { action: 'login', email, pin });
        if (reply.ok && typeof reply.token === 'string') {
          writeStore({ token: reply.token, email });
          showError(null);
          unlock();
        } else wrong(String(reply.reason || 'wrong'));
      } catch {
        wrong('offline');
      } finally {
        sending = false;
        setBusy(false);
      }
    };

    emailInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        digits[0].focus();
      }
    });
    digits.forEach((input, i) => {
      input.addEventListener('input', () => {
        const typed = input.value.replace(/\D/g, '');
        if (typed.length > 1) fill(i, typed); // autofill or fast typing
        else input.value = typed;
        if (input.value) {
          const next = digits.slice(i + 1).find((d) => !d.value) ?? digits[Math.min(i + 1, digits.length - 1)];
          next.focus();
          next.select();
        }
        void check();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !input.value && i > 0) {
          event.preventDefault();
          digits[i - 1].value = '';
          digits[i - 1].focus();
        } else if (event.key === 'ArrowLeft' && i > 0) digits[i - 1].focus();
        else if (event.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
        else if (event.key === 'Enter') void check();
      });
      input.addEventListener('paste', (event) => {
        const text = event.clipboardData?.getData('text') ?? '';
        if (!/\d/.test(text)) return;
        event.preventDefault();
        fill(i, text);
        digits[Math.min(digits.length - 1, i + text.replace(/\D/g, '').length)].focus();
        void check();
      });
      input.addEventListener('focus', () => input.select());
    });
    row?.addEventListener('animationend', () => row.classList.remove('is-shake'));

    // ---- switch between login and request ----
    gate.querySelectorAll<HTMLElement>('[data-gate-view]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const toRequest = button.getAttribute('data-gate-view') === 'request';
        gate.classList.toggle('is-requesting', toRequest);
        showError(null);
        showStatus(null);
        if (toRequest) {
          const email = field('email');
          if (email && !email.value && emailInput?.value) email.value = emailInput.value;
          (field('name') ?? email)?.focus();
        } else (emailInput?.value ? digits[0] : emailInput ?? digits[0]).focus();
      });
    });

    // ---- request a PIN (or have it sent again) ----
    let requesting = false;
    const request = async () => {
      if (requesting) return;
      const email = (field('email')?.value ?? '').trim().toLowerCase();
      const name = (field('name')?.value ?? '').trim();
      if (!email || (field('name') && !name)) return showStatus('missing');
      if (!validEmail(email)) return showStatus('invalid');
      if (!endpoint) return showStatus('offline');
      requesting = true;
      setBusy(true);
      showStatus(null);
      try {
        const reply = await call(endpoint, {
          action: 'request',
          email,
          name,
          company: (field('company')?.value ?? '').trim(),
          website: field('website')?.value ?? '',
        });
        if (reply.ok) {
          showStatus(String(reply.state || 'requested'), email);
          if (emailInput && !emailInput.value) emailInput.value = email;
        } else showStatus(reply.reason === 'email' ? 'invalid' : 'offline');
      } catch {
        showStatus('offline');
      } finally {
        requesting = false;
        setBusy(false);
      }
    };
    submit?.addEventListener('click', (event) => {
      event.preventDefault();
      void request();
    });
    // Each request-view element carries [data-gate-request] (they sit
    // directly in Gate Panel, so its gap spaces them), so listen on the gate.
    gate.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.target as Element).matches('input[data-gate-field]')) {
        event.preventDefault();
        void request();
      }
    });

    // The slider arrows stay visible while locked; a click goes to the login.
    gate.addEventListener(
      'click',
      (event) => {
        if (gate.classList.contains('is-unlocked')) return;
        if (!(event.target as Element).closest('[data-slider-prev], [data-slider-next]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        gate.classList.remove('is-requesting');
        (emailInput && !emailInput.value ? emailInput : digits[0]).focus();
      },
      true,
    );
  });
}
