// Lenis smooth scroll driven by the GSAP ticker so ScrollTrigger scrubs stay
// in step. Anchors land with the section flush at the top of the viewport:
// the nav bar scrolls away with the page, so there is no bar to clear (only
// Nav Float's corner buttons), and an offset left a strip of the previous
// section above full-bleed sections like Approach (Kajal, 2026-10-06).
import Lenis from 'lenis';
import { gsap, ScrollTrigger, reducedMotion } from './gsap';

export let lenis: Lenis | null = null;

// True while an anchor link's smooth scroll is running: scroll snapping
// (timeline.ts) stands down, or it catches the glide as it passes a pinned
// section and pulls the page into it.
let anchoring = false;
export const isAnchorScrolling = () => anchoring;

// webflow.js has its own same-page anchor scroll (jQuery, 'click.wf-scroll'):
// a moment after our Lenis glide it scrolls again to the target element
// itself, which for a pinned section is the end of its pin (GOTCHAS: sticky
// header entry). Lenis owns anchors, so unbind it. Webflow.ready() binds it
// again, so transition.ts calls this after re-initialising Webflow.
export function releaseWebflowAnchors() {
  const $ = (window as typeof window & { jQuery?: (el: Document) => { off: (events: string) => void } }).jQuery;
  $?.(document).off('click.wf-scroll');
}

export function initSmoothScroll() {
  if (reducedMotion()) {
    jumpToHashOnLoad();
    return;
  }
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  // Pin spacers change the page height after Lenis has measured it; keep
  // Lenis's scroll limit in step with every ScrollTrigger refresh.
  ScrollTrigger.addEventListener('refresh', () => lenis?.resize());
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  jumpToHashOnLoad();
  releaseWebflowAnchors();
  // webflow.js may bind after the bundle runs.
  if (document.readyState !== 'complete') window.addEventListener('load', releaseWebflowAnchors, { once: true });
  document.addEventListener('click', (event) => {
    // Same-page anchors, written either "#id" or "/page#id" (nav and footer
    // are shared across pages, so they use the "/#id" form).
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || !link.hash || link.pathname !== location.pathname || link.origin !== location.origin) return;
    const target = document.querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    anchoring = true;
    // Snapping fires a moment after scrolling stops (timeline.ts delay), so
    // the flag outlasts the glide a little.
    let release = 0;
    const done = () => {
      clearTimeout(release);
      release = window.setTimeout(() => { anchoring = false; }, 400);
    };
    lenis?.scrollTo(anchorY(target), { onComplete: done });
    // The URL follows the section, as the browser's own anchor jump would.
    history.replaceState(history.state, '', link.hash);
    release = window.setTimeout(() => { anchoring = false; }, 3000); // if Lenis is interrupted
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
// Where an anchor target starts in the page. A section pinned by
// ScrollTrigger (Our Story, Approach) sits inside a .pin-spacer and, once its
// pin has played, is translated to the end of it: scrolling to the element
// itself would land at the end of the pin. The spacer's top is the start.
function anchorY(target: Element): number {
  const spacer = target.parentElement?.classList.contains('pin-spacer') ? target.parentElement : null;
  return (spacer ?? target).getBoundingClientRect().top + window.scrollY;
}

function hashTarget(): Element | null {
  if (!location.hash) return null;
  try {
    return document.querySelector(location.hash);
  } catch {
    return null; // not a valid selector, e.g. "#/route"
  }
}

// Jump straight to location.hash (after a refresh, so pin spacers count).
// Also used by transition.ts after a cross-page link such as /#approach.
export function jumpToHash(): boolean {
  const target = hashTarget();
  if (!target) return false;
  ScrollTrigger.refresh();
  const y = anchorY(target);
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
  ScrollTrigger.update();
  return true;
}

function jumpToHashOnLoad() {
  if (!hashTarget()) return;
  history.scrollRestoration = 'manual';
  // setTimeout: after the rest of the manifest has run (src/index.ts).
  setTimeout(jumpToHash, 0);
  if (document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(jumpToHash, 0), { once: true });
}
