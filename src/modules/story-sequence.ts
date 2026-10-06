// About → statement → stats, one pinned scroll sequence over a single photo
// (reference: "Homepage Second Section to Third Section Transition.mp4").
//   1. About copy and guide lines blur out while the logo-mark mask grows
//      from its slot (bottom right) until the photo fills the viewport.
//   2. The photo darkens; "Built on Family. / Driven by Vision." resolves
//      from blur line by line.
//   3. The statement lifts and blurs away; the four stat cards rise in a
//      stagger and their numbers count with the scroll; the button fades in.
// Markup: [data-story] › [data-story-pin] containing [data-story-media],
// [data-story-shade], [data-story-about], [data-story-statement] (lines are
// [data-line]), [data-stat-card], [data-story-cta] and [data-story-stats]
// (the wrapper that drifts up over the last stretch).
import { gsap, ScrollTrigger, reducedMotion } from './gsap';
import { setCount } from './count-up';

// The mark artwork is 1106 × 452 units. Its middle parallelogram is the
// shape that grows to cover the screen; (442, 226) is its centre and an
// inscribed rectangle of aspect r has half-height 221 / (r + 0.99) units.
const MARK_W = 1106;
const MARK_H = 452;
const CORE_X = 442;
const CORE_Y = 226;

type MaskBox = { x: number; y: number; s: number };

function startBox(media: HTMLElement): MaskBox {
  // Slot from the Figma frame: x 575 of 1680, full mark width 1106, resting
  // on the bottom edge of the section.
  const vw = media.clientWidth;
  const vh = media.clientHeight;
  const s = vw / 1680;
  return { x: 575 * s, y: vh - MARK_H * s, s };
}

function endBox(media: HTMLElement): MaskBox {
  const vw = media.clientWidth;
  const vh = media.clientHeight;
  const r = vw / vh;
  const halfH = 221 / (r + 0.99);
  const s = (vh / (2 * halfH)) * 1.12;
  return { x: vw / 2 - CORE_X * s, y: vh / 2 - CORE_Y * s, s };
}

function applyMask(media: HTMLElement, box: MaskBox) {
  media.style.setProperty('--mask-x', `${box.x}px`);
  media.style.setProperty('--mask-y', `${box.y}px`);
  media.style.setProperty('--mask-w', `${MARK_W * box.s}px`);
  media.style.setProperty('--mask-h', `${MARK_H * box.s}px`);
}

export function initStorySequence() {
  const story = document.querySelector<HTMLElement>('[data-story]');
  if (!story) return;
  const pin = story.querySelector<HTMLElement>('[data-story-pin]')!;
  const media = story.querySelector<HTMLElement>('[data-story-media]')!;
  const shade = story.querySelector<HTMLElement>('[data-story-shade]')!;
  const about = story.querySelector<HTMLElement>('[data-story-about]')!;
  const statement = story.querySelector<HTMLElement>('[data-story-statement]')!;
  const lines = statement.querySelectorAll<HTMLElement>('[data-line]');
  const cards = story.querySelectorAll<HTMLElement>('[data-stat-card]');
  const cta = story.querySelector<HTMLElement>('[data-story-cta]');

  const mm = gsap.matchMedia();

  // Desktop and tablet: the full pinned sequence.
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    // The guide lines, marker and X/Y read-out ride on the image's top-left
    // corner; the read-out counts up as the corner moves (reference: X 117 →
    // 134, Y 99 → 133 while the copy blurs).
    const guides = story.querySelector<HTMLElement>('[data-story-guides]');
    const labelX = story.querySelector<HTMLElement>('[data-guide-x]');
    const labelY = story.querySelector<HTMLElement>('[data-guide-y]');
    const mask = { p: 0 };
    const float = document.querySelector<HTMLElement>('[data-nav-float]');
    const navMid = () => (float ? float.offsetHeight / 2 : 40);
    const draw = () => {
      const a = startBox(media);
      const b = endBox(media);
      const p = mask.p;
      const box = { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, s: a.s + (b.s - a.s) * p };
      applyMask(media, box);
      // Guides stay sharp: they follow the corner to the frame's top-left,
      // stop there, and fade over the last ~120px of travel.
      const gx = Math.max(0, box.x);
      const gy = Math.max(0, box.y);
      pin.style.setProperty('--gx', `${gx}px`);
      pin.style.setProperty('--gy', `${gy}px`);
      if (guides) guides.style.opacity = String(Math.min(1, Math.min(gx, gy) / 120));
      if (labelX) labelX.textContent = `X: ${Math.round(117 + Math.max(0, a.x - box.x) * 0.15)}`;
      if (labelY) labelY.textContent = `Y: ${Math.round(99 + Math.max(0, a.y - box.y) * 0.15)}`;
      // Nav Float reads the theme under it (nav-state.ts): Chalk until the
      // photo has spread up to the bar's height, dark after.
      const theme = box.y + pin.getBoundingClientRect().top <= navMid() ? 'dark' : 'light';
      story.dataset.navTheme = theme;
      about.dataset.navTheme = theme;
    };
    draw();
    ScrollTrigger.addEventListener('refresh', draw);

    const counters = Array.from(cards).map((card) => ({ el: card.querySelector<HTMLElement>('[data-count]')!, v: 0 }));
    const syncCounts = () => counters.forEach((c) => setCount(c.el, c.v));
    // Cards start fully below the frame and invisible, so nothing peeks in
    // while the statement plays, whatever the screen height.
    gsap.set(cards, { y: () => window.innerHeight, autoAlpha: 0 });
    if (cta) gsap.set(cta, { autoAlpha: 0, y: 16 });
    gsap.set(lines, { opacity: 0, filter: 'blur(16px)', y: 24 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      // pinSpacing must be explicit: Section is display:flex, and ScrollTrigger
      // turns pin spacing off by default when the pinned element's parent is a
      // flex container — the next section then slides under the pinned frame.
      scrollTrigger: {
        trigger: pin, pin: true, pinSpacing: true, start: 'top top', end: '+=420%', scrub: 0.8, invalidateOnRefresh: true,
        // A refresh or a jump (anchor link, /#hash on load) renders the
        // timeline with callbacks suppressed, so the counters' onUpdate never
        // writes the number: copy their state to the text from here too.
        onRefresh: () => syncCounts(), onUpdate: () => syncCounts(), onScrubComplete: () => syncCounts(),
      },
      // No anticipatePin: with Lenis it pre-applies the pin a frame early and
      // reads as a jolt where the pin starts and ends.
    });

    // Subtle zoom-out of the photo across the whole pin (same feel as Our
    // Approach). Only the inner image scales; the mask stays on its wrapper.
    const zoom = story.querySelector<HTMLElement>('[data-story-zoom]');
    if (zoom) tl.fromTo(zoom, { scale: 1.14 }, { scale: 1, duration: 4.2, ease: 'none' }, 0);

    // 1 · copy blurs out while the corner drifts, then the image floods the frame.
    // The copy keeps travelling up at roughly scroll speed as the pin takes
    // over, so the page never appears to stop dead ("hit a wall").
    tl.to(about, { y: () => -window.innerHeight * 0.5, duration: 0.75, ease: 'none' }, 0)
      .to(about, { filter: 'blur(14px)', opacity: 0, duration: 0.7 }, 0.05)
      .to(mask, { p: 1, duration: 1.25, ease: 'power3.in', onUpdate: draw }, 0)
    // 2 · darken, statement resolves line by line
      .to(shade, { opacity: 0.45, duration: 0.5 }, 1.2)
      .to(lines, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.5, stagger: -0.2 }, 1.35)
      .to({}, { duration: 0.4 })
    // 3 · statement lifts and blurs; cards rise and count
      .to(statement, { yPercent: -120, filter: 'blur(14px)', opacity: 0.55, duration: 1 }, 2.4)
      .to(cards, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.18, ease: 'power2.out' }, 2.45);

    counters.forEach((c, i) => {
      tl.to(c, { v: 1, duration: 0.9, ease: 'power1.out', onUpdate: () => setCount(c.el, c.v) }, 2.55 + i * 0.18);
    });

    if (cta) tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.3 }, 3.4);
    // Last stretch: the stats drift up instead of holding still, so the
    // hand-over to normal scrolling (and back, scrolling up) stays in motion.
    const stats = story.querySelector<HTMLElement>('[data-story-stats]');
    tl.to({}, { duration: 0.3 }); // short settle after the button
    // Drift from the end of the counting to the very end of the pin.
    if (stats) {
      const from = 3.6;
      tl.fromTo(stats, { y: 0 }, { y: () => -window.innerHeight * 0.34, duration: tl.duration() - from, ease: 'power2.in' }, from); // accelerates into the release: ends near scroll speed
    }

    return () => {
      ScrollTrigger.removeEventListener('refresh', draw);
      story.dataset.navTheme = 'dark';
      about.dataset.navTheme = 'light';
      gsap.set([...Array.from(cards), cta, about, story.querySelector('[data-story-stats]'), ...Array.from(lines)].filter(Boolean), { clearProps: 'all' });
    };
  });

  // Phones and reduced motion: no pin. The photo is shown whole, the
  // statement and cards simply sit in flow and count once on enter.
  mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
    story.classList.add('is-static');
    if (reducedMotion()) cards.forEach((card) => setCount(card.querySelector('[data-count]')!, 1));
    return () => story.classList.remove('is-static');
  });
}
