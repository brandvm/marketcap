// Lenis smooth scroll driven by the GSAP ticker so ScrollTrigger scrubs stay
// in step. Same-page anchors are offset by the sticky nav height
// (GOTCHAS: Webflow's own anchor scroll ignores sticky headers).
import Lenis from 'lenis';
import { gsap, ScrollTrigger, reducedMotion } from './gsap';

export let lenis: Lenis | null = null;

export function initSmoothScroll() {
  if (reducedMotion()) {
    jumpToHashOnLoad(document.querySelector<HTMLElement>('[data-nav]'));
    return;
  }
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  // Pin spacers change the page height after Lenis has measured it; keep
  // Lenis's scroll limit in step with every ScrollTrigger refresh.
  ScrollTrigger.addEventListener('refresh', () => lenis?.resize());
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const nav = document.querySelector<HTMLElement>('[data-nav]');
  jumpToHashOnLoad(nav);
  document.addEventListener('click', (event) => {
    // Same-page anchors, written either "#id" or "/page#id" (nav and footer
    // are shared across pages, so they use the "/#id" form).
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || !link.hash || link.pathname !== location.pathname || link.origin !== location.origin) return;
    const target = document.querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    lenis?.scrollTo(target as HTMLElement, { offset: -(nav?.offsetHeight ?? 0) });
    // preventDefault also stops the browser moving focus to the target, so
    // keyboard and screen-reader users would stay at the link: move it here.
    const el = target as HTMLElement;
    if (!el.matches('a[href], button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  });
}

// Arriving with a hash (/#approach from another page): the browser and
// webflow.js jump to the target before the pins exist, and the pin spacers
// added afterwards push every later section down, so the page lands far
// short of the target and the animations past that point never run. Jump
// again once the modules have built their triggers, and once more after
// load (images and fonts change the layout too).
function jumpToHashOnLoad(nav: HTMLElement | null) {
  if (!location.hash) return;
  let target: Element | null = null;
  try {
    target = document.querySelector(location.hash);
  } catch {
    return; // not a valid selector, e.g. "#/route"
  }
  if (!target) return;
  history.scrollRestoration = 'manual';
  const go = () => {
    ScrollTrigger.refresh();
    const y = target!.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight ?? 0);
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    ScrollTrigger.update();
  };
  // setTimeout: after the rest of the manifest has run (src/index.ts).
  setTimeout(go, 0);
  if (document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(go, 0), { once: true });
}
