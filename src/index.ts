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
import { initFinsweet } from './modules/finsweet';
import { ScrollTrigger } from './modules/gsap';

// Each module runs in isolation: one that throws is logged and skipped,
// and every module after it still initializes.
function run(name: string, init: () => void) {
  try {
    init();
  } catch (error) {
    console.error(`[bv] ${name} failed to initialize`, error);
  }
}

function boot() {
  // Release the pre-paint scroll lock set by loader.html first, before any
  // module measures the page — smooth-scroll libraries such as Lenis read
  // the scroll height at init and get ~0 while body is still locked. The
  // head snippet also has a fallback timeout.
  document.documentElement.classList.remove('is-loading');

  run('environment-switcher', initEnvironmentSwitcher);
  // Add project feature initializers here: run('<name>', init<Name>);
  run('smooth-scroll', initSmoothScroll);
  run('hero-intro', initHeroIntro);
  run('nav-state', initNavState);
  run('nav-menu', initNavMenu);
  run('story-sequence', initStorySequence);
  run('timeline', initTimeline);
  run('dev-cards', initDevCards);
  run('cursor-button', initCursorButton);
  run('count-up', initCountUp);
  run('approach-steps', initApproachSteps);
  run('capabilities', initCapabilities);
  run('brand-lines', initBrandLines);
  run('slider', initSlider);
  run('custom-select', initCustomSelect);
  run('lightbox', initLightbox);
  // Finsweet stays last: List's init() must see attributes earlier modules set.
  run('finsweet', initFinsweet);

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
