// Capabilities: the list works like tabs — the active item is full opacity,
// the photo inside the logo-mark collage cross-fades to match. In Webflow
// this maps onto the native Tabs element (no JS); this module only adds the
// cross-fade and the reveal of the collage on enter.
// Autoplay (review round 1): while the section is on screen the list steps
// to the next item every AUTOPLAY_MS, so the photos change even for someone
// scrolling past. It waits while the pointer is over the list or focus is
// inside it (hover and keys still pick an item), carries on from that item
// afterwards, and is off under reduced motion. A line under the active item
// fills as its time runs out (round 1 follow-up).
// Markup: [data-caps] with [data-cap] buttons (data-image, data-alt) and a
// [data-cap-media] <img>.
import { gsap, ScrollTrigger, reducedMotion } from './gsap';

const AUTOPLAY_MS = 3000;

export function initCapabilities() {
  const root = document.querySelector<HTMLElement>('[data-caps]');
  if (!root) return;
  const items = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-cap]'));
  const media = root.querySelector<HTMLImageElement>('[data-cap-media]');
  if (!items.length || !media) return;

  // Warm the cache so the swap is instant.
  items.forEach((item) => {
    const img = new Image();
    img.src = item.dataset.image ?? '';
  });

  let active = -1;
  let onChange = () => {}; // set by the autoplay below
  const select = (index: number) => {
    if (index !== active) {
      active = index;
      onChange();
    }
    items.forEach((item, i) => {
      item.classList.toggle('is-active', i === index);
      item.setAttribute('aria-selected', String(i === index));
      item.tabIndex = i === index ? 0 : -1;
    });
    const next = items[index];
    if (media.getAttribute('src') === next.dataset.image) return;
    // Webflow publishes responsive images with srcset/sizes, which win over
    // src; drop them so the swapped photo actually shows.
    const swap = () => {
      media.removeAttribute('srcset');
      media.removeAttribute('sizes');
      media.src = next.dataset.image ?? '';
      media.alt = next.dataset.alt ?? '';
    };
    if (reducedMotion()) {
      swap();
      return;
    }
    gsap.to(media, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        swap();
        gsap.to(media, { opacity: 1, duration: 0.45 });
      },
    });
  };

  items.forEach((item, i) => {
    item.addEventListener('click', () => select(i));
    item.addEventListener('mouseenter', () => select(i));
    // Tabs keyboard pattern: one tab stop, arrows / Home / End move and select.
    item.addEventListener('keydown', (event) => {
      const last = items.length - 1;
      const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      const next = (to + items.length) % items.length;
      items[next].focus();
      select(next);
    });
  });
  select(Math.max(0, items.findIndex((i) => i.classList.contains('is-active'))));

  if (!reducedMotion()) {
    const list = items[0].closest<HTMLElement>('[data-cap-list]') ?? items[0].parentElement?.parentElement ?? root;
    let inView = false;
    let held = false; // pointer over the list or focus inside it
    // The time left on the active item, 0 → 1, drawn as a line under it
    // (--cap-progress, styles.css). It restarts whenever the item changes
    // and waits while the section is off screen or the list is held.
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
    const sync = () => tween.paused(!inView || held);
    onChange = () => {
      tween.restart();
      write();
      sync();
    };
    root.setAttribute('data-cap-auto', 'true');
    ScrollTrigger.create({
      trigger: root,
      start: 'top 75%',
      end: 'bottom 25%',
      onToggle: (self) => {
        inView = self.isActive;
        sync();
      },
    });
    const hold = (value: boolean) => {
      held = value;
      sync();
    };
    list.addEventListener('pointerenter', () => hold(true));
    list.addEventListener('pointerleave', () => hold(list.contains(document.activeElement)));
    list.addEventListener('focusin', () => hold(true));
    list.addEventListener('focusout', (event) => hold(list.contains(event.relatedTarget as Node | null) || list.matches(':hover')));
  }

  // Guide line, marker and the collage's top edge sit midway in the gap
  // between the section heading and the list, whatever the heading wraps to.
  const heading = root.querySelector<HTMLElement>('[data-cap-heading]');
  const list = root.querySelector<HTMLElement>('[data-cap-list]');
  const place = () => {
    if (!heading || !list) return;
    const box = root.getBoundingClientRect();
    const y = (heading.getBoundingClientRect().bottom + list.getBoundingClientRect().top) / 2 - box.top;
    root.style.setProperty('--cap-y', `${Math.round(y)}px`);
  };
  place();
  new ResizeObserver(place).observe(root);
  document.fonts?.ready.then(place);

  // The collage rises into view on tablet and desktop only; on phones it is
  // simply there (review, 2026-10-13).
  if (!reducedMotion()) {
    gsap.matchMedia().add('(min-width: 768px)', () => {
      gsap.from(media, { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: media, start: 'top 85%' } });
    });
  }
}
