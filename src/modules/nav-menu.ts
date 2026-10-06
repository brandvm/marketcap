// Menu sheet. Every [data-nav-toggle] (the bar's toggle on
// tablet/phone, Nav Float's toggle everywhere) opens the nav links as a Chalk
// sheet from the right, over a scrim. Escape, the scrim, a link click or the
// toggle again closes it; focus returns to the toggle that opened it. While
// open the page doesn't scroll.
// Markup: [data-nav] › [data-nav-toggle] (aria-controls → [data-nav-menu]),
// [data-nav-scrim]. On desktop the same links are the inline menu while the
// bar is on screen, and turn into the sheet once it has gone (.is-float).
import { lenis } from './smooth-scroll';

// transition.ts closes the sheet when a link inside it starts a transition.
let close: () => void = () => {};
export const closeNavMenu = () => close();

export function initNavMenu() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const toggles = Array.from(nav?.querySelectorAll<HTMLButtonElement>('[data-nav-toggle]') ?? []);
  const menu = nav?.querySelector<HTMLElement>('[data-nav-menu]');
  const scrim = nav?.querySelector<HTMLElement>('[data-nav-scrim]');
  if (!nav || !toggles.length || !menu) return;

  const compact = window.matchMedia('(max-width: 991px)');
  const isSheet = () => compact.matches || nav.classList.contains('is-float');
  let opener: HTMLButtonElement = toggles[0];

  // Hidden from keyboard and screen readers only while it is a closed sheet;
  // as the inline desktop menu the links stay reachable.
  const syncInert = () => menu.toggleAttribute('inert', isSheet() && !nav.classList.contains('is-open'));

  const setOpen = (open: boolean) => {
    if (open === nav.classList.contains('is-open')) return;
    nav.classList.toggle('is-open', open);
    toggles.forEach((t) => t.setAttribute('aria-expanded', String(open)));
    document.documentElement.classList.toggle('is-menu-open', open);
    if (open) lenis?.stop();
    else lenis?.start();
    syncInert();
  };

  close = () => setOpen(false);
  toggles.forEach((toggle) =>
    toggle.addEventListener('click', () => {
      opener = toggle;
      setOpen(!nav.classList.contains('is-open'));
    }),
  );
  scrim?.addEventListener('click', () => setOpen(false));
  menu.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    setOpen(false);
    // The bar's toggle may have scrolled away; fall back to the float one.
    (opener.offsetParent ? opener : toggles[toggles.length - 1]).focus();
  });
  compact.addEventListener('change', () => {
    if (!isSheet()) setOpen(false);
    syncInert();
  });
  // .is-float flips as the bar leaves or returns.
  new MutationObserver(() => {
    if (!isSheet()) setOpen(false);
    syncInert();
  }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  syncInert();
}
