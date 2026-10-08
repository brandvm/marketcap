// Dev-phase PIN gate (development template › Plans). A soft gate for
// review, not protection: the plans stay in the page's HTML.
//   · The PIN is the visitor's local month and day (MMDD, e.g. 1008 on
//     8 October). Yesterday's and tomorrow's codes also work, so nobody is
//     locked out across time zones or around midnight.
//   · Until unlocked, repo CSS hides [data-gate-content] (arrows and plans)
//     on the published site only; the canvas shows everything.
//   · Unlocking adds .is-unlocked, remembers it for the browser session
//     (per gate name, so it survives page transitions) and re-measures the
//     slider and ScrollTrigger.
// Markup: <section data-gate="plans"> with [data-gate-panel] holding
// input[data-gate-input], a [data-gate-submit] button and
// [data-gate-error]; the hidden parts carry [data-gate-content].
import { ScrollTrigger } from './gsap';

const KEY = 'bv-gate';

const pinFor = (date: Date) =>
  `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

const validPins = () => {
  const now = new Date();
  return [-1, 0, 1].map((offset) => {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    return pinFor(day);
  });
};

export function initPlansGate() {
  document.querySelectorAll<HTMLElement>('[data-gate]').forEach((gate) => {
    const key = `${KEY}:${gate.dataset.gate || 'gate'}`;
    const input = gate.querySelector<HTMLInputElement>('[data-gate-input]');
    const submit = gate.querySelector<HTMLElement>('[data-gate-submit]');
    const error = gate.querySelector<HTMLElement>('[data-gate-error]');

    const unlock = (moveFocus: boolean) => {
      gate.classList.add('is-unlocked');
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        // storage blocked: unlocked for this page view only
      }
      // The slider measures on resize; ScrollTrigger and Lenis need the new height.
      window.dispatchEvent(new Event('resize'));
      ScrollTrigger.refresh();
      // Focus the plans themselves (the scrollable track), not the disabled
      // "previous" arrow.
      if (moveFocus) (gate.querySelector<HTMLElement>('[data-gate-content] [tabindex="0"]') ?? gate.querySelector<HTMLElement>('[data-gate-content] button:not([disabled])'))?.focus();
    };

    let remembered = false;
    try {
      remembered = sessionStorage.getItem(key) === '1';
    } catch {
      remembered = false;
    }
    if (remembered) return unlock(false);
    if (!input) return;

    const check = () => {
      if (validPins().includes(input.value.replace(/\D/g, ''))) {
        error?.classList.remove('is-shown');
        unlock(true);
      } else {
        error?.classList.add('is-shown');
        input.select();
      }
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        check();
      }
    });
    submit?.addEventListener('click', (event) => {
      event.preventDefault();
      check();
    });
  });
}
