// First-screen reveal: chip, heading lines, supporting line, button and the
// featured-development card rise in while the hero film starts.
// Markup: [data-hero] containing [data-hero-item] (in reveal order) and a
// <video data-hero-video>.
import { gsap, reducedMotion } from './gsap';

export function initHeroIntro() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;

  const video = hero.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (reducedMotion()) {
    // Reduced motion: no moving background — the poster frame stays.
    video?.removeAttribute('autoplay');
    video?.pause();
    return;
  }
  video?.play().catch(() => {});

  const items = hero.querySelectorAll('[data-hero-item]');
  // Start state with set(), not from(): from() applies it through a lazy
  // zero-duration tween that reverts on the next tick, so the items painted
  // at full opacity until their stagger began, then vanished and faded in
  // again (the load flicker). set() renders now, in the same task that
  // removes html.is-loading, so nothing paints in between.
  gsap.set(items, { y: 32, opacity: 0, filter: 'blur(8px)' });
  gsap.to(items, {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.09,
    delay: 0.2,
  });
}
