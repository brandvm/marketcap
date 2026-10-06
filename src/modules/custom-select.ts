// Searchable select (combobox). Same structure as Finsweet Attributes'
// Combo Box, so Webflow can use either this module or Finsweet:
//   [data-select] (Dropdown)
//     › .select-toggle (Dropdown Toggle) › input[role=combobox] + icon
//     › ul[role=listbox] (Dropdown List) — options are built here
//     › <select> (hidden; holds the value for forms / Finsweet List Sort)
// Typing filters the options; arrows move, Enter picks, Escape closes.
// Picking sets the native select and fires `change` on it. The open list
// is portalled to the top layer (Popover API), above everything.

export function initCustomSelect() {
  document.querySelectorAll<HTMLElement>('[data-select]').forEach((root, n) => {
    const input = root.querySelector<HTMLInputElement>('[role="combobox"]');
    // Webflow publishes a List element with role="list", so fall back to
    // the class and restore the listbox role here.
    const list = root.querySelector<HTMLUListElement>('[role="listbox"], .select-list');
    const native = root.querySelector<HTMLSelectElement>('select');
    if (!input || !list || !native) return;
    list.setAttribute('role', 'listbox');

    const options = Array.from(native.options).filter((o) => o.value !== '');
    list.innerHTML = '';
    const items = options.map((o, i) => {
      const li = document.createElement('li');
      li.className = 'select-option';
      li.id = `${list.id || `select-${n}`}-opt-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(o.selected && o.value === native.value));
      li.dataset.value = o.value;
      li.textContent = o.textContent;
      list.append(li);
      return li;
    });
    const empty = document.createElement('li');
    empty.className = 'select-empty';
    empty.textContent = 'No matches';
    empty.hidden = true;
    list.append(empty);

    let active = -1;
    const visible = () => items.filter((li) => !li.hidden);
    const label = () => native.selectedOptions[0]?.value ? native.selectedOptions[0].textContent ?? '' : '';

    const setActive = (li?: HTMLElement) => {
      items.forEach((x) => x.classList.toggle('is-active', x === li));
      active = li ? items.indexOf(li as HTMLLIElement) : -1;
      if (li) {
        input.setAttribute('aria-activedescendant', li.id);
        li.scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    };
    // Portal: the open list goes to the browser's top layer (Popover API),
    // so nothing on the page can cover it and no Section can clip it. It is
    // placed against the toggle and opens upward when the viewport has no
    // room below. Without popover support it stays absolute (.is-up flips it).
    const toggle = root.querySelector<HTMLElement>('.select-toggle') ?? input;
    const portal = typeof list.showPopover === 'function';
    if (portal) list.setAttribute('popover', 'manual');
    const place = () => {
      const box = toggle.getBoundingClientRect();
      const gap = 4;
      const below = window.innerHeight - box.bottom;
      const up = below < list.offsetHeight + gap * 2 && box.top > below;
      root.classList.toggle('is-up', up);
      if (!portal) return;
      list.style.left = `${box.left}px`;
      list.style.width = `${box.width}px`;
      list.style.top = up ? `${box.top - list.offsetHeight - gap}px` : `${box.bottom + gap}px`;
    };
    const follow = () => { if (!list.hidden) place(); };
    const open = (show: boolean) => {
      root.classList.toggle('is-open', show);
      list.hidden = !show;
      if (portal) {
        if (show && !list.matches(':popover-open')) list.showPopover();
        if (!show && list.matches(':popover-open')) list.hidePopover();
      }
      if (show) {
        place();
        window.addEventListener('scroll', follow, { passive: true });
        window.addEventListener('resize', follow);
      } else {
        window.removeEventListener('scroll', follow);
        window.removeEventListener('resize', follow);
      }
      input.setAttribute('aria-expanded', String(show));
      if (!show) {
        setActive();
        input.value = label();
        items.forEach((li) => (li.hidden = false));
        empty.hidden = true;
      }
    };
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      items.forEach((li) => (li.hidden = q !== '' && !li.textContent!.toLowerCase().includes(q)));
      empty.hidden = visible().length > 0;
      setActive(visible()[0]);
    };
    const pick = (li: HTMLElement) => {
      native.value = li.dataset.value ?? '';
      items.forEach((x) => x.setAttribute('aria-selected', String(x === li)));
      native.dispatchEvent(new Event('change', { bubbles: true }));
      open(false);
    };

    input.value = label();
    list.hidden = true;
    input.addEventListener('focus', () => { input.select(); open(true); });
    input.addEventListener('click', () => open(true));
    input.addEventListener('input', () => { open(true); filter(); });
    input.addEventListener('keydown', (event) => {
      const vis = visible();
      const at = vis.indexOf(items[active]);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (list.hidden) open(true);
        const next = event.key === 'ArrowDown' ? Math.min(vis.length - 1, at + 1) : Math.max(0, at - 1);
        setActive(vis[next]);
      } else if (event.key === 'Enter') {
        if (!list.hidden && items[active] && !items[active].hidden) { event.preventDefault(); pick(items[active]); }
      } else if (event.key === 'Escape') {
        if (!list.hidden) { event.preventDefault(); open(false); }
      } else if (event.key === 'Tab') open(false);
    });
    // mousedown, not click: keeps focus in the input so blur doesn't close first
    list.addEventListener('mousedown', (event) => {
      const li = (event.target as Element).closest<HTMLElement>('.select-option');
      event.preventDefault();
      if (li) pick(li);
    });
    list.addEventListener('mousemove', (event) => {
      const li = (event.target as Element).closest<HTMLElement>('.select-option');
      if (li) setActive(li);
    });
    input.addEventListener('blur', () => open(false));
    root.querySelector('.select-icon')?.addEventListener('mousedown', (event) => {
      event.preventDefault();
      if (list.hidden) input.focus();
      else open(false);
    });
  });
}
