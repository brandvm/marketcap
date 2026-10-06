// @barba/core 2.10.3 ships a "types" path (dist/core/src/typings) that isn't
// in the package, so TypeScript can't find its declarations. This covers the
// part of the API transition.ts uses.
declare module '@barba/core' {
  interface BarbaPage {
    container: HTMLElement;
    html: string;
    namespace: string;
    url: { href: string; path?: string; hash?: string };
  }
  interface BarbaData {
    current: BarbaPage;
    next: BarbaPage;
    trigger: HTMLElement | 'barba' | 'back' | 'forward' | 'popstate';
  }
  interface BarbaTransition {
    name?: string;
    sync?: boolean;
    from?: { namespace?: string[] };
    to?: { namespace?: string[] };
    custom?: (data: BarbaData) => boolean;
    once?: (data: BarbaData) => Promise<unknown> | void;
    leave?: (data: BarbaData) => Promise<unknown> | void;
    enter?: (data: BarbaData) => Promise<unknown> | void;
  }
  type Hook = (fn: (data: BarbaData) => unknown) => void;
  const barba: {
    init(options: {
      debug?: boolean;
      timeout?: number;
      preventRunning?: boolean;
      prevent?: (args: { el: HTMLElement; href: string; event: Event }) => boolean;
      transitions?: BarbaTransition[];
    }): void;
    hooks: {
      beforeLeave: Hook;
      afterLeave: Hook;
      beforeEnter: Hook;
      enter: Hook;
      afterEnter: Hook;
    };
  };
  export default barba;
}
