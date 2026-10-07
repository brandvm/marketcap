// Photo Band (development template): the full-bleed photo draws in to an
// inset frame as it scrolls past — Section/Padding H clear at the top and
// sides, 4px corners, flush with the next section at the bottom (Figma
// "Image after scroll"). The section is clipped, so the page background
// shows around it; the content (value tag) moves in by the same inset so it
// keeps its place inside the frame.
// Markup: <section data-band-inset> (Photo Band component root) with its
// content wrapper [data-band-content]. Off under reduced motion: the band
// stays full width.
import { gsap, reducedMotion } from './gsap';

const RADIUS = 4;

export function initBandInset() {
  if (reducedMotion()) return;
  document.querySelectorAll<HTMLElement>('[data-band-inset]').forEach((band) => {
    // Section/Padding H, read from the section's own padding at each refresh.
    const pad = () => parseFloat(getComputedStyle(band).paddingLeft) || 0;
    const content = band.querySelector<HTMLElement>('[data-band-content]');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: band,
        start: 'top 60%',
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    tl.fromTo(
      band,
      { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
      { clipPath: () => `inset(${pad()}px ${pad()}px 0px ${pad()}px round ${RADIUS}px)`, ease: 'none', immediateRender: false },
      0,
    );
    if (content) tl.fromTo(content, { x: 0, y: 0 }, { x: () => pad(), y: () => pad(), ease: 'none', immediateRender: false }, 0);
  });
}
