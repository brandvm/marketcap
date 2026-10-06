// Per-instance placeholders. Webflow can't bind a form field's placeholder to
// a component prop (nor set it through the API), so a component exposes a
// text prop bound to data-placeholder and this copies it over at runtime.
// The Designer canvas shows the input's own placeholder setting.
// Markup: <input data-placeholder="…"> (Searchable Select › Placeholder prop).
export function initPlaceholders() {
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[data-placeholder], textarea[data-placeholder]').forEach((field) => {
    const text = field.dataset.placeholder?.trim();
    if (text) field.placeholder = text;
  });
}
