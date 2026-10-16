// Page transitions with Barba (docs/page-transition-plan.md).
//
// Default: Osmo Supply "Overlapping Parallax" — the new page slides up over
// the current one, which drifts up 25vh under an 80% overlay. The leave and
// enter timelines, the "parallax" ease and the z-index layering are Osmo's,
// unchanged apart from imports and our overlay colour (Ironstone, set in the
// Designer on Transition Dark).
//
// to-development: a link into a development that shows its image
// ([data-transition-image], Dev Card and Home Hero Card), with at least half
// of that image on screen — the image grows
// from where it sits on screen into the development hero's background
// ([data-transition-target] on the template's S Bg) over the unchanged
// page, then the new page fades in under it and the hero intro plays.
//
// Markup: G | Page W [data-barba="wrapper"] › G | Transition
// [data-transition-wrap] › [data-transition-dark], and G | Main W
// [data-barba="container"][data-barba-namespace]. Pages without the wrapper
// (/design/*) keep normal page loads.
import barba from '@barba/core';
import { CustomEase } from 'gsap/CustomEase';
import { gsap, ScrollTrigger, reducedMotion } from './gsap';
import { lenis, jumpToHash, releaseWebflowAnchors } from './smooth-scroll';
import { refreshNavState } from './nav-state';
import { closeNavMenu } from './nav-menu';

gsap.registerPlugin(CustomEase);

type PageHooks = {
  initPage: () => void;
  destroyPage: () => void;
};

type WebflowHost = typeof window & {
  Webflow?: { destroy?: () => void; ready?: () => void; require?: (name: string) => { init?: () => void } | undefined };
  jQuery?: (target: Document) => { off: (event: string) => unknown; trigger: (event: string) => unknown };
  turnstile?: { remove: (widget: Element | string) => void };
  dataLayer?: unknown[];
};

// -----------------------------------------
// OSMO: PAGE TRANSITIONS (unchanged)
// -----------------------------------------

function resetPage(container: HTMLElement) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: 'position,top,left,right' });
  if (lenis) {
    lenis.resize();
    lenis.start();
  }
}

function runPageLeaveAnimation(current: HTMLElement) {
  const transitionWrap = document.querySelector<HTMLElement>('[data-transition-wrap]')!;
  const transitionDark = transitionWrap.querySelector<HTMLElement>('[data-transition-dark]')!;

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    },
  });

  if (reducedMotion()) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(transitionWrap, { zIndex: 2 });
  tl.fromTo(transitionDark, { autoAlpha: 0 }, { autoAlpha: 0.8, duration: 1.2, ease: 'parallax' }, 0);
  tl.fromTo(current, { y: '0vh' }, { y: '-25vh', duration: 1.2, ease: 'parallax' }, 0);
  tl.set(transitionDark, { autoAlpha: 0 });

  return tl;
}

function runPageEnterAnimation(next: HTMLElement) {
  const tl = gsap.timeline();

  if (reducedMotion()) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add('pageReady');
    tl.call(resetPage, [next], 'pageReady');
    return new Promise<void>((resolve) => tl.call(resolve, undefined, 'pageReady'));
  }

  tl.add('startEnter', 0);
  tl.set(next, { zIndex: 3 });
  tl.fromTo(next, { y: '100vh' }, { y: '0vh', duration: 1.2, clearProps: 'all', ease: 'parallax' }, 'startEnter');
  tl.add('pageReady');
  tl.call(resetPage, [next], 'pageReady');

  return new Promise<void>((resolve) => {
    tl.call(resolve, undefined, 'pageReady');
  });
}

// Links outside the Barba container (Nav, G | Transition) keep the first
// page's current state. Webflow publishes `w--current` + aria-current="page"
// on links whose path is the page's own path and that carry no #hash
// (/#about on Home is not current), so apply the same rule after each swap.
const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

function syncCurrentLinks(container: HTMLElement) {
  const here = normalizePath(location.pathname);
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    if (container.contains(link)) return; // fresh from the server
    const url = new URL(link.getAttribute('href')!, location.href);
    const current = url.origin === location.origin && !url.hash && normalizePath(url.pathname) === here;
    link.classList.toggle('w--current', current);
    if (current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

// Barba swaps the container and the <title>, not the rest of <head>: copy
// the page-specific tags (SEO, social previews, JSON-LD from page settings
// and page head code) so tools reading the live DOM see the right page.
const HEAD_TAGS = [
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'link[rel="canonical"]',
  'script[type="application/ld+json"]',
].join(',');

function syncHead(html: string) {
  const next = new DOMParser().parseFromString(html, 'text/html');
  document.head.querySelectorAll(HEAD_TAGS).forEach((el) => el.remove());
  next.head.querySelectorAll(HEAD_TAGS).forEach((el) => document.head.appendChild(document.importNode(el, true)));
}

// -----------------------------------------
// TO-DEVELOPMENT: image zoom into the hero
// -----------------------------------------

let zoomClone: HTMLImageElement | null = null;
let pendingHash = '';

const sourceImage = (trigger: unknown) =>
  trigger instanceof Element ? trigger.querySelector<HTMLImageElement>('[data-transition-image] img') : null;

// The zoom only runs from an image the visitor can actually see: at least
// half of it inside the viewport (review round 1). A card that is mostly
// off screen, or a link without an image (nav, footer), gets the default
// transition.
const zoomable = (trigger: unknown) => {
  const img = sourceImage(trigger);
  if (!img) return false;
  const r = img.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
  const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  return w > 0 && h > 0 && (w * h) / (r.width * r.height) >= 0.5;
};

function runZoomLeave(current: HTMLElement, trigger: unknown) {
  const img = sourceImage(trigger);
  const tl = gsap.timeline({ onComplete: () => current.remove() });

  if (img) {
    // A fixed clone at exactly the image's spot on screen, over everything
    // but Nav Float; the original hides so there's no double.
    const r = img.getBoundingClientRect();
    const clone = document.createElement('img');
    clone.src = img.currentSrc || img.src;
    clone.alt = '';
    clone.setAttribute('aria-hidden', 'true');
    Object.assign(clone.style, {
      position: 'fixed',
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
      objectFit: 'cover',
      objectPosition: getComputedStyle(img).objectPosition,
      borderRadius: getComputedStyle(img.closest('[data-transition-image]') ?? img).borderRadius,
      zIndex: '99',
      margin: '0',
      pointerEvents: 'none',
    });
    document.body.append(clone);
    img.style.visibility = 'hidden';
    zoomClone = clone;
  }
  // Only the leaving page's followers: the next container is already in the
  // DOM, and its buttons must keep visibility (cursor-button.ts fades opacity).
  current.querySelectorAll<HTMLElement>('[data-cursor-button]').forEach((b) => gsap.set(b, { autoAlpha: 0 }));

  // No dark overlay here (review round 1): it tinted the light footer while
  // the image grew. The page stays as it is until the clone, by then the
  // size of the new hero, covers it; the empty tween only holds the old
  // page for the length of the zoom.
  tl.to({}, { duration: 1.1 });
  return tl;
}

function decode(src: string) {
  const img = new Image();
  img.src = src;
  // Never hold the hand-over longer than a moment for a slow image.
  return Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 900))]);
}

async function runZoomEnter(next: HTMLElement) {
  const clone = zoomClone;
  const target = next.querySelector<HTMLImageElement>('[data-transition-target] img');
  gsap.set(next, { zIndex: 3, autoAlpha: 0 });
  if (!clone || !target) return runPageEnterAnimation(next);

  // The hero sits at the top of the fixed new page, so its rect is where the
  // background will be once the page settles at scroll 0.
  const to = target.getBoundingClientRect();
  const hiRes = target.currentSrc || target.src;
  const ready = decode(hiRes).then(() => {
    if (hiRes) clone.src = hiRes;
  });

  const tl = gsap.timeline();
  tl.to(clone, { left: to.left, top: to.top, width: to.width, height: to.height, borderRadius: 0, duration: 1.1, ease: 'parallax' }, 0);
  await Promise.all([tl.then(), ready]);
  const fade = gsap.timeline();
  fade.to(next, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' });
  await fade.then();
  gsap.set(next, { clearProps: 'opacity,visibility,zIndex' });
  resetPage(next);
  clone.remove();
  zoomClone = null;
}

// -----------------------------------------
// WEBFLOW RUNTIME after a swap
// -----------------------------------------

// The leaving page's Turnstile widgets: Turnstile keeps resetting them after
// their forms are gone ("Cannot find Widget …") unless they are removed.
function removeTurnstile(container: HTMLElement) {
  const ts = (window as WebflowHost).turnstile;
  if (!ts) return;
  container.querySelectorAll('form [name="cf-turnstile-response"]').forEach((input) => {
    const holder = input.closest('form > div');
    try {
      if (holder) ts.remove(holder);
    } catch {
      /* already gone */
    }
  });
}

// webflow.js binds forms, Turnstile, dropdowns and IX2 once per full load.
// Forms: when Turnstile is already loaded, webflow.js renders each form's
// widget from `$(document).on('ready')`, an event jQuery 3 never fires, so
// after a swap no widget appears and Webflow keeps every submit disabled.
// Drop the previous page's handlers, let Webflow bind the new forms, then
// fire that event once: each widget renders when its form nears the viewport.
function reinitWebflow(html: string) {
  const page = html.match(/<html[^>]*\sdata-wf-page="([^"]+)"/)?.[1];
  if (page) document.documentElement.dataset.wfPage = page;
  const host = window as WebflowHost;
  const wf = host.Webflow;
  try {
    host.jQuery?.(document).off('ready');
    wf?.destroy?.();
    wf?.ready?.();
    wf?.require?.('ix2')?.init?.();
    if (host.turnstile) host.jQuery?.(document).trigger('ready');
    releaseWebflowAnchors();
  } catch (error) {
    console.warn('[transition] Webflow re-init failed', error);
  }
}

// -----------------------------------------
// FOCUS AND ANNOUNCEMENT after a swap
// -----------------------------------------

// A full load starts keyboard and screen-reader users at the top of the new
// page; a swap would leave focus on the link that was clicked, now gone.
// Move focus to the section a #hash landed on, or to <main>, without
// scrolling ([tabindex="-1"] draws no ring, styles.css §07), and announce
// the new page's title in a polite live region outside the container.
let announcer: HTMLElement | null = null;

function focusPage(container: HTMLElement) {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = (id && document.getElementById(id)) || container.querySelector<HTMLElement>('main') || container;
  if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }
  // Cleared first so the same title (back and forth) is announced again.
  announcer.textContent = '';
  const title = document.title;
  requestAnimationFrame(() => {
    if (announcer) announcer.textContent = title;
  });
}

function pushPageView() {
  const host = window as WebflowHost;
  (host.dataLayer ||= []).push({ event: 'virtual_page_view', page_path: location.pathname, page_title: document.title });
}

// -----------------------------------------
// BARBA
// -----------------------------------------

export function initTransition({ initPage, destroyPage }: PageHooks): boolean {
  if (!document.querySelector('[data-barba="wrapper"]') || !document.querySelector('[data-barba="container"]')) return false;
  if (!document.querySelector('[data-transition-wrap]')) return false;

  history.scrollRestoration = 'manual';
  CustomEase.create('parallax', '0.7, 0.05, 0.13, 1');

  // Capture phase: runs before Barba's own click handler.
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
      pendingHash = link ? new URL(link.href, location.href).hash : '';
    },
    true,
  );

  barba.hooks.beforeLeave((data) => {
    closeNavMenu();
    removeTurnstile(data.current.container);
  });

  barba.hooks.afterLeave(() => destroyPage());

  // Barba also runs the enter hooks on first load (no current page): they
  // only apply to a real swap.
  const isSwap = (data: { current: { container?: HTMLElement } }) => !!data.current?.container;

  barba.hooks.beforeEnter((data) => {
    if (!isSwap(data)) return;
    const next = data.next.container as HTMLElement;
    // Position new container on top
    gsap.set(next, { position: 'fixed', top: 0, left: 0, right: 0 });
    lenis?.stop();
    // The hero intro plays after the transition: keep its items hidden
    // while the page slides or fades in (hero-intro.ts sets the same start).
    const heroItems = next.querySelectorAll('[data-hero-item]');
    if (heroItems.length && !reducedMotion()) gsap.set(heroItems, { opacity: 0 });
  });

  barba.hooks.enter((data) => {
    if (isSwap(data)) syncHead(data.next.html);
  });

  barba.hooks.afterEnter((data) => {
    if (!isSwap(data)) return;
    // Barba pushes the URL without its hash (/#approach from Contact) and
    // doesn't report it in data.next.url: put back the clicked link's hash so
    // jumpToHash() below lands on the section.
    const hash = pendingHash;
    pendingHash = '';
    if (hash && !location.hash && data.trigger instanceof Element) {
      history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
    }
    syncCurrentLinks(data.next.container as HTMLElement);
    reinitWebflow(data.next.html);
    initPage();
    refreshNavState();
    lenis?.resize();
    lenis?.start();
    ScrollTrigger.refresh();
    jumpToHash();
    focusPage(data.next.container as HTMLElement);
    pushPageView();
  });

  barba.init({
    debug: false,
    timeout: 7000,
    preventRunning: true,
    prevent: ({ el, href }) => {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return true;
      if (url.pathname.startsWith('/design')) return true;
      // Same-page anchors belong to Lenis (smooth-scroll.ts).
      if (url.pathname === location.pathname && url.hash) return true;
      return (el as Element).closest?.('[data-barba-prevent]') != null;
    },
    transitions: [
      {
        name: 'to-development',
        sync: true,
        // custom sits inside `to` on purpose: Barba overwrites a root-level
        // rule's result with the `to` check, so a root custom is ignored
        // whenever `to` is set (GOTCHAS 2026-10-13).
        to: {
          namespace: ['development'],
          custom: ({ trigger }) => !reducedMotion() && zoomable(trigger),
        },
        leave: (data) => runZoomLeave(data.current.container as HTMLElement, data.trigger).then(),
        enter: (data) => runZoomEnter(data.next.container as HTMLElement),
      },
      {
        name: 'default',
        sync: true,
        // First load: nothing to animate (Osmo's once only resets the page,
        // which would undo the /#hash jump in smooth-scroll.ts).
        once: () => Promise.resolve(),
        leave: (data) => runPageLeaveAnimation(data.current.container as HTMLElement).then(),
        enter: (data) => runPageEnterAnimation(data.next.container as HTMLElement),
      },
    ],
  });
  return true;
}
