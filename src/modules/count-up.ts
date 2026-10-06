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

export function initCountUp() {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-count]')).filter(
    (el) => !el.closest('[data-story], [data-dev-card]'),
  );
  items.forEach((el) => {
    el.dataset.final = el.textContent ?? '';
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
