// Our Story timeline (reference: "Scroll Ruler Interaction.mp4").
// The section pins; scrolling slides the CMS list sideways so each milestone
// in turn sits at the centre of the frame. The centred item is active: full
// opacity, photo in, long connector to its pill. Scroll snaps to each item;
// clicking a pill scrolls to it. Works for any number of CMS items.
// Markup: [data-timeline] › [data-timeline-viewport] › [data-timeline-track]
// › [data-era] items, each holding a [data-era-pill] button.
// Below 768px (and with reduced motion) the list is a plain vertical stack.
import { gsap, ScrollTrigger } from './gsap';
import { lenis } from './smooth-scroll';

export function initTimeline() {
  const root = document.querySelector<HTMLElement>('[data-timeline]');
  if (!root) return;
  const viewport = root.querySelector<HTMLElement>('[data-timeline-viewport]');
  const track = root.querySelector<HTMLElement>('[data-timeline-track]');
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-era]'));
  if (!viewport || !track || !items.length) return;
  const pills = items.map((item) => item.querySelector<HTMLButtonElement>('[data-era-pill]'));

  let active = -1;
  // The active photo opens to its full width over 0.7s, which moves the item
  // centres; while that runs, keep the track following the live layout.
  let follow: (() => void) | null = null;
  const setActive = (index: number) => {
    if (index === active) return;
    active = index;
    if (follow) gsap.to({}, { duration: 0.75, onUpdate: follow });
    items.forEach((item, i) => item.classList.toggle('is-active', i === index));
    pills.forEach((pill, i) => {
      pill?.classList.toggle('is-active', i === index);
      pill?.setAttribute('aria-pressed', String(i === index));
    });
  };

  // x that puts the (fractional) item `at` in the centre of the viewport.
  const xFor = (at: number) => {
    const centres = items.map((item) => item.offsetLeft + item.offsetWidth / 2);
    const i = Math.min(items.length - 1, Math.max(0, Math.floor(at)));
    const next = Math.min(items.length - 1, i + 1);
    const c = centres[i] + (centres[next] - centres[i]) * (at - i);
    return viewport.clientWidth / 2 - c;
  };

  const startIndex = Math.max(0, items.findIndex((item) => item.classList.contains('is-active')));
  const last = items.length - 1;
  const mm = gsap.matchMedia();

  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    if (last === 0) {
      setActive(0);
      gsap.set(track, { x: () => xFor(0) });
      return;
    }
    const state = { at: 0 };
    const trigger = ScrollTrigger.create({
      trigger: root,
      pin: true,
      pinSpacing: true, // explicit: Section is display:flex (see story-sequence.ts)
      start: 'top top',
      end: () => `+=${last * 70}%`,
      scrub: true,
      snap: { snapTo: 1 / last, duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut', delay: 0.05 },
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        state.at = self.progress * last;
        gsap.set(track, { x: xFor(state.at) });
        setActive(Math.round(state.at));
      },
      onRefresh: (self) => gsap.set(track, { x: xFor(self.progress * last) }),
    });
    follow = () => gsap.set(track, { x: xFor(state.at) });
    gsap.set(track, { x: xFor(0) });
    setActive(0);

    const handlers = pills.map((pill, i) => {
      const go = () => {
        const y = trigger.start + (i / last) * (trigger.end - trigger.start);
        if (lenis) lenis.scrollTo(y, { duration: 1.1 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
      };
      pill?.addEventListener('click', go);
      return go;
    });
    return () => {
      follow = null;
      pills.forEach((pill, i) => pill?.removeEventListener('click', handlers[i]));
      gsap.set(track, { clearProps: 'transform' });
    };
  });

  // Reduced motion on desktop: no pin, pills switch the centred item.
  mm.add('(min-width: 768px) and (prefers-reduced-motion: reduce)', () => {
    const show = (i: number) => {
      setActive(i);
      gsap.set(track, { x: xFor(i) });
    };
    show(startIndex);
    const handlers = pills.map((pill, i) => {
      const h = () => show(i);
      pill?.addEventListener('click', h);
      return h;
    });
    const onResize = () => gsap.set(track, { x: xFor(active) });
    window.addEventListener('resize', onResize);
    return () => {
      pills.forEach((pill, i) => pill?.removeEventListener('click', handlers[i]));
      window.removeEventListener('resize', onResize);
    };
  });

  // Phones: every milestone is shown in a vertical list.
  mm.add('(max-width: 767px)', () => {
    items.forEach((item) => item.classList.add('is-active'));
    return () => items.forEach((item) => item.classList.remove('is-active'));
  });

}
