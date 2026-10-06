// Finsweet Attributes v2, bundled from the pinned npm release instead of the
// CDN tag (see GOTCHAS). Only the List and Combo Box distributions are
// imported. Both no-op unless Webflow markup carries their attributes:
// - Combo Box: the Searchable Select component ([fs-combobox-element]);
// - List: a Collection List with fs-list-element="list". Sort reads the
//   Searchable Select's hidden select (fs-list-element="sort-trigger"), which
//   Combo Box updates with input and change events.
//
// Imported with import(): esbuild bundles them but only evaluates them when
// called. List registers a CSS property at evaluation, which throws if the
// bundle is ever evaluated twice, and other pages skip the work entirely.
import type { List } from '@finsweet/attributes/dist/src-T7SM3ONB.js';

type FinsweetHost = typeof window & {
  FinsweetAttributes?: {
    scripts?: HTMLScriptElement[];
    modules?: Record<string, unknown>;
  };
};

// The distributions expect the globals the CDN loader would create: List
// reads script-level defaults from `scripts`, and Combo Box waits on
// `modules.list?.loading` (it throws if `modules` is missing). An array keeps
// the standard callback queue if another Attributes script ever loads.
function prepareHost() {
  const host = window as FinsweetHost;
  host.FinsweetAttributes ||= [] as unknown as NonNullable<FinsweetHost['FinsweetAttributes']>;
  host.FinsweetAttributes.scripts ||= [];
  host.FinsweetAttributes.modules ||= {};
}

let started: Promise<List[]> | undefined;

// One List init per page. init() builds an instance for every
// [fs-list-element="list"] it finds, so a second call would wrap the same
// lists again. A module that needs the instances shares this promise.
export function startLists(): Promise<List[]> {
  if (started) return started;
  prepareHost();
  // Deferred a microtask so modules that run after this one can still set
  // attributes init() must see.
  started = Promise.resolve()
    .then(() => import('@finsweet/attributes/dist/src-T7SM3ONB.js'))
    .then(({ init }) => init())
    .then(({ result }) => result);
  return started;
}

export function initFinsweet() {
  const hasCombobox = !!document.querySelector('[fs-combobox-element="dropdown"]');
  const hasList = !!document.querySelector('[fs-list-element="list"]');
  if (!hasCombobox && !hasList) return;
  prepareHost();

  if (hasCombobox) {
    // Waits for Webflow's own JS (the Dropdown) before it builds the options.
    import('@finsweet/attributes/dist/src-42KUKVDL.js')
      .then(({ init }) => init())
      .catch((error: unknown) => {
        console.warn('[finsweet] Combo Box unavailable', error);
      });
  }
  if (hasList) {
    startLists().catch((error: unknown) => {
      // The list still shows in its CMS order if enhancement fails.
      console.warn('[finsweet] List unavailable', error);
    });
  }
}
