// Entry point. Keep this file a manifest: one run() call per module.
// Feature code lives in src/modules/<name>.ts and exports an init
// function that no-ops when its selector is absent from the page.
import { initEnvironmentSwitcher } from './modules/environment-switcher';
import { initSmoothScroll } from './modules/smooth-scroll';
import { initHeroIntro } from './modules/hero-intro';
import { initNavState } from './modules/nav-state';
import { initNavMenu } from './modules/nav-menu';
import { initStorySequence } from './modules/story-sequence';
import { initTimeline } from './modules/timeline';
import { initDevCards } from './modules/dev-cards';
import { initCursorButton } from './modules/cursor-button';
import { initCountUp } from './modules/count-up';
import { initApproachSteps } from './modules/approach-steps';
import { initCapabilities } from './modules/capabilities';
import { initBrandLines } from './modules/brand-lines';
import { initSlider } from './modules/slider';
import { initCustomSelect } from './modules/custom-select';
import { initLightbox } from './modules/lightbox';
import { initFinsweet, resetFinsweet } from './modules/finsweet';
import { initTransition } from './modules/transition';
import { gsap, ScrollTrigger } from './modules/gsap';

// Each module runs in isolation: one that throws is logged and skipped,
// and every module after it still initializes.
function run(name: string, init: () => void) {
  try {
    init();
  } catch (error) {
    console.error(`[bv] ${name} failed to initialize`, error);
  }
}

// Page modules belong to one page's content. With page transitions
// (transition.ts) only the Barba container is swapped, so they run again on
// every page and are torn down when it leaves. Order matters as before.
const pageModules: Array<[string, () => void]> = [
  ['hero-intro', initHeroIntro],
  ['story-sequence', initStorySequence],
  ['timeline', initTimeline],
  ['dev-cards', initDevCards],
  ['cursor-button', initCursorButton],
  ['count-up', initCountUp],
  ['approach-steps', initApproachSteps],
  ['capabilities', initCapabilities],
  ['brand-lines', initBrandLines],
  ['slider', initSlider],
  ['custom-select', initCustomSelect],
  ['lightbox', initLightbox],
  // Finsweet stays last: List's init() must see attributes earlier modules set.
  ['finsweet', initFinsweet],
];

// Everything a page's modules set up, so destroyPage() can undo it:
// a gsap.context owns their tweens, ScrollTriggers and matchMedia; window and
// document listeners added while they start are recorded here.
let pageContext: gsap.Context | null = null;
let pageListeners: Array<[EventTarget, string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]> = [];

function initPage() {
  const targets: EventTarget[] = [window, document];
  const originals = targets.map((t) => t.addEventListener);
  targets.forEach((t, i) => {
    t.addEventListener = function (this: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
      if (listener) pageListeners.push([t, type, listener, options]);
      return originals[i].call(this, type, listener, options);
    } as typeof t.addEventListener;
  });
  try {
    pageContext = gsap.context(() => pageModules.forEach(([name, init]) => run(name, init)));
  } finally {
    targets.forEach((t, i) => (t.addEventListener = originals[i]));
  }
}

function destroyPage() {
  pageContext?.revert();
  pageContext = null;
  pageListeners.forEach(([t, type, listener, options]) => t.removeEventListener(type, listener, options));
  pageListeners = [];
  // Nodes page modules add outside the container.
  document.querySelectorAll('body > dialog.lightbox').forEach((d) => d.remove());
  resetFinsweet();
}

function boot() {
  // Release the pre-paint scroll lock set by loader.html first, before any
  // module measures the page — smooth-scroll libraries such as Lenis read
  // the scroll height at init and get ~0 while body is still locked. The
  // head snippet also has a fallback timeout.
  document.documentElement.classList.remove('is-loading');

  // Global modules: once per visit (the nav and Lenis live outside the
  // Barba container).
  run('environment-switcher', initEnvironmentSwitcher);
  run('smooth-scroll', initSmoothScroll);
  run('nav-state', initNavState);
  run('nav-menu', initNavMenu);

  initPage();
  run('transition', () => initTransition({ initPage, destroyPage }));

  // Pin and scrub positions depend on final layout: recompute once web
  // fonts and images have loaded (large screens were starting pins early).
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
