// The pinned Finsweet distribution does not ship TypeScript declarations.
// Chunk names are specific to @finsweet/attributes@2.7.1: check them when
// upgrading (attributes.js maps each attribute key to its src-*.js file).
declare module '@finsweet/attributes/dist/src-T7SM3ONB.js' {
  export interface ListItem { element: HTMLElement }
  export interface List {
    instance: string | null;
    wrapperElement: HTMLElement;
    items: { value: ListItem[] };
    addHook(key: 'afterRender', callback: (items: ListItem[]) => void): void;
  }
  export function init(): Promise<{ result: List[]; destroy(): void }>;
}

declare module '@finsweet/attributes/dist/src-42KUKVDL.js' {
  export function init(): Promise<{ result: unknown[]; destroy(): void }>;
}
