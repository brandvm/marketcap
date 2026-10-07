// Page transitions with Barba (docs/page-transition-plan.md).
//
// Default: Osmo Supply "Overlapping Parallax" — the new page slides up over
// the current one, which drifts up 25vh under an 80% overlay. The leave and
// enter timelines, the "parallax" ease and the z-index layering are Osmo's,
// unchanged apart from imports and our overlay colour (Ironstone, set in the
// Designer on Transition Dark).
//
// to-development: a link into a development that shows its image
// ([data-transition-image], Dev Card and Home Hero Card) — the image grows
// from where it sits on screen into the development hero's background
// ([data-transition-target] on the template's S Bg), then the page fades in
// under it and the hero intro plays.
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

// Copies class and aria-current from the next page's [data-barba-update]
// nodes onto the persistent nav's (Osmo boilerplate, typed).
function initBarbaNavUpdate(html: string) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  const nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  const currentNodes = document.querySelectorAll('[data-nav] [data-barba-update]');
  currentNodes.forEach((curr, index) => {
    const next = nextNodes[index];
    if (!next) return;
    const status = next.getAttribute('aria-current');
    if (status !== null) curr.setAttribute('aria-current', status);
    else curr.removeAttribute('aria-current');
    curr.setAttribute('class', next.getAttribute('class') || '');
  });
}

// -----------------------------------------
// TO-DEVELOPMENT: image zoom into the hero
// -----------------------------------------

let zoomClone: HTMLImageElement | null = null;
let pendingHash = '';

const sourceImage = (trigger: unknown) =>
  trigger instanceof Element ? trigger.querySelector<HTMLImageElement>('[data-transition-image] img') : null;

function runZoomLeave(current: HTMLElement, trigger: unknown) {
  const img = sourceImage(trigger);
  const transitionWrap = document.querySelector<HTMLElement>('[data-transition-wrap]')!;
  const transitionDark = transitionWrap.querySelector<HTMLElement>('[data-transition-dark]')!;
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

  tl.set(transitionWrap, { zIndex: 2 });
  tl.fromTo(transitionDark, { autoAlpha: 0 }, { autoAlpha: 0.8, duration: 1.1, ease: 'parallax' }, 0);
  tl.set(transitionDark, { autoAlpha: 0 });
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

// webflow.js binds forms, Turnstile, dropdowns and IX2 once per full load.
function reinitWebflow(html: string) {
  const page = html.match(/<html[^>]*\sdata-wf-page="([^"]+)"/)?.[1];
  if (page) document.documentElement.dataset.wfPage = page;
  const wf = (window as WebflowHost).Webflow;
  try {
    wf?.destroy?.();
    wf?.ready?.();
    wf?.require?.('ix2')?.init?.();
    releaseWebflowAnchors();
  } catch (error) {
    console.warn('[transition] Webflow re-init failed', error);
  }
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

  barba.hooks.beforeLeave(() => closeNavMenu());

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
    if (isSwap(data)) initBarbaNavUpdate(data.next.html);
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
    reinitWebflow(data.next.html);
    initPage();
    refreshNavState();
    lenis?.resize();
    lenis?.start();
    ScrollTrigger.refresh();
    jumpToHash();
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
        to: { namespace: ['development'] },
        custom: ({ trigger }) => !reducedMotion() && !!sourceImage(trigger),
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
