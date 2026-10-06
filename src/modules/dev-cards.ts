// Developments: sticky stacking cards
// (reference: "Homepage Development Section Scroll Card Sticky.mp4").
//   · The section heading blurs and fades as the first card rises over it.
//   · Each card sticks below the nav; the next card slides over it while
//     the covered card scales down slightly and washes out to Chalk.
//   · The four stats in a card count up as the card arrives.
// Cards are position: sticky in CSS (new-classes.css .dev-card); this module
// only scrubs the visual changes. Markup: [data-dev] with [data-dev-head]
// and [data-dev-card] (each holding [data-dev-wash] and [data-count]).
import { gsap, ScrollTrigger, reducedMotion } from './gsap';
import { primeCount, setCount } from './count-up';

// The sticky offset the card rests at (CSS top of .dev-card).
const stuckTop = (card: HTMLElement) => parseFloat(getComputedStyle(card).top) || 0;

export function initDevCards() {
  const root = document.querySelector<HTMLElement>('[data-dev]');
  if (!root) return;
  const head = root.querySelector<HTMLElement>('[data-dev-head]');
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-dev-card]'));
  if (!cards.length) return;

  const counts = cards.map((card) => Array.from(card.querySelectorAll<HTMLElement>('[data-count]')));
  counts.flat().forEach(primeCount);

  if (reducedMotion()) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    if (head) {
      gsap.to(head, {
        filter: 'blur(10px)',
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: { trigger: cards[0], start: 'top 32%', end: 'top 8%', scrub: true },
      });
    }

    cards.forEach((card, i) => {
      const next = cards[i + 1];
      const wash = card.querySelector<HTMLElement>('[data-dev-wash]');
      if (next && wash) {
        gsap.timeline({
          defaults: { ease: 'none' },
          // Fade only once the next card covers half of the stuck one: from
          // next.top = stuck top + half the card height, to next.top = stuck top.
          scrollTrigger: {
            trigger: next,
            start: () => `top ${stuckTop(card) + card.offsetHeight / 2}px`,
            end: () => `top ${stuckTop(card)}px`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
          .to(card, { scale: 0.94, transformOrigin: '50% 0%' }, 0)
          .to(wash, { opacity: 0.62 }, 0);
      }
    });
  });

  // Counting runs at every width.
  cards.forEach((card, i) => {
    const state = { v: 0 };
    counts[i].forEach((el) => setCount(el, 0));
    ScrollTrigger.create({
      trigger: card,
      start: 'top 70%',
      once: true,
      onEnter: () =>
        gsap.to(state, { v: 1, duration: 1.4, ease: 'power2.out', onUpdate: () => counts[i].forEach((el) => setCount(el, state.v)) }),
    });
  });
}
