// Slider (Development plans): a native horizontal scroll with scroll-snap;
// the prev / next buttons move it by one item and disable at the ends.
// Swipe, trackpad and keyboard scrolling work without JS.
// Markup: [data-slider] › [data-slider-track] (items inside), and
// [data-slider-prev] / [data-slider-next] buttons anywhere in [data-slider].
// Works for any number of items (CMS multi-image or Collection List).
export function initSlider() {
  document.querySelectorAll<HTMLElement>('[data-slider]').forEach((root) => {
    const track = root.querySelector<HTMLElement>('[data-slider-track]');
    const prev = root.querySelector<HTMLButtonElement>('[data-slider-prev]');
    const next = root.querySelector<HTMLButtonElement>('[data-slider-next]');
    if (!track) return;

    const step = () => {
      const item = track.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item ? item.offsetWidth + gap : track.clientWidth;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };

    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
}
