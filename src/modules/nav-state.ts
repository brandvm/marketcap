// Nav behaviour.
//   · The bar scrolls away with the page (G | Nav W is absolute). Glass over
//     the hero; solid Chalk from the start on pages without [data-hero].
//   · Once the bar is fully off screen, Nav Float (CTA + menu button, fixed
//     top right) fades in: [data-nav] gets .is-float. Scrolling back to the
//     top hands over to the bar again.
//   · Nav Float takes the opposite of what's under it: .is-dark (light
//     boxes) over dark sections, dark boxes over light ones. A section is
//     dark if it is Section + Is Ironstone, unless [data-nav-theme] says
//     otherwise; the innermost themed element at the bar's height wins
//     (story-sequence.ts switches Story as its photo floods the frame).
// Markup: [data-nav] › [data-nav-float]; optional [data-hero],
// [data-nav-theme="dark|light"].
// After a page transition (transition.ts) the bar's solid state and the
// themed sections belong to the new page: refreshNavState() re-reads both.
let refresh: () => void = () => {};
export const refreshNavState = () => refresh();

export function initNavState() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;

  // Pages without a dark hero (listing, contact, style guide) start solid.
  const setSolid = () => nav.classList.toggle('is-solid', !document.querySelector('[data-hero]'));
  setSolid();

  // The bar's own box (the fixed float and panel inside it don't count).
  // On desktop .is-float also turns the inline links into the closed sheet;
  // with transitions on, that swap would visibly slide them out (and back
  // in on the way up). .is-swapping turns them off for that frame.
  const setFloat = (value: boolean) => {
    if (nav.classList.contains('is-float') === value) return;
    nav.classList.add('is-swapping');
    nav.classList.toggle('is-float', value);
    requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove('is-swapping')));
  };
  new IntersectionObserver(([entry]) => setFloat(!entry.isIntersecting)).observe(nav);

  const float = nav.querySelector<HTMLElement>('[data-nav-float]');
  if (!float) {
    refresh = setSolid;
    return;
  }
  const depth = (el: Element) => { let d = 0; for (let n = el.parentElement; n; n = n.parentElement) d++; return d; };
  let themed: HTMLElement[] = [];
  let depths = new Map<HTMLElement, number>();
  const collect = () => {
    themed = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-theme], main .section, .g-footer-w'));
    depths = new Map(themed.map((el) => [el, depth(el)]));
  };
  collect();
  const themeOf = (el: HTMLElement) => el.dataset.navTheme ?? (el.classList.contains('is-ironstone') ? 'dark' : 'light');
  let queued = false;
  const update = () => {
    queued = false;
    const y = float.offsetHeight / 2;
    let hit: HTMLElement | null = null;
    for (const el of themed) {
      const r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom > y && (!hit || depths.get(el)! > depths.get(hit)!)) hit = el;
    }
    float.classList.toggle('is-dark', !!hit && themeOf(hit) === 'dark');
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  // Story's theme flips mid-pin without a scroll of its own element.
  new MutationObserver(queue).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-nav-theme'] });
  update();
  refresh = () => {
    setSolid();
    collect();
    update();
  };
}
