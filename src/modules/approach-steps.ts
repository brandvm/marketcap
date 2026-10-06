// Our Approach: five steps (Acquire → Lease). On desktop the section pins and
// scroll advances the progress rule and the active step; clicking a step
// scrolls to its position. Below 768px the steps are a plain list.
// Markup: [data-approach] with [data-approach-progress] and [data-step]
// buttons; [data-approach-bg] parallaxes.
import { gsap, ScrollTrigger, reducedMotion } from './gsap';
import { lenis } from './smooth-scroll';

export function initApproachSteps() {
  const root = document.querySelector<HTMLElement>('[data-approach]');
  if (!root) return;
  const steps = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-step]'));
  const progress = root.querySelector<HTMLElement>('[data-approach-progress]');
  const bg = root.querySelector<HTMLElement>('[data-approach-bg]');
  // One photo per step ([data-step-media], same order as the steps); the
  // active one cross-fades in.
  const media = Array.from(root.querySelectorAll<HTMLElement>('[data-step-media]'));
  if (!steps.length) return;

  // Fill (px from the rule's left edge) that reaches step i's marker, and the
  // whole rule after the last step.
  const stops = () => {
    if (!progress) return [] as number[];
    const origin = progress.getBoundingClientRect().left;
    const full = root.querySelector<HTMLElement>('.steps-list-track')?.offsetWidth ?? 0;
    const xs = steps.map((step) => ((step.querySelector('.marker') ?? step) as HTMLElement).getBoundingClientRect().right - origin);
    return [...xs, full];
  };
  // Scroll-driven fill: at progress i/n the rule reaches marker i; at 1 the
  // rule is complete.
  const fillAt = (p: number) => {
    if (!progress) return;
    const xs = stops();
    const n = steps.length;
    const t = Math.min(n, Math.max(0, p * n));
    const i = Math.min(n - 1, Math.floor(t));
    gsap.set(progress, { width: xs[i] + (xs[i + 1] - xs[i]) * (t - i) });
  };

  const setActive = (index: number, animateFill = true) => {
    media.forEach((m, i) => m.classList.toggle('is-active', i === Math.min(index, media.length - 1)));
    steps.forEach((step, i) => {
      step.classList.toggle('is-active', i === index);
      step.classList.toggle('is-done', i < index);
      step.setAttribute('aria-current', i === index ? 'step' : 'false');
    });
    if (progress && animateFill) {
      // Click / phone modes: jump the fill to this step (the last completes it).
      const xs = stops();
      gsap.to(progress, { width: index === steps.length - 1 ? xs[xs.length - 1] : xs[index], duration: 0.5, ease: 'power2.out' });
    }
  };
  setActive(0);

  if (reducedMotion()) {
    steps.forEach((step, i) => step.addEventListener('click', () => setActive(i)));
    return;
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    let current = 0;
    const trigger = ScrollTrigger.create({
      trigger: root,
      pin: true,
      pinSpacing: true, // explicit: see story-sequence.ts (flex parents)
      start: 'top top',
      end: `+=${steps.length * 45}%`,
      scrub: true,
      onUpdate: (self) => {
        fillAt(self.progress);
        const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        if (index !== current) {
          current = index;
          setActive(index, false);
        }
      },
      onRefresh: (self) => fillAt(self.progress),
    });
    if (bg) gsap.fromTo(bg, { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: () => trigger.end, scrub: true } });

    const onClick = (i: number) => () => {
      const y = trigger.start + ((i + 0.5) / steps.length) * (trigger.end - trigger.start);
      if (lenis) lenis.scrollTo(y);
      else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    const handlers = steps.map((step, i) => {
      const h = onClick(i);
      step.addEventListener('click', h);
      return h;
    });
    return () => steps.forEach((step, i) => step.removeEventListener('click', handlers[i]));
  });

  mm.add('(max-width: 767px)', () => {
    const handlers = steps.map((step, i) => {
      const h = () => setActive(i);
      step.addEventListener('click', h);
      return h;
    });
    return () => steps.forEach((step, i) => step.removeEventListener('click', handlers[i]));
  });
}
