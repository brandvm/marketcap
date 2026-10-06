// Lightbox: a [data-lightbox] trigger (gallery image) opens the image large
// in a <dialog> (top layer, focus kept inside, Escape closes), with a row of
// thumbnails of the whole set underneath. The image fits the space left
// above the thumbnails, 1em clear of the viewport edges.
//   · The set is the group's [data-lightbox-item]s — in Webflow a hidden
//     Collection List of the project's multi-image field, so the popup can
//     show more images than the page — or, without those, its triggers.
//   · Opening starts on the clicked image; thumbnails and ← → switch it.
// Markup: [data-lightbox-group] › button[data-lightbox] holding an <img>;
// optional img[data-lightbox-item] elements (hidden) for the full set;
// optional data-full on an <img> for a larger file. Page scroll pauses.
import { gsap, reducedMotion } from './gsap';
import { lenis } from './smooth-scroll';

const imgOf = (el: Element) => (el instanceof HTMLImageElement ? el : el.querySelector('img'));
const srcOf = (img: HTMLImageElement) => img.dataset.full ?? img.getAttribute('src') ?? '';

export function initLightbox() {
  const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-lightbox]'));
  if (!triggers.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Image viewer');
  dialog.innerHTML = `
    <div class="lightbox-stage"><img class="lightbox-media" alt=""></div>
    <div class="lightbox-thumbs" role="group" aria-label="All images"></div>
    <button class="icon-box lightbox-close" type="button" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12"/></svg>
    </button>`;
  document.body.append(dialog);
  const media = dialog.querySelector<HTMLImageElement>('.lightbox-media')!;
  const strip = dialog.querySelector<HTMLElement>('.lightbox-thumbs')!;
  let set: HTMLImageElement[] = [];
  let index = 0;
  let opener: HTMLElement | null = null;

  const show = (i: number, animate = true) => {
    index = (i + set.length) % set.length;
    const img = set[index];
    media.src = srcOf(img);
    media.alt = img.alt;
    strip.querySelectorAll('.gallery-thumb').forEach((t, n) => {
      t.classList.toggle('is-active', n === index);
      t.setAttribute('aria-pressed', String(n === index));
      if (n === index) (t as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    if (animate && !reducedMotion()) gsap.fromTo(media, { opacity: 0.4 }, { opacity: 1, duration: 0.35 });
  };

  const open = (trigger: HTMLElement) => {
    opener = trigger;
    const group = trigger.closest('[data-lightbox-group]') ?? document.body;
    const items = Array.from(group.querySelectorAll<HTMLElement>('[data-lightbox-item]'));
    set = (items.length ? items : Array.from(group.querySelectorAll<HTMLElement>('[data-lightbox]')))
      .map(imgOf)
      .filter((img): img is HTMLImageElement => !!img);
    const clicked = imgOf(trigger);
    const start = Math.max(0, set.findIndex((img) => clicked && srcOf(img) === srcOf(clicked)));
    if (clicked && !set.some((img) => srcOf(img) === srcOf(clicked))) set.unshift(clicked);

    strip.innerHTML = '';
    strip.hidden = set.length < 2;
    set.forEach((img, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gallery-thumb';
      b.setAttribute('aria-label', `Image ${n + 1}: ${img.alt}`);
      b.innerHTML = `<img class="gallery-thumb-media" src="${srcOf(img)}" alt="">`;
      b.addEventListener('click', () => show(n));
      strip.append(b);
    });

    dialog.showModal();
    show(start, false);
    lenis?.stop();
    if (!reducedMotion()) gsap.fromTo(media, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' });
  };

  triggers.forEach((t) => t.addEventListener('click', () => open(t)));
  dialog.querySelector('.lightbox-close')!.addEventListener('click', () => dialog.close());
  // A click on the backdrop area (the dialog or the stage, not the image) closes it.
  dialog.addEventListener('click', (event) => {
    const t = event.target as Element;
    if (t === dialog || t.classList.contains('lightbox-stage')) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') show(index + 1);
    else if (event.key === 'ArrowLeft') show(index - 1);
  });
  dialog.addEventListener('close', () => {
    lenis?.start();
    opener?.focus();
  });
}
