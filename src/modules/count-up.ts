// Numbers that count up. The element keeps its final text in markup (so the
// Designer canvas and no-JS visitors see "2k+") and declares how to count:
//   data-count="2" data-decimals="1" data-prefix="" data-suffix="k+"
// Elements inside [data-story] or [data-dev-card] are driven by those
// modules' scroll timelines; any other [data-count] counts once on enter.
import { gsap, ScrollTrigger, reducedMotion } from './gsap';

// Screen readers would announce the half-counted value ("0+"): the
// animated number is hidden from them and a visually hidden copy of the
// final text is read instead. Nothing visible changes.
function speakFinal(node: HTMLElement, final: string) {
  if (node.getAttribute('aria-hidden') === 'true') return;
  node.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('span');
  copy.className = 'sr-only';
  copy.textContent = final;
  node.after(copy);
}

// CMS Number fields have no thousands separators (85083): a bare integer of
// four or more digits is shown as 85,083. Anything else (2k+, $63M, 1.03)
// is kept as written.
function formatFinal(text: string) {
  const raw = text.trim();
  return /^\d{4,}$/.test(raw) ? Number(raw).toLocaleString('en-US') : raw;
}

// Reads the final value from the markup once and writes it back formatted,
// so the resting text is right even when nothing animates (reduced motion).
export function primeCount(el: HTMLElement) {
  const final = formatFinal(el.dataset.final ?? el.textContent ?? '');
  el.dataset.final = final;
  el.textContent = final;
}

export function setCount(el: Element, progress: number) {
  const node = el as HTMLElement;
  const target = Number(node.dataset.count ?? 0);
  const final = node.dataset.final ?? node.textContent ?? '';
  node.dataset.final = final;
  speakFinal(node, final);
  if (progress >= 1) {
    node.textContent = final;
    return;
  }
  const decimals = Number(node.dataset.decimals ?? 0);
  const value = (target * progress).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  node.textContent = `${node.dataset.prefix ?? ''}${value}${node.dataset.suffix ?? ''}`;
}

// Static CMS numbers that don't count (Photo Band value): a bare number gets
// its thousands separator and an optional unit, e.g. 85083 + data-unit="ft²"
// → "85,083 ft²". Text values ("4,185 m²") are left as written.
// Markup: [data-format-number] (optional data-unit).
function formatNumbers() {
  document.querySelectorAll<HTMLElement>('[data-format-number]').forEach((el) => {
    if (el.dataset.formatted) return;
    const raw = (el.textContent ?? '').trim();
    if (!/^\d+(\.\d+)?$/.test(raw)) return;
    const unit = el.dataset.unit?.trim();
    el.textContent = `${Number(raw).toLocaleString('en-US')}${unit ? ` ${unit}` : ''}`;
    el.dataset.formatted = 'true';
  });
}

export function initCountUp() {
  formatNumbers();
  // Dev Cards outside a [data-dev] section (the Developments list) don't
  // count, as in the prototype, but still need their CMS numbers formatted
  // (85083 → 85,083); dev-cards.ts does both inside [data-dev].
  document.querySelectorAll<HTMLElement>('[data-dev-card] [data-count]').forEach((el) => {
    if (!el.closest('[data-dev]')) primeCount(el);
  });
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-count]')).filter(
    (el) => !el.closest('[data-story], [data-dev-card]'),
  );
  items.forEach((el) => {
    primeCount(el);
    if (reducedMotion()) return;
    const state = { v: 0 };
    setCount(el, 0);
    ScrollTrigger.create({
      trigger: el,
      // In a hero the numbers are on screen at load: count straight away.
      start: el.closest('[data-hero]') ? 'top bottom' : 'top 85%',
      once: true,
      onEnter: () => gsap.to(state, { v: 1, duration: 1.6, ease: 'power2.out', onUpdate: () => setCount(el, state.v) }),
    });
  });
}
