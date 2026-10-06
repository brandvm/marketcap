# Page transition plan — Osmo "Overlapping Parallax" with Barba

Prepared 2026-10-06, after Home was finished. **Built the same day** (see
"Status" at the end); D1–D6 went with the recommendations.
Source: Osmo Supply resource "Overlapping Parallax Page Transition"
(Barba 2.10.3, Lenis, GSAP 3.15 + CustomEase) and its Barba boilerplate.

## What the transition does

The new page slides up from the bottom (100vh → 0) over the current page,
which drifts up 25vh while an 80% dark overlay fades in over it. Both moves
take 1.2 s on the custom ease `parallax` (0.7, 0.05, 0.13, 1). Reduced
motion swaps instantly.

**Kept exactly as Osmo built it:** the leave/enter timelines, the ease,
−25vh / 100vh, the 0.8 overlay, the z-index layering (wrap 2, next page 3),
the reduced-motion path, `data-transition-*` attribute names.

## Decisions for Kajal (before building)

| # | Question | Recommendation |
| --- | --- | --- |
| D1 | Footer inside the Barba container? It must move with the page, or it stays put while the old page slides away. | Yes: Footer moves inside G \| Main W (see Webflow step W2). |
| D2 | Overlay colour: Osmo uses `#000`. | Ironstone (`#260B07`), so the darkening reads as brand, not grey. |
| D3 | Nav stays outside the container (one bar, one Nav Float for the whole visit). | Yes. The bar itself is inside the old page visually only at the very top; it scrolls away anyway. Its state is reset per page (repo step R6). |
| D4 | Links that should still do a full page load (style guide, media, anything under `/design`). | `data-barba-prevent="self"` on those links; `/design/*` excluded in `prevent` too. |
| D5 | Analytics: GTM is in Global Components. Page views after a transition need a History Change trigger in GTM, or a `dataLayer` push from the bundle. | Bundle pushes `{ event: 'virtual_page_view', page_path, page_title }` in `afterEnter`; Kajal adds the GTM trigger when GTM goes in. |
| D6 | Duration: 1.2 s is long for a site with heavy scroll scenes. | Keep 1.2 s first, judge on staging. |

## Webflow changes (Designer / MCP)

- **W1 · Wrapper.** `data-barba="wrapper"` on **G | Page W** (body keeps no
  attribute; Global Components with GTM stays above it and never re-runs).
- **W2 · Container.** `data-barba="container"` on **G | Main W**, and move the
  Footer instance from G | Page W into G | Main W, after `main#main`
  (D1). Every page gets the same structure; the order in the published HTML is
  then `G | Page W › G | Nav W, G | Transition, G | Main W › main, footer`.
- **W3 · Namespace.** `data-barba-namespace` on each page's G | Main W: `home`,
  `developments`, `development` (CMS template), `contact`, `style-guide`,
  `404`.
- **W4 · Transition element.** New component **G | Transition** (placed on every
  page, inside G | Page W, outside the container):
  - `G | Transition` — fixed, inset 0, z-index 100, pointer-events none,
    overflow clip; attribute `data-transition-wrap`.
  - child `Transition Dark` — absolute, inset 0, 100% × 100%, opacity 0,
    background Ironstone (D2); attribute `data-transition-dark`.
  - All Designer-expressible: classes, not repo CSS.
  - Mind `.wf-empty` on the empty child: padding 0, font-size inherit.
- **W5 · Nav links.** `data-barba-update` on each Nav Link and Footer Link, so
  `w--current` / `aria-current` follow the page (the boilerplate's
  `initBarbaNavUpdate` copies class and aria-current from the next page).
  Footer links are inside the container after W2, so only Nav links need it.
- **W6 · Prevent.** `data-barba-prevent="self"` on links that must load fully
  (D4). mailto/tel/external/`#` links are skipped by Barba already.

## Repo changes

Libraries are bundled, not CDN (AGENTS.md: a sibling `<script defer>` can't be
ordered against the dynamically appended bundle):
`pnpm add @barba/core`; `CustomEase` comes from the installed `gsap` package;
Lenis is already bundled. `lenis.css` rules (if any are missing) go in repo CSS,
tagged `third-party`.

### R1 · Page lifecycle in `src/index.ts`

The manifest splits in two:

- **Global, once per visit:** `environment-switcher`, `smooth-scroll` (the one
  Lenis — the boilerplate's `initLenis` is not added), `nav-state`, `nav-menu`,
  `cursor-button` pointer tracking, `transition` (new module holding the Osmo
  code + Barba init).
- **Page, per container:** every other module, each called as
  `init(container)` and returning a cleanup. Each runs inside
  `gsap.context(fn, container)`, so `ctx.revert()` kills its tweens,
  ScrollTriggers and `gsap.matchMedia` in one call. The cleanup only has to
  remove what GSAP doesn't own: listeners, observers, timers, appended nodes.

```ts
// sketch
const pageCleanups: Array<() => void> = [];
function runPage(name, init, container) {
  try {
    const ctx = gsap.context(() => {
      const cleanup = init(container);
      if (cleanup) pageCleanups.push(cleanup);
    }, container);
    pageCleanups.push(() => ctx.revert());
  } catch (error) { console.error(`[bv] ${name} failed`, error); }
}
function destroyPage() { while (pageCleanups.length) pageCleanups.pop()!(); }
```

This replaces the boilerplate's `ScrollTrigger.getAll().forEach(kill)` in
`afterLeave`, which would also kill triggers that belong to the nav.

### R2 · Module-by-module

| Module | Today | Needed |
| --- | --- | --- |
| `hero-intro` | runs on boot | page module; runs on every entry to a page with `[data-hero]`, after enter. `html.is-loading` only on first load (Osmo `once`). |
| `story-sequence` | pin, matchMedia, refresh listener | page module, **after enter** (container is `position: fixed` during enter, pins measure wrong). Cleanup: `refresh` listener. |
| `timeline` | pin, matchMedia, 1 window listener | after enter. Cleanup: window listener. |
| `dev-cards` | sticky + triggers, matchMedia | after enter (sticky inside a fixed container breaks). |
| `approach-steps` | pin, matchMedia, step click listeners | after enter; listeners on container elements die with it. |
| `count-up` | once-triggers | page module (context revert). |
| `capabilities` | ResizeObserver, listeners | page module; cleanup: `ResizeObserver.disconnect()`. |
| `brand-lines` | trigger, section pointer listeners | page module; listeners are on the section, die with it. |
| `cursor-button` | window `pointermove` + scroll listener, per-card areas | split: pointer tracking global (once); card areas per page. |
| `slider` | 1 window listener | page module; cleanup: window listener. |
| `lightbox` | appends a `<dialog>` to `body` | page module; cleanup: remove the dialog, unlock scroll. |
| `custom-select` | appends a popover list to `body`, document listeners | page module; cleanup: remove nodes and document listeners. |
| `finsweet` | Combo Box + List Sort, init once | page module: restart the Finsweet modules on the Developments page after each entry (`window.FinsweetAttributes.modules.list.restart()` / combobox), see GOTCHAS (Finsweet 2.7.1). |
| `smooth-scroll` | Lenis + anchor clicks + hash on load | stays global. Add: after a cross-page link with a hash (`/#approach` from Contact), scroll to the hash after enter, reusing `jumpToHashOnLoad`. Same-page `#` clicks keep going to Lenis, never to Barba. |
| `nav-state` | `is-solid`, `is-float`, theme scan of `main .section` | stays global; on each enter: recompute `is-solid` (does the new page have `[data-hero]`?) and re-collect the themed sections from the new container. Expose `refreshNavState()`. |
| `nav-menu` | sheet open/close | stays global; close the sheet on `beforeLeave` (a sheet link can start a transition). |
| `environment-switcher` | staging badge | global. |

### R3 · Transition module (`src/modules/transition.ts`)

- Osmo's `runPageOnceAnimation`, `runPageLeaveAnimation`,
  `runPageEnterAnimation`, `resetPage`, `initBarbaNavUpdate`, unchanged apart
  from imports.
- Barba hooks:
  - `beforeLeave`: close nav sheet.
  - `afterLeave`: `destroyPage()` (R1) instead of killing every trigger.
  - `beforeEnter`: next container fixed on top (as Osmo); `lenis.stop()`;
    copy the next page's `data-wf-page` onto `<html>` (R4).
  - `enter`: `initBarbaNavUpdate`.
  - `afterEnter`: run page modules on the new container, `refreshNavState()`,
    hash scroll if any, Webflow re-init (R4), `lenis.resize()/start()`,
    `ScrollTrigger.refresh()`, analytics push (D5).
- `prevent`: same-page hash links, `/design/*`, `data-barba-prevent`.
- `debug: false` on staging and production.
- Osmo's `themeConfig` / `applyThemeFrom` is **not** added: the nav already
  themes itself from the sections under it (`data-nav-theme`), and the
  overlay colour is fixed (D2).

### R4 · Webflow runtime after a swap

webflow.js binds forms, Turnstile, dropdowns and IX2 once per full load. After
each enter:

```ts
document.documentElement.dataset.wfPage = nextHtmlWfPage; // parsed from data.next.html
window.Webflow?.destroy();
window.Webflow?.ready();
window.Webflow?.require?.('ix2')?.init();
document.dispatchEvent(new Event('readystatechange'));
```

Without it the Contact form and the footer newsletter don't submit after a
transition. Test both after navigating in, not only on direct load.

### R5 · `<head>`

Barba swaps the container only; it updates `document.title`. Meta
description, canonical, OG and per-page JSON-LD stay from the first page.
Crawlers load real pages, so SEO is unaffected. Optional: copy
`meta[name=description]` and `link[rel=canonical]` from `data.next.html` in
`afterEnter` for share-sheet correctness.

## Second transition: development image zooms into the hero

Kajal, 2026-10-06: when a link to a development is clicked and it shows that
development's image, the image grows from where it is on screen into the
development page's hero background. Every other link keeps the parallax
transition.

**Where it applies.** Links into the Developments CMS template that carry an
image of the item:
- Home hero card (Hero Card thumbnail);
- Dev Card (Home and the Developments listing): the card's photo;
- the template's "Other development" card.

The target is the template hero's **S Bg Media** image (the CMS main image,
under the hero's gradient overlay).

**Webflow (W7).**
- `data-transition-image` on the image inside each of those links (in the Dev
  Card and Hero Card components, so every instance has it);
- `data-transition-target` on the template hero's S Bg Media image.
Both are attributes on existing elements: no new classes.

**How it runs (R3, a second Barba transition `to-development`).**
- Barba picks it with a rule: the clicked link contains
  `[data-transition-image]` and the next namespace is `development`. No image
  (e.g. a text link in the footer) → falls back to the parallax.
- On leave, before anything moves:
  - read the image's on-screen rect, `currentSrc` and object-position;
  - put a fixed clone (`<img>`, object-fit cover) at exactly that rect,
    above the page (z-index above the overlay, below Nav Float);
  - hide the original so there's no double.
- Leave: the old page fades/darkens under the clone (the Osmo overlay at
  0.8, no −25vh drift, so nothing pulls focus from the image).
- Enter: the new page is placed on top but transparent; the clone animates
  from its card rect to the hero's rect (full width × hero height at
  scroll 0) and its radius to 0, on the `parallax` ease, ~1.0–1.2 s. A
  slight scale-in (1.08 → 1) on the clone reads as the "zoom".
- Hand-over: when the clone lands, the new page fades in (0.3 s) with its
  hero image already decoded at the same source, then the clone is removed.
  The hero intro (title, facts, buttons) plays after the hand-over, as on a
  direct load.
- Same image file: the card and the hero both use the item's main image, so
  the clone's source is what the hero shows. The hero image is preloaded
  from `data.next.html` (`img.decode()`) before the hand-over, so no
  flash.
- Reduced motion: no zoom, instant swap (same as the parallax path).
- Back button (development → listing): plain parallax. Reverse zoom only if
  Kajal asks for it later.

**Edge cases to test.**
- A card scrolled half off screen: the clone starts from the visible rect
  (clipped) and still lands on the hero.
- Dev Card's sticky stack: read the rect of the card that was clicked
  (topmost), not a covered one.
- Hero card thumbnail is small and square-ish: object-fit cover on the clone
  keeps it filled as the aspect ratio changes.
- Item without an image: no `[data-transition-image]` → parallax.
- Cursor button (Dev Card "View" follower) hidden as the transition starts.

## Webflow canvas

Nothing changes on the canvas: Barba and the transition run only on published
pages. The G | Transition element is invisible (opacity 0, pointer-events
none).

## Test plan

- Every pair of pages both ways (Home ↔ Developments ↔ Development ↔ Contact),
  plus back/forward buttons, at 1440, 820 and 390.
- After each transition: pins and sticky cards at the right scroll positions,
  counters count, Approach steps, Capabilities tabs, slider, lightbox open and
  close, Searchable Select sorts the list, Contact form submits, newsletter
  submits, nav sheet opens, Nav Float theme correct on the new page.
- Cross-page anchors: Contact → `/#approach` lands on Approach.
- Image zoom from each source (Home hero card, Home dev card, listing dev
  card, "Other development") into the template hero; no flash at the
  hand-over; hero intro plays after.
- No leaked listeners or triggers: `ScrollTrigger.getAll().length` returns to
  the same count after Home → Contact → Home.
- Reduced motion: instant swap, no pins.
- Direct loads still work exactly as today (first load = Osmo `once`).

## Order of work

1. Kajal answers D1–D6.
2. Webflow: W1–W7 (MCP; the Footer move and the G | Transition component in
   one batch, classes approved first; W7 attributes in Dev Card, Hero Card
   and the template hero).
3. Repo: R1 lifecycle + page-module conversion (no visual change; test that
   direct loads still match the current site).
4. Repo: R3 transition module (parallax default + `to-development` image
   zoom), R4 Webflow re-init, R5 head.
5. Test plan on staging; log surprises in GOTCHAS.md.

Best done when at least Developments and Contact have real content, so the
transition is tested against real pages, not empty shells.

## Status (2026-10-06, built)

- Webflow: W1–W5 and W7 done on Home, Developments, the development template,
  Contact and 404 (G | Transition component, Footer inside G | Main W,
  namespaces `home`, `developments`, `development`, `contact`, `404`).
  `/design/*` pages have no Barba wrapper: they always load fully.
- Repo: `src/modules/transition.ts` (parallax + `to-development` zoom),
  page lifecycle in `src/index.ts`, refresh hooks in nav-state, nav-menu,
  smooth-scroll and finsweet.
- New pages built for it: the development template hero (CMS-bound: title,
  image, address, facts, stats with count-up, CTA) and the Developments page
  head + Dev List (CMS, newest first, titles h2).
- Open: MANUAL-TODO V (Searchable Select into the Page Head slot) and W (Dev
  Card link on the Developments page); Finsweet List Sort on the Developments
  list still needs its `fs-list` attributes; Contact has no content yet.
