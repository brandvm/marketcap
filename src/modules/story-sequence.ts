// About → statement → stats, one pinned scroll sequence over a single photo
// (reference: "Homepage Second Section to Third Section Transition.mp4").
//   1. About copy and guide lines blur out while the logo-mark mask grows
//      from its slot (bottom right) until the photo fills the viewport.
//   2. The photo darkens; "Built on Family. / Driven by Vision." resolves
//      from blur line by line.
//   3. The statement lifts and blurs away; the four stat cards rise in a
//      stagger and their numbers count with the scroll; the button fades in.
//   Review round 2: Home has no statement any more (step 2 and the lift are
//   skipped), and the photo no longer switches to the black-and-white one.
// Markup: [data-story] › [data-story-pin] containing [data-story-media],
// [data-story-shade], [data-story-about], [data-story-statement] (lines are
// [data-line]), [data-stat-card], [data-story-cta] and [data-story-stats]
// (the wrapper that drifts up over the last stretch). [data-story-stats-media]
// is the second photo inside [data-story-media] (Story Media Img + Is Stats,
// opacity 0 until the script fades it in).
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

// Phones: the mark sits on the bottom edge of the screen, a little wider
// than it and bleeding off the right, under the About copy.
function phoneStartBox(media: HTMLElement): MaskBox {
  const vw = media.clientWidth;
  const vh = Math.min(media.clientHeight, window.innerHeight);
  const s = (vw * 1.15) / MARK_W;
  return { x: vw * 0.08, y: vh - MARK_H * s, s };
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
  // Optional since review round 2: the client dropped the statement, so the
  // mask now floods straight into the stats. Pages that still carry it keep
  // the full three-step sequence.
  const statement = story.querySelector<HTMLElement>('[data-story-statement]');
  const lines = statement ? statement.querySelectorAll<HTMLElement>('[data-line]') : [];
  const cards = story.querySelectorAll<HTMLElement>('[data-stat-card]');
  const cta = story.querySelector<HTMLElement>('[data-story-cta]');
  const statsMedia = story.querySelector<HTMLElement>('[data-story-stats-media]');

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
        trigger: pin, pin: true, pinSpacing: true, start: 'top top', end: statement ? '+=420%' : '+=300%', scrub: 0.8, invalidateOnRefresh: true,
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
    // 2 · darken; with a statement it resolves line by line, then lifts away.
    // Without one, everything after this moves up by `skip`.
      .to(shade, { opacity: 0.45, duration: 0.5 }, 1.2);
    const skip = statement ? 0 : 1.1;
    if (statement) {
      tl.to(lines, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.5, stagger: -0.2 }, 1.35)
        .to({}, { duration: 0.4 })
        .to(statement, { yPercent: -120, filter: 'blur(14px)', opacity: 0.55, duration: 1 }, 2.4);
    }
    // 3 · cards rise and count
    tl.to(cards, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.18, ease: 'power2.out' }, 2.45 - skip);

    counters.forEach((c, i) => {
      tl.to(c, { v: 1, duration: 0.9, ease: 'power1.out', onUpdate: () => setCount(c.el, c.v) }, 2.55 - skip + i * 0.18);
    });

    if (cta) tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.3 }, 3.4 - skip);
    // Last stretch: the stats drift up instead of holding still, so the
    // hand-over to normal scrolling (and back, scrolling up) stays in motion.
    const stats = story.querySelector<HTMLElement>('[data-story-stats]');
    tl.to({}, { duration: 0.3 }); // short settle after the button
    // Drift from the end of the counting to the very end of the pin.
    if (stats) {
      const from = 3.6 - skip;
      tl.fromTo(stats, { y: 0 }, { y: () => -window.innerHeight * 0.34, duration: tl.duration() - from, ease: 'power2.in' }, from); // accelerates into the release: ends near scroll speed
    }

    // The photo stays the same from the mask to the stats (review round 2:
    // no switch to the black-and-white photo). [data-story-stats-media] is
    // left in the markup, unused.

    return () => {
      ScrollTrigger.removeEventListener('refresh', draw);
      story.dataset.navTheme = 'dark';
      about.dataset.navTheme = 'light';
      gsap.set([...Array.from(cards), cta, about, statsMedia, story.querySelector('[data-story-stats]'), ...Array.from(lines)].filter(Boolean), { clearProps: 'all' });
    };
  });

  // Phones and reduced motion: no pin. The photo is shown whole, the
  // statement and cards simply sit in flow and count once on enter.
  mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
    story.classList.add('is-static');
    if (reducedMotion()) cards.forEach((card) => setCount(card.querySelector('[data-count]')!, 1));
    // The photo stays in the viewport while the blocks scroll over it
    // (styles.css), and stays the same photo throughout (review round 2).
    return () => story.classList.remove('is-static');
  });

  // Phones: a short version of step 1, without a pin. The About block is one
  // screen tall with the photo showing through the mark at its foot; over
  // the next 70% of a screen of scrolling the mark grows until the photo
  // fills the (sticky) frame, the copy fades, and the statement arrives on
  // the darkened photo. Scrolling back reverses it.
  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
    story.classList.add('is-masked');
    const mask = { p: 0 };
    const draw = () => {
      const a = phoneStartBox(media);
      const b = endBox(media);
      const p = mask.p;
      applyMask(media, { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, s: a.s + (b.s - a.s) * p });
      about.dataset.navTheme = p > 0.8 ? 'dark' : 'light';
    };
    draw();
    ScrollTrigger.addEventListener('refresh', draw);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: story, start: 'top top', end: () => `+=${window.innerHeight * 0.7}`, scrub: true, invalidateOnRefresh: true },
    });
    tl.to(mask, { p: 1, duration: 1, ease: 'power2.in', onUpdate: draw }, 0)
      .to(about, { opacity: 0, duration: 0.55 }, 0.1)
      // Late, so it never greys the Chalk still showing around the mark.
      .fromTo(shade, { opacity: 0 }, { opacity: 0.45, duration: 0.15 }, 0.85);
    if (statement) tl.fromTo(statement, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.7);
    return () => {
      ScrollTrigger.removeEventListener('refresh', draw);
      story.classList.remove('is-masked');
      about.dataset.navTheme = 'light';
      ['--mask-x', '--mask-y', '--mask-w', '--mask-h'].forEach((name) => media.style.removeProperty(name));
      gsap.set([about, statement, shade].filter(Boolean), { clearProps: 'opacity' });
    };
  });
}
