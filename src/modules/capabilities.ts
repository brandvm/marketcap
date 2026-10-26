// Capabilities (review round 3): a 3 × 2 grid of photo boxes, one per
// capability (2 × 3 on phones). The active box is larger in both directions:
// its column and its row take a bigger share of the grid, the other boxes
// give up the room, and the grid's own size never changes. The tracks
// animate (CSS transition on grid-template-*).
// The active box changes on a timer (AUTOPLAY_MS, while the section is on
// screen) and on click; a click jumps to that box and the timer carries on
// from there. Hover and focus don't pause it. A line along the active box's
// foot fills as its time runs out (--cap-progress). Reduced motion: no timer.
// Markup: [data-caps] › [data-cap-grid] of [data-cap] buttons (each holds
// its photo and name; [data-cap-label] shows on the active box only).
// Columns/rows of the grid come from the item order.
import { gsap, ScrollTrigger, reducedMotion } from './gsap';

const AUTOPLAY_MS = 3500;
// Share of the grid the active column / row takes, in fr against 1fr.
const GROW_COL = 2;
const GROW_ROW = 1.6;

export function initCapabilities() {
  const root = document.querySelector<HTMLElement>('[data-caps]');
  const grid = root?.querySelector<HTMLElement>('[data-cap-grid]');
  if (!root || !grid) return;
  const items = Array.from(grid.querySelectorAll<HTMLButtonElement>('[data-cap]'));
  if (!items.length) return;

  // 3 columns, 2 on phones (Webflow's Mobile Landscape breakpoint). Not
  // read back from the grid: the inline tracks written below would hide it.
  const phone = window.matchMedia('(max-width: 767px)');
  const columns = () => (phone.matches ? 2 : 3);
  let active = -1;

  const layout = () => {
    if (active < 0) return;
    const cols = columns();
    const rows = Math.ceil(items.length / cols);
    const col = active % cols;
    const row = Math.floor(active / cols);
    grid.style.gridTemplateColumns = Array.from({ length: cols }, (_, i) => (i === col ? `${GROW_COL}fr` : '1fr')).join(' ');
    grid.style.gridTemplateRows = Array.from({ length: rows }, (_, i) => (i === row ? `${GROW_ROW}fr` : '1fr')).join(' ');
  };

  let onChange = () => {}; // restarts the timer (below)
  const select = (index: number) => {
    const changed = index !== active;
    active = index;
    items.forEach((item, i) => {
      item.classList.toggle('is-active', i === index);
      item.setAttribute('aria-pressed', String(i === index));
    });
    layout();
    if (changed) onChange();
  };

  items.forEach((item, i) => item.addEventListener('click', () => select(i)));
  // Arrow keys move focus between the boxes (Enter / Space select).
  items.forEach((item, i) =>
    item.addEventListener('keydown', (event) => {
      const cols = columns();
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: items.length - 1 }[event.key];
      if (to === undefined || to < 0 || to >= items.length) return;
      event.preventDefault();
      items[to].focus();
    }),
  );
  select(Math.max(0, items.findIndex((item) => item.classList.contains('is-active'))));
  // The column count changes at the phone breakpoint: rebuild the tracks.
  // (A context-owned trigger, so a page change tears it down.)
  ScrollTrigger.create({ trigger: root, onRefresh: layout });

  if (reducedMotion()) return;
  let inView = false;
  const state = { p: 0 };
  const write = () => items.forEach((item, i) => item.style.setProperty('--cap-progress', i === active ? state.p.toFixed(3) : '0'));
  const tween = gsap.fromTo(
    state,
    { p: 0 },
    {
      p: 1,
      duration: AUTOPLAY_MS / 1000,
      ease: 'none',
      paused: true,
      onUpdate: write,
      onComplete: () => select((active + 1) % items.length),
    },
  );
  onChange = () => {
    tween.restart();
    write();
    tween.paused(!inView);
  };
  root.setAttribute('data-cap-auto', 'true');
  ScrollTrigger.create({
    trigger: grid,
    start: 'top 75%',
    end: 'bottom 25%',
    onToggle: (self) => {
      inView = self.isActive;
      tween.paused(!inView);
    },
  });
}
