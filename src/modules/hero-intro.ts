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
  gsap.from(items, {
    y: 32,
    opacity: 0,
    filter: 'blur(8px)',
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.09,
    delay: 0.2,
  });
}
