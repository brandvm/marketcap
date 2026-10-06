// Tablet / phone menu (≤ 991px). The toggle opens the nav links as a Chalk
// panel under the bar; Escape, a link click or growing past 991px closes it.
// While open the page doesn't scroll and the bar stays shown.
// Markup: [data-nav] › [data-nav-toggle] (aria-controls → [data-nav-menu]).
// In Webflow the native Navbar element could do this too; this module keeps
// the custom nav structure (G | Nav W › Nav Component) unchanged.
import { lenis } from './smooth-scroll';

export function initNavMenu() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const toggle = nav?.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = nav?.querySelector<HTMLElement>('[data-nav-menu]');
  if (!nav || !toggle || !menu) return;

  const compact = window.matchMedia('(max-width: 991px)');
  // The panel is hidden from keyboard and screen readers only while it is a
  // closed panel; on desktop the same links are the inline menu.
  const syncInert = () => {
    const closed = compact.matches && !nav.classList.contains('is-open');
    menu.toggleAttribute('inert', closed);
  };

  const setOpen = (open: boolean) => {
    nav.classList.toggle('is-open', open);
    nav.classList.remove('is-hidden');
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('is-menu-open', open);
    if (open) lenis?.stop();
    else lenis?.start();
    syncInert();
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  menu.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    setOpen(false);
    toggle.focus();
  });
  compact.addEventListener('change', () => {
    if (!compact.matches) setOpen(false);
    syncInert();
  });
  syncInert();
}
