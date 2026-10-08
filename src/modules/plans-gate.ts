// Dev-phase PIN gate (development template › Plans). A soft gate for
// review, not protection: the image URLs are still in the page source.
//   · The PIN is the visitor's local month and day (MMDD, e.g. 1008 on
//     8 October). Yesterday's and tomorrow's codes also work, so nobody is
//     locked out across time zones or around midnight.
//   · Until unlocked, repo CSS hides [data-gate-content] on the published
//     site (the canvas shows everything), and the images inside lose their
//     src/srcset/sizes, kept only in memory, so they aren't in the DOM.
//   · Four single-digit boxes: typing moves on, Backspace moves back, a
//     pasted PIN fills them all, and the fourth digit submits. A wrong PIN
//     shakes the boxes (not under reduced motion) and shows the error.
//   · Unlocking restores the images, adds .is-unlocked, re-measures the
//     slider and ScrollTrigger, and moves focus to the section without a
//     ring. Nothing is remembered: every page view asks again, including
//     one reached by a page transition.
// Markup: <section data-gate="plans"> with [data-gate-panel] (Gate Stage:
// a blurred dummy slider plus the PIN box) holding [data-gate-digits] (four
// input[data-gate-digit]) and [data-gate-error]; the gated parts carry
// [data-gate-content]. The slider arrows stay visible while locked and a
// click on them focuses the first digit.
import { ScrollTrigger, reducedMotion } from './gsap';

const IMAGE_ATTRS = ['src', 'srcset', 'sizes'] as const;

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
    const digits = Array.from(gate.querySelectorAll<HTMLInputElement>('[data-gate-digit]'));
    const row = gate.querySelector<HTMLElement>('[data-gate-digits]');
    const error = gate.querySelector<HTMLElement>('[data-gate-error]');
    const stash = new Map<HTMLImageElement, Partial<Record<(typeof IMAGE_ATTRS)[number], string>>>();

    const unlock = () => {
      stash.forEach((attrs, img) => {
        IMAGE_ATTRS.forEach((name) => {
          const value = attrs[name];
          if (value != null) img.setAttribute(name, value);
        });
      });
      stash.clear();
      gate.classList.add('is-unlocked');
      // The slider measures on resize; ScrollTrigger and Lenis need the new height.
      window.dispatchEvent(new Event('resize'));
      ScrollTrigger.refresh();
      gate.setAttribute('tabindex', '-1');
      gate.focus({ preventScroll: true });
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

    const fill = (from: number, text: string) => {
      text
        .replace(/\D/g, '')
        .split('')
        .slice(0, digits.length - from)
        .forEach((d, i) => (digits[from + i].value = d));
    };
    const wrong = () => {
      error?.classList.add('is-shown');
      digits.forEach((d) => (d.value = ''));
      digits[0].focus();
      if (row && !reducedMotion()) {
        row.classList.remove('is-shake');
        void row.offsetWidth; // restart the animation
        row.classList.add('is-shake');
      }
    };
    const check = () => {
      const pin = digits.map((d) => d.value).join('');
      if (pin.length < digits.length) return;
      if (validPins().includes(pin)) {
        error?.classList.remove('is-shown');
        unlock();
      } else wrong();
    };

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
        check();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !input.value && i > 0) {
          event.preventDefault();
          digits[i - 1].value = '';
          digits[i - 1].focus();
        } else if (event.key === 'ArrowLeft' && i > 0) digits[i - 1].focus();
        else if (event.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
      });
      input.addEventListener('paste', (event) => {
        const text = event.clipboardData?.getData('text') ?? '';
        if (!/\d/.test(text)) return;
        event.preventDefault();
        fill(i, text);
        digits[Math.min(digits.length - 1, i + text.replace(/\D/g, '').length)].focus();
        check();
      });
      input.addEventListener('focus', () => input.select());
    });
    row?.addEventListener('animationend', () => row.classList.remove('is-shake'));

    // The slider arrows stay visible while locked; a click goes to the PIN.
    gate.addEventListener(
      'click',
      (event) => {
        if (gate.classList.contains('is-unlocked')) return;
        if (!(event.target as Element).closest('[data-slider-prev], [data-slider-next]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        digits[0].focus();
      },
      true,
    );
  });
}
