// "View Project" glass button that follows the pointer inside a card
// (seen in the Developments reference). The real link is the whole card,
// so keyboard and touch users lose nothing; the follower is decoration and
// is hidden on touch devices.
// Markup: [data-cursor-area] containing [data-cursor-button].
import { gsap } from './gsap';

// Last known pointer position. Pointer events don't fire while the page
// scrolls under a still mouse, so scrolling re-checks every card against it:
// a card that slides under the pointer gets the button where the pointer is,
// and one that slides away hides it, without waiting for the next move.
const pointer = { x: 0, y: 0, known: false };

export function initCursorButton() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  window.addEventListener(
    'pointermove',
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.known = true;
    },
    { passive: true },
  );

  const syncs: Array<(top: HTMLElement | null) => void> = [];

  document.querySelectorAll<HTMLElement>('[data-cursor-area]').forEach((area) => {
    const button = area.querySelector<HTMLElement>('[data-cursor-button]');
    if (!button) return;

    const x = gsap.quickTo(button, 'x', { duration: 0.45, ease: 'power3.out' });
    const y = gsap.quickTo(button, 'y', { duration: 0.45, ease: 'power3.out' });
    let shown = false;

    const target = (clientX: number, clientY: number) => {
      const box = area.getBoundingClientRect();
      return { x: clientX - box.left - button.offsetWidth / 2, y: clientY - box.top - button.offsetHeight / 2 };
    };
    const show = (clientX: number, clientY: number) => {
      const at = target(clientX, clientY);
      // Jump to the pointer (and reset the follow tweens there) before fading in.
      gsap.set(button, at);
      x(at.x, at.x);
      y(at.y, at.y);
      gsap.to(button, { opacity: 1, scale: 1, duration: 0.25 });
      shown = true;
    };
    const hide = () => {
      gsap.to(button, { opacity: 0, scale: 0.9, duration: 0.25 });
      shown = false;
    };

    area.addEventListener('pointerenter', (event) => show(event.clientX, event.clientY));
    area.addEventListener('pointermove', (event) => {
      const at = target(event.clientX, event.clientY);
      x(at.x);
      y(at.y);
    });
    area.addEventListener('pointerleave', hide);

    syncs.push((top) => {
      // Only the card actually under the pointer counts: in the sticky stack
      // the covered card is under the same coordinates too.
      const inside = top === area;
      if (inside && !shown) show(pointer.x, pointer.y);
      else if (inside) {
        const at = target(pointer.x, pointer.y);
        x(at.x);
        y(at.y);
      } else if (shown) hide();
    });
  });

  if (!syncs.length) return;
  let queued = false;
  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (!pointer.known) return;
        const top = document.elementFromPoint(pointer.x, pointer.y)?.closest<HTMLElement>('[data-cursor-area]') ?? null;
        syncs.forEach((sync) => sync(top));
      });
    },
    { passive: true },
  );
}
