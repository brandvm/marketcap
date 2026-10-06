// Nav behaviour.
//   · Glass over the hero, solid Chalk once the hero has scrolled away;
//     solid from the start on pages without [data-hero].
//   · Auto-hide: scrolling down past the top zone hides the bar; scrolling
//     up by more than the threshold shows it again. Small jitters (trackpad
//     inertia, Lenis easing) don't toggle it.
//   · Always shown near the top of the page and while a link inside it has
//     keyboard focus.
// Markup: [data-nav]; optional [data-hero]. Tunables as data attributes on
// [data-nav]: data-hide-after (px from top, default 120), data-threshold
// (px of travel before toggling, default 12).
import { ScrollTrigger } from './gsap';

export function initNavState() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;

  const hero = document.querySelector<HTMLElement>('[data-hero]');
  // Pages without a dark hero (listing, contact, style guide) start solid.
  if (!hero) nav.classList.add('is-solid');
  if (hero) {
    ScrollTrigger.create({
      trigger: hero,
      start: () => `bottom ${nav.offsetHeight}px`,
      onEnter: () => nav.classList.add('is-solid'),
      onLeaveBack: () => nav.classList.remove('is-solid'),
    });
  }

  const hideAfter = Number(nav.dataset.hideAfter ?? 120);
  const threshold = Number(nav.dataset.threshold ?? 12);
  let lastY = window.scrollY;
  let travel = 0; // distance moved in the current direction
  let hidden = false;

  const setHidden = (value: boolean) => {
    if (value === hidden) return;
    hidden = value;
    nav.classList.toggle('is-hidden', value);
  };

  const update = () => {
    const y = window.scrollY;
    const delta = y - lastY;
    lastY = y;
    if (y <= hideAfter) {
      travel = 0;
      setHidden(false);
      return;
    }
    if (nav.contains(document.activeElement)) return;
    // Reset the accumulator when the direction flips.
    if ((delta > 0 && travel < 0) || (delta < 0 && travel > 0)) travel = 0;
    travel += delta;
    if (travel > threshold) setHidden(true);
    else if (travel < -threshold) setHidden(false);
  };

  window.addEventListener('scroll', update, { passive: true });
  nav.addEventListener('focusin', () => setHidden(false));
}
