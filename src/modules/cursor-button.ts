// "View Project" glass button that follows the pointer inside a card
// (seen in the Developments reference). The real link is the whole card,
// so keyboard and touch users lose nothing; the follower is decoration and
// is hidden on touch devices.
// Markup: [data-cursor-area] containing [data-cursor-button].
import { gsap } from './gsap';

export function initCursorButton() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll<HTMLElement>('[data-cursor-area]').forEach((area) => {
    const button = area.querySelector<HTMLElement>('[data-cursor-button]');
    if (!button) return;

    const x = gsap.quickTo(button, 'x', { duration: 0.45, ease: 'power3.out' });
    const y = gsap.quickTo(button, 'y', { duration: 0.45, ease: 'power3.out' });

    area.addEventListener('pointerenter', (event) => {
      const box = area.getBoundingClientRect();
      gsap.set(button, { x: event.clientX - box.left - button.offsetWidth / 2, y: event.clientY - box.top - button.offsetHeight / 2 });
      gsap.to(button, { opacity: 1, scale: 1, duration: 0.25 });
    });
    area.addEventListener('pointermove', (event) => {
      const box = area.getBoundingClientRect();
      x(event.clientX - box.left - button.offsetWidth / 2);
      y(event.clientY - box.top - button.offsetHeight / 2);
    });
    area.addEventListener('pointerleave', () => gsap.to(button, { opacity: 0, scale: 0.9, duration: 0.25 }));
  });
}
