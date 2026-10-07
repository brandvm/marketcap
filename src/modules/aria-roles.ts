// Restores ARIA roles Webflow overwrites on publish. A Collection List's
// inner list and items always publish role="list" / "listitem", which breaks
// a table built from one (Program rows). Give the element data-aria-role and
// this sets the real role.
// Markup: <div class="w-dyn-items" data-aria-role="rowgroup">,
//         <div class="w-dyn-item" data-aria-role="row">
export function initAriaRoles() {
  document.querySelectorAll<HTMLElement>('[data-aria-role]').forEach((el) => {
    const role = el.dataset.ariaRole?.trim();
    if (role) el.setAttribute('role', role);
  });
}
