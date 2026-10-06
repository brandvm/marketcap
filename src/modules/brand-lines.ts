// Closing CTA: the ten stacked logo-mark outlines.
//   · On enter, the outlines fade in one after another.
//   · Mouse parallax inside the section: the front outline stays put; each
//     outline behind it moves opposite to the pointer, further the deeper it
//     sits. Leaving the section eases everything back to rest; entering eases
//     to the pointer, never jumps.
// Markup: [data-brand-lines] <svg> inside the CTA section, its outlines are
// [data-brand-line] in back-to-front order. Parallax only on fine pointers
// and without reduced motion.
import { gsap, reducedMotion } from './gsap';

const MAX_SHIFT = 46; // svg units the deepest outline travels at the section edge

export function initBrandLines() {
  const svg = document.querySelector<SVGSVGElement>('[data-brand-lines]');
  if (!svg || reducedMotion()) return;
  const lines = Array.from(svg.querySelectorAll<SVGElement>('[data-brand-line]'));
  if (!lines.length) return;

  gsap.from(lines, {
    opacity: 0,
    duration: 1,
    ease: 'power2.out',
    stagger: 0.08,
    scrollTrigger: { trigger: svg, start: 'top 75%' },
  });

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const area = svg.closest<HTMLElement>('section') ?? svg.parentElement!;
  const last = lines.length - 1;

  // depth 1 = back outline, 0 = front outline (stays still)
  const movers = lines.map((line, i) => ({
    depth: last === 0 ? 0 : (last - i) / last,
    x: gsap.quickTo(line, 'x', { duration: 0.9, ease: 'power3.out' }),
    y: gsap.quickTo(line, 'y', { duration: 0.9, ease: 'power3.out' }),
  }));

  const move = (nx: number, ny: number) => {
    movers.forEach((m) => {
      m.x(-nx * MAX_SHIFT * m.depth);
      m.y(-ny * MAX_SHIFT * m.depth);
    });
  };

  area.addEventListener('pointermove', (event) => {
    const box = area.getBoundingClientRect();
    // -1 … 1 from the section centre
    const nx = ((event.clientX - box.left) / box.width) * 2 - 1;
    const ny = ((event.clientY - box.top) / box.height) * 2 - 1;
    move(nx, ny);
  });
  area.addEventListener('pointerleave', () => move(0, 0));
}
