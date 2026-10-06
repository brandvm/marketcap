# Gotchas

A running log of things that cost time on this project. Agents read it at
the start of every session and add to it when they hit something new (see
the Session protocol in `AGENTS.md`). Never delete an entry — update its
`Status` instead.

Entries tagged `Scope: template-candidate` are harvested across all client
repos to improve `brandvm/wf-template`.

## Entry format

```md
### YYYY-MM-DD · Short title
- Area: designer | css | loader | release | mcp | ci | js | perf
- Scope: project | template-candidate
- Symptom: what was observed
- Cause: why it happened
- Fix: what was done, or the workaround
- Status: open | fixed <sha> | upstreamed wf-template <sha>
- Found by: claude | codex | human
```

## This project

### 2026-10-02 · Only one collection can take breakpoint auto-modes
- Area: mcp
- Scope: template-candidate
- Symptom: `create_variable_mode` with `breakpoint_id` worked for Typography
  Role, then failed for Layout with `[Conflict] The operation could not be
  applied to the style block store` (BATCH_FAILED), even for one mode alone.
- Cause: unconfirmed — most likely a breakpoint can drive the auto-mode of
  one collection only, and Typography Role already held medium/small/tiny.
- Fix: Layout modes created without `breakpoint_id`; the Body tag style sets
  the Layout mode at Tablet, Mobile Landscape and Mobile instead (the
  ThreeStars/Reformd pattern). Either do the same for every responsive
  collection, or pick the one collection that gets auto-modes up front.
- Status: open
- Found by: claude

### 2026-10-02 · Style MCP rejects variables on row-gap / column-gap
- Area: mcp
- Scope: template-candidate
- Symptom: `create_style` failed with `Property row-gap does not support
  setting a variable of type length`; the failure also blocked every combo
  of that class (`Parent style "S Wrapper" not found`).
- Cause: the MCP only accepts variables on the legacy gap names.
- Fix: bind `grid-row-gap` / `grid-column-gap` instead — they render as
  `row-gap` / `column-gap` on flex and grid alike.
- Status: open
- Found by: claude

### 2026-10-02 · "Label" is a reserved class name
- Area: mcp
- Scope: template-candidate
- Symptom: `Style with name Label is reserved and cannot be used`.
- Cause: Webflow reserves names of its own elements.
- Fix: class is `Label Text` (same as ThreeStars); the Typography Styles
  mode stays `Label`. Update 2026-10-05: only the API refuses the name —
  a `Label` class can be created in the Designer (see the Form entry).
- Status: fixed
- Found by: claude

### 2026-10-02 · Tag styles other than body are unreachable by MCP
- Area: mcp
- Scope: template-candidate
- Symptom: `update_style` on `h1` / `All H1 Headings` → `Style "h1" not
  found`; `create_style` would only make a class.
- Cause: Webflow creates heading/paragraph/link tag styles lazily, the first
  time they are styled in the Designer. `body` exists from the start.
- Fix: set All H1–H6 Headings and All Paragraphs (margin 0) and All Links
  (color inherit) once in the Designer; after that the MCP can update them.
  Confirmed 2026-10-05: just selecting the tag in the Selector field does
  not create the style. A property must be set. Once it is, the style is
  addressable as `h1` (id `default-h1`) and up, `p` and `a`. It
  carries Webflow's defaults (h1 38px / 700 / margin-bottom 10px), and
  `set_style_variable_mode` works on it. `get_styles` lists only `body`
  until then.
- Status: workaround confirmed
- Found by: claude

### 2026-10-02 · Filling in REPO in loader.html breaks the browser tests
- Area: ci
- Scope: template-candidate
- Symptom: The first push after setup fails `pnpm test` with
  `Expected: "https://brandvm.github.io/wf-example/"`, `Received:
  ".../marketcap/"`, so staging never deploys.
- Cause: `tests/environment-switcher.spec.mjs` replaced the `REPO`
  placeholder with `wf-example` and hardcoded that name in `stage` and
  `release`. The README checklist tells every project to fill in `REPO`,
  so the replacement no longer happens and the hardcoded URLs no longer
  match the bundle's.
- Fix: the test reads the repo name back from `var SITE = "…"` in the
  loader and builds `stage`/`release` from it. That works whether or not
  REPO has been filled in.
- Status: fixed in this repo (same commit as this entry); not upstreamed
- Found by: claude

<!-- Add new entries here, newest first. -->

### 2026-10-05 · `mode_id: "base"` fails on variable updates
- Area: mcp
- Scope: template-candidate
- Symptom: `update_*_variable` with `mode_id: "base"` returned `An internal
  error occurred` (OPERATION_FAILED) for every variable, while the same
  call with a named mode id (Tablet, Mobile…) succeeded. `get_variables`
  does list the default mode as `modeId: "base"`.
- Cause: the update API does not accept the id it reports for the
  default mode.
- Fix: omit `mode_id` to write the Base mode value. Checked: the other
  modes' values stay as they were.
- Status: open
- Found by: claude

### 2026-10-05 · Style values containing `var()` collapse to one variable
- Area: mcp
- Scope: template-candidate
- Symptom: `create_style` with `property_value`
  `calc(var(--_layout---section--padding-h) * -1)` stored a plain binding
  to Section/Padding H (positive). A `linear-gradient(…var(--a)…, var(--b))`
  and a `box-shadow: 0 0 0 1em var(--c)` both stored only the first
  variable. The call reports success.
- Cause: the API detects a Webflow variable name in the value string and
  replaces the whole value with a binding to the first variable it
  finds.
- Fix: never send a value that mixes `var()` with math, gradients or
  shadows. Bind single variables with `variable_as_value`; set calc,
  gradient and shadow values that reference variables in the Designer
  (variable picker), and read them back.
  Update 2026-10-05: the read side is lossy as well. Kajal's
  Designer-entered `calc(⟨Section/Padding H⟩ * -1)` on Slider Track and
  `calc(100% + ⟨Spacing/4⟩)` on Select List both read back through
  `query_styles` as a plain `{id}` binding. A calc value therefore can't
  be confirmed through the MCP; check it on the canvas.
- Status: open
- Found by: claude

### 2026-10-05 · "Form" is a reserved class name; outline-width takes no variable
- Area: mcp
- Scope: template-candidate
- Symptom: `create_style` "Form" → `Style with name Form is reserved and
  cannot be used` (like "Label"). `outline-width` bound to Spacing/2 →
  `Property outline-width does not support setting a variable of type
  length`; the whole create failed.
- Cause: Webflow reserves its element names; the style API only accepts
  variables on some length properties (see the row-gap entry above).
- Fix: the reservation is on API create only. Kajal created "Form" (and
  "Label") in the Designer, after which `update_style` styled Form
  normally. So: create a reserved name in the Designer, then style it
  through the MCP. Outline width set as the literal 0.125em (Spacing/2's
  value) on Gallery Thumb › Is Active.
- Status: workaround confirmed
- Found by: claude

### 2026-10-05 · WHTML importer: classes, forms, images and limits
- Area: mcp
- Scope: template-candidate
- Symptom: Building the style guide with `data_whtml_builder` turned up
  the following (it contradicts the "importer drops class attributes"
  line in AGENTS.md › Webflow MCP limits):
  - classes are kept, mapped onto existing styles by slug;
  - an element whose class list has no existing combo chain (e.g.
    `section is-ironstone is-hero`) gets a new, empty combo entry, named
    with the lowercase slug (`is-hero`);
  - `<label>`, `<input>`, `<select>`, `<textarea>` outside a `<form>` reject
    the whole batch ("Field Label can only be placed in a Form");
  - a `<form class="form">` becomes FormWrapper › FormForm with the class
    on the wrapper;
  - `<img src>` pointing at the site's own CDN asset URL is inserted
    without an asset link ("not found in the asset library");
  - DOM elements (svg, figcaption, dialog) also keep a literal `class`
    attribute next to their styles;
  - one root element per action, at most 5 actions per call; ~15 KB per
    action worked, an 80 KB section dropped the socket (xhr poll error);
  - every `<span>` becomes a text Span, including empty decorative shapes
    (timeline dot/line, guide lines, markers). Kajal flagged these. Use
    `<div>` for shapes in import markup, and keep `<span>` only for
    inline text or where HTML requires it (inside `<button>`).
- Cause: importer behaviour; the asset lookup does not match CDN URLs.
- Fix:
  - the empty combo chains are how Webflow stores 3+ classes, so they
    are harmless;
  - wrap form controls in a `<form>`, then move the class to FormForm and
    clear the wrapper with `set_style`;
  - bind images afterwards with `set_image_asset` (asset id = the 24-hex
    prefix of the CDN filename);
  - split big sections into a shell plus one action per child;
  - to swap a Span for a Div Block: insert the `<div>` "before" the span,
    `move_element` its children in (images keep their asset), then
    remove the span. Done for 32 shapes on the style guide.
  - AGENTS.md's importer line should be corrected (not edited here: agent
    rules change only with the user's OK).
- Status: open
- Found by: claude

### 2026-10-05 · A two-class combo can't be edited from a three-class element
- Area: designer
- Scope: template-candidate
- Symptom: The value for Section + Is Hero had to be entered, but every
  hero element is Section + Is Ironstone + Is Hero. Selecting it in the
  Designer edits the chain `.section.is-ironstone.is-hero`, which would
  not reach a plain `section is-hero`.
- Cause: Webflow edits the exact chain on the selected element.
- Fix: in the selector field, remove the extra class (Is Ironstone), set
  the value on Section › Is Hero, then add the class back. The CSS
  `.section.is-hero` still matches the three-class element on the page.
  When planning combos, keep shared values on the shortest chain.
- Status: documented
- Found by: human

### 2026-10-05 · Gradient layers have no size/tile in the Designer
- Area: designer
- Scope: template-candidate
- Symptom: A repeating tick pattern (`repeating-linear-gradient`) could
  not be built in the Designer. Gradient layers offer no size or tile
  settings, and Custom properties refuse `background-size`,
  `background-repeat` and `background-image` (native properties).
- Cause: Webflow only exposes size/tile on image layers, and has no
  repeating gradient.
- Fix: Kajal builds the gradient in the Designer with hard stops
  (0% → 17.65% Field, then transparent). The tiling
  (`background-size: 17px 1em; background-repeat: repeat-x`) goes in
  repo CSS, tagged `designer-cant`. The MCP could write it into the class
  (`update_style` accepts it), but nothing in the Designer would show it,
  so it would be a hidden override. Kajal chose the repo.
- Status: workaround confirmed
- Found by: human

### 2026-10-05 · Horizontal scrollers drag vertically
- Area: css
- Scope: template-candidate
- Symptom: Slider Track could be dragged up and down while scrolling.
- Cause: with `overflow-x: auto` and `overflow-y` left at visible, CSS
  computes `overflow-y` as auto, so any small vertical overflow scrolls.
  The prototype rule had the same gap.
- Fix: set `overflow-y: hidden` in the Designer on every horizontal
  scroller (Slider Track, Lightbox Thumbs).
- Status: fixed (Webflow styles, 2026-10-05)
- Found by: human

### 2026-10-05 · Component props: what the MCP can and can't wire
- Area: mcp
- Scope: template-candidate
- Symptom: Building components through the MCP showed these limits:
  - `transform_element_to_component`, `create_prop`, prop bindings
    (`set_settings` with a prop source: text, link, image, alt, DOM id,
    attribute values), variants with `set_variant_styles`, and
    `ComponentSlot` creation all work;
  - a Span's text can't be bound (no `text` setting). Only Text Block,
    Paragraph, Heading, Link and Button text can;
  - a slot can't be renamed (`update_prop`: "not an updatable prop
    type"), and elements can't be moved into an instance's slot ("Anchor
    element not found");
  - `insert_component_instance` can't use an instance as the
    before/after anchor. Append to the parent instead;
  - there is no prop type for a heading tag;
  - an image prop has no default. Instances show no image until
    `set_component_instance_prop_values` sets the asset id (type
    `string`). A variant is set the same way, through the "Variant" prop
    with the variant id.
- Cause: MCP surface limits.
- Fix: build bindable text as `<div>` (Text Block), not `<span>`. Rename
  slots and fill them in the Designer (MANUAL-TODO F–G).
- Status: open
- Found by: claude

### 2026-10-05 · Style guide previews lack the script hooks
- Area: designer
- Scope: project
- Symptom: The generated style-guide CTA had no `id="mark"` on the SVG
  path, so its `<use>` lines drew nothing, and it had no
  `data-brand-lines`. The dev cards had no `data-dev-card` or
  `data-count`.
- Cause: `scripts/gen-style-guide.py` copies markup without ids or
  `data-*` attributes.
- Fix: build Components from the real page markup (`index.html`, the
  project template), not from the style-guide previews.
- Status: documented
- Found by: claude

### 2026-10-05 · WHTML importer turns `<button>` into a link
- Area: mcp
- Scope: template-candidate
- Symptom: Every imported `<button>` became a Webflow Link element that
  renders `<a type="button">` with no href: not focusable, no button role.
  This hit lightbox triggers, slider arrows, the menu toggle, tabs and steps.
- Cause: importer behaviour; Webflow has no plain button element outside
  forms.
- Fix: create a DOM element with `set_dom_config: { dom_tag: "button" }`,
  the same classes and attributes (`type="button"`), move the children in
  (`move_element` also moves bare text nodes), then remove the Link.
  Instances can't be anchors, but definitions accept `scope_component_id`.
- Status: fixed on the style guide and in Nav (23 buttons)
- Found by: claude

### 2026-10-05 · Sitemap indexing API is plan-gated
- Area: mcp
- Scope: template-candidate
- Symptom: `update_page_sitemap_status` → 403 `Site plan doesn't support
  sitemap indexing controls`.
- Cause: the site has no site plan yet. It is being built on the
  freelancer Workspace plan, and both the API and the Designer toggle need a
  site plan.
- Fix: exclude pages from the sitemap and site search in Page settings;
  add `noindex` via page head code. Tracked in MANUAL-TODO.md (A–C).
- Status: open
- Found by: claude

### 2026-10-06 · Element builder: rejected actions can still leave an element
- Area: mcp
- Scope: template-candidate
- Symptom: `data_element_builder` returned `"placeholder" is a reserved
  attribute name` for a FormTextInput, yet a bare input (no placeholder,
  `required` on) was inserted anyway. It surfaced later as a duplicate.
- Cause: the element is created before the attributes are validated.
- Fix: after any builder error, re-query the parent and remove strays.
  `placeholder` has no setting either; set it in the Designer
  (MANUAL-TODO J).
- Status: open
- Found by: claude

### 2026-10-06 · TextBlock builder makes an uneditable Block; WHTML drops fs-* attributes
- Area: mcp
- Scope: template-candidate
- Symptom:
  - `type: "TextBlock"` produced a Block with "This is some text inside of
    a div block." and `set_text` answered "This element doesn't support
    text"; the requested `set_text` was ignored;
  - WHTML import of a `<select>` kept the class and options markup but
    dropped `name` and every `fs-*` attribute, and the API can't read
    select options back;
  - a `<div>` imported by WHTML then refused every write (`[Conflict] The
    operation could not be applied to the component map`, BATCH_FAILED)
    while other elements on the page updated fine.
- Cause: MCP surface limits / importer behaviour.
- Fix: build text as `type: "Paragraph"` with `set_text`. Re-add attributes
  with `set_attributes` and `name` via `set_settings` after an import. If an
  element keeps returning the component-map conflict, rebuild it with the
  element builder and remove the old one.
- Status: open
- Found by: claude

### 2026-10-06 · Finsweet Combo Box 2.7.1 differs from its docs
- Area: js
- Scope: template-candidate
- Symptom: With the bundled `@finsweet/attributes@2.7.1` (threestars
  pattern), Combo Box threw `Cannot read properties of null (reading
  'style')` and rendered no options. Once fixed, the options showed in a
  different order from the select.
- Cause: read from the 2.7.1 source (`dist/src-42KUKVDL.js`):
  - it reads `window.FinsweetAttributes.modules`, which the threestars List
    shim doesn't create;
  - `fs-combobox-element` only knows `dropdown`, `label`, `clear` and
    `empty`. The input, select and option template are found by position
    (first `input` and `select` in the Dropdown, first `a` in the list), so
    the docs' `text-input` / `select` / `option-template` values do nothing;
  - the `clear` element is required: without it init crashes;
  - options are sorted by `value` (`localeCompare`), not by the select's
    order.
- Fix: `src/modules/finsweet.ts` creates `modules` as well as `scripts`
  and loads both distributions with `import()` (List registers a CSS
  property at evaluation, which threw when a test evaluated the bundle
  twice). Give every Combo Box a clear element. Order options by choosing
  values that sort the way they should read. Combo Box sets the hidden
  select and fires `input` + `change`, so a select with
  `fs-list-element="sort-trigger"` drives List Sort (checked in a harness
  page: all four sorts reorder the list).
- Status: open
- Found by: claude

### 2026-10-06 · Webflow form and dropdown defaults leak through our classes
- Area: designer
- Scope: template-candidate
- Symptom: Kajal spotted the 10px under native inputs. An audit found
  more: every Form Block (`.w-form`) adds 15px below; `.w-dropdown-toggle`
  pads 20px 40px 20px 20px; `.w-dropdown-link` sets colour #222;
  `.w-dropdown` has auto left and right margins.
- Cause: `webflow.css` defaults apply wherever our class doesn't set the
  property. Here the Form Blocks had no class at all: the WHTML workaround
  moves the class onto the inner `<form>` and clears the wrapper.
- Fix: in Webflow, not repo CSS (Designer first, so it stays editable):
  margin-bottom 0 on Select Input; padding 0 on Select Toggle; colour
  inherit on Select Option; left and right margin 0 on Select; new class
  **Form Block** (margin-bottom 0) on every Form Block wrapper (style
  guide ×4, Footer, Searchable Select). Give every new Form Block that
  class, and check new form or dropdown classes against these defaults.
- Status: fixed (Webflow styles, 2026-10-06)
- Found by: human

### 2026-10-06 · Template focus rule overrides Designer focus states on inputs
- Area: css
- Scope: template-candidate
- Symptom: Kajal saw a dark square ring around the Select's text input
  only, instead of the Clay ring on the whole field. Every Form Input
  showed the same dark ring instead of its Designer Focus Visible state
  (Form/Focus, offset 3px). On click, Form Input's border turned blue.
- Cause: the template's §07 rule `:focus-visible, .w-input:focus-visible,
  .w-select:focus-visible { outline: 2px solid var(--color-accent) }`
  (`currentColor`). The `.w-input` part is 0-2-0, the same as a Designer
  `.form-input:focus-visible`, and repo CSS loads later, so it wins. The
  blue border is webflow.css `.w-input:focus { border-color: #3898ec }`,
  which beats a class's base border colour.
- Fix: the `.w-input` / `.w-select` selectors dropped from the rule (plain
  `:focus-visible` fallback kept). In Webflow: Select Input › Focus
  Visible outline none; Select Toggle › Focus Within outline 2px
  Form/Focus, offset 3px; Form Input › Focus border colour = its base
  border variable. Every input class needs its own Focus Visible state
  and a Focus border colour.
- Status: fixed (this commit + Webflow styles, 2026-10-06); not upstreamed
- Found by: human

### 2026-10-06 · CMS API: Number fields are integers; new collections need a site publish
- Area: mcp
- Scope: template-candidate
- Symptom: `create_collection_static_field` type Number always returned
  `format: integer`, and `update_collection_field` only takes name, help
  text and required, so Acres (1.03) can't be stored. Publishing the new
  items returned 409 `The site is not published`.
- Cause: the field API has no number format; items in a collection whose
  template page has never been published can't be published alone.
- Fix: set decimal fields' format in the Designer (MANUAL-TODO L) before
  entering values. Create items with `isDraft: false`, then publish the
  site once; the items go live with it. Image fields accept `{ fileId,
  url, alt }` of an existing asset and are copied into the CMS CDN. Alt
  belongs on the image field (no separate alt fields); it is stored per
  file within a field, so a file repeated in one multi-image field shares
  one alt.
- Status: open
- Found by: claude

### 2026-10-06 · Webflow rewrites roles and drops attributes on publish
- Area: designer
- Scope: template-candidate
- Symptom: the bundled custom-select never initialised on staging; a static
  `<dialog>` specimen was invisible; Link Blocks gained attributes nobody set.
- Cause: on publish Webflow
  - writes `role="list"` on every List element (our `role="listbox"` and
    `hidden` are gone), so `[role="listbox"]` lookups find nothing;
  - strips the `open` attribute from a `<dialog>`;
  - adds `title` and `aria-label` (equal to the visible text) to Link Blocks.
- Fix: modules find lists by class and set the ARIA role themselves
  (`custom-select.ts`). The style guide's lightbox specimen carries
  `data-static`, and repo CSS hides only `.lightbox:not([open]):not([data-static])`.
  Never rely on a role or boolean attribute surviving a Webflow element;
  check the published HTML.
- Status: fixed (custom-select, lightbox rule)
- Found by: claude

### 2026-10-06 · WHTML drops the whole class list if one class is missing
- Area: mcp
- Scope: template-candidate
- Symptom: 82 spec-row cells imported as `body-s spec-row-value` and
  `dev-head-copy heading-group` came in with no classes at all.
- Cause: if any class in the list doesn't exist yet, the importer drops
  all of them, silently.
- Fix: create every class before importing, then re-query the imported
  elements' `styleNames` and fix stragglers with `set_style`.
- Status: open
- Found by: claude

### 2026-10-06 · Nested button components: what the MCP can't do
- Area: mcp
- Scope: template-candidate
- Symptom: building C | Button (Color › Size › Content):
  - a variant prop can't be exposed from a nested instance through the API;
  - `set_style ["Button Color","Button Size"]` fails unless that combo already
    exists;
  - an instance can't be used as a before/after anchor.
- Cause: MCP surface limits.
- Fix: Kajal linked the variant props in the Designer ("Link to new prop").
  Insert relative to a plain element or append to the parent.
- Status: open
- Found by: claude

### 2026-10-06 · Native `<button type="submit">` in Webflow forms
- Area: designer
- Scope: template-candidate
- Symptom: after replacing the FormButton inputs with a DOM `<button>`
  holding Button Color, the button had UA padding, border and background;
  in the footer it stretched to the form width; on staging it showed
  `disabled` + `w-form-loading`.
- Cause: a native button keeps UA styles unless the class resets them; a
  flex-column form stretches its children; Webflow's Turnstile spam check
  disables every submit until the form scrolls into view and gets a token
  (webflow.js, same for input submits).
- Fix: Button class sets padding 0, border width 0, background transparent,
  font-family and colour inherit, cursor pointer. Newsletter align-items
  flex-start. The Turnstile state is expected; test submits in a real
  browser, not headless.
- Status: fixed (Webflow styles, 2026-10-06)
- Found by: claude + human

### 2026-10-06 · `remove_style` only sees usages on the page in context
- Area: mcp
- Scope: template-candidate
- Symptom: `remove_style` "G | Page Wrapper" kept failing with "Ensure there
  are no usages" although no element on the style guide used it.
- Cause: the 404 page used it. After that element was switched, the remove
  still failed with the style guide's pageId and succeeded with the 404's.
- Fix: query every page (`list_pages`, then `query_elements` with
  `style`) before removing a class, and call `remove_style` from the page
  that held the last usage.
- Status: workaround confirmed
- Found by: claude

### 2026-10-06 · Body Embed stylesheet: page paints unscaled, then jumps
- Area: loader
- Scope: template-candidate
- Symptom: Kajal saw the hero (and every page) flash. A filmstrip showed
  the first paint at Webflow's 16px with a fallback font, then a jump to
  the P8 scale once repo CSS arrived; `styles.css` was fetched three times.
- Cause: repo CSS comes from a `<link>` in a body Embed, which doesn't block
  rendering like a head stylesheet; the Embed script and the footer loader
  each rewrote its href with a new `Date.now()`, and every href change
  drops the sheet and fetches it again (the cancelled fetch also fires
  `error`); Inter (`font-display: swap`) loaded late.
- Fix: loader.html — head code preloads the Inter woff2, adds
  `html.bv-css-wait body { visibility: hidden }` (3 s fallback) and one
  shared `BV.v` cache-buster; the Embed script leaves the static link for
  the canvas and appends a fresh `#bv-css` link with the final URL, whose
  load/error lifts the wait; the footer loader only sets the href when the
  URL really differs. Verified by serving staging with the patched snippets.
- Status: fixed in loader.html; needs re-paste (MANUAL-TODO Q)
- Found by: human + claude

### 2026-10-06 · Importer drops <img> attributes; Webflow drops valueless video booleans
- Area: mcp
- Scope: template-candidate
- Symptom: the Story zoom didn't run; a `<video autoplay muted loop>` published
  without `muted` and `loop`, so autoplay was blocked.
- Cause: WHTML keeps attributes on most elements but none on `<img>`
  (`data-story-zoom`, `loading`, `decoding` all gone). Webflow strips
  boolean attributes with an empty value from DOM elements on publish.
- Fix: re-add image hooks with `set_attributes` after every import.
  Give boolean attributes a value (`muted="true"`), per Kajal. The C | Video
  component binds each attribute *name* to a text prop (default `muted`,
  value `true`); clearing the prop turns it off.
- Status: workaround confirmed
- Found by: human + claude

### 2026-10-06 · API gaps met building Home
- Area: mcp
- Scope: template-candidate
- Symptom / workaround:
  - a Link Block in a Collection List can't be pointed at the current
    item: `static_link` mode `collectionPage` publishes the literal slug and
    mode `page` publishes the list page. Designer: Link › Current <Item>;
  - element visibility binds only to boolean props, so "show when this
    text prop is set" is Designer-only (C | Video sources);
  - option field values can't be renamed, and a page can't be moved into a
    folder (`create_page` / `update_page_settings` take no parent);
  - `set_style` with a 3-class chain fails unless that exact chain exists:
    create the combo with `parent_style_names: [A, B]` first;
  - custom properties accept `mask-image` etc. but refuse `-webkit-` prefixes;
  - a link-type component prop takes `link_mode` `url|email|phone|popover`
    only (no page links), with `link_to`.
- Status: open
- Found by: claude

### 2026-10-06 · Inter Variable narrows large type (optical size)
- Area: designer
- Scope: template-candidate
- Symptom: Webflow headings were narrower than the prototype at the same
  size and tracking (hero H1 336 vs 375px).
- Cause: Inter Variable v4 has an `opsz` axis; with the default
  `font-optical-sizing: auto` large text uses the tighter Display cut. The
  prototype's Google Fonts Inter (wght axis only) is the Text cut everywhere.
- Fix: Body tag style › custom property `font-optical-sizing: none`.
- Status: fixed (Webflow styles, 2026-10-06)
- Found by: claude

### 2026-10-06 · Designer canvas draws a templateless grid as 2×2
- Area: designer
- Scope: template-candidate
- Symptom: Icon Box glyphs sat top-left on the canvas but centred on staging.
- Cause: `display: grid` with no rows/columns set publishes as a one-cell
  grid, but the Designer previews its default 2×2 template.
- Fix: centre single children with flex (justify/align center), not grid.
  Every grid class sets both tracks explicitly (Kajal): a missing
  `grid-template-rows` / `-columns` is given `auto`, which matches the
  implicit track, so published CSS behaves the same. Done for 19 classes
  (rows) and Lightbox (columns); breakpoints inherit from base.
- Status: fixed (Icon Box + all grid classes, 2026-10-06)
- Found by: human

### 2026-10-06 · Canvas `.wf-empty`: empty elements show as 75px boxes or vanish
- Area: designer
- Scope: template-candidate
- Symptom: on the Designer canvas, empty shapes (markers, guide lines,
  timeline dot/line, overlays, fades) showed as dashed placeholder boxes;
  once given padding, em-sized ones collapsed to 0×0. Published pages were fine.
- Cause: the canvas adds `.wf-empty` to any element without content:
  `padding-bottom/right: 75px`, `font-size: 0`, `line-height: 0` and a dashed
  outline. em sizes then compute to 0. (First guessed margin — wrong.)
- Fix: every class used on an empty element sets padding 0 on all sides and
  `font-size: inherit` (the live default, so the published page is unchanged).
  Done for Marker, Nav Toggle Line, Timeline Dot/Line/Fade, S Bg Overlay,
  Steps List Track/Progress, Guides V/H/Marker, Dev Wash, Mark Figure Line
  H/V/Marker, Sg Swatch Color, Sg Radius, Divider, Map Frame, G | Nav,
  G | Footer, G | Components. Do the same for any new empty element.
- Status: fixed (Webflow styles, 2026-10-06)
- Found by: human

### 2026-10-06 · Split text in Webflow Spans flattens when edited
- Area: designer
- Scope: template-candidate
- Symptom: editing a step or statement's text from the Settings panel turned
  the styled pieces (marker, [ 1 ], title, description) into one plain sentence.
- Cause: the importer makes every `<span>` a Webflow text Span; Spans inside a
  text parent (button, paragraph, figcaption, heading, link) are rich-text
  children, and editing the parent's text rewrites them.
- Fix: rebuild each piece as a custom element with tag `span` (same classes and
  attributes), move its text node in, remove the old Span. Done for 22 on Home
  (Approach steps, Story statement), 71 on the style guide, the Nav toggle and
  the Footer legal links. Standalone Spans in plain blocks (chips, labels) are
  fine. Open: the style guide's Sg Value table cells (Spans holding spans,
  ~380) — generated docs, left as is.
- Status: fixed for site content
- Found by: human

### 2026-10-06 · C | Button crop lines sat outside the edge; cursor button stuck on scroll
- Area: css
- Scope: project
- Symptom: a hairline gap between the crop lines and the Dev Card cursor
  button's edge; after scrolling a card under a still mouse the button stayed
  where it was until the mouse moved.
- Cause: in the prototype `.button` carries its own 1px border, so lines at
  -1px land on it; in C | Button the border is on the inner Button Color, so
  -1px is outside it. The follower only listened to pointer events, which
  don't fire while the page scrolls under a still pointer.
- Fix: `.button`/`.cursor-button` lines at 0. `cursor-button.ts` keeps the
  last pointer position and on scroll re-checks the topmost card under it
  (`elementFromPoint`, so the covered card in the sticky stack stays hidden).
- Status: fixed in this commit
- Found by: human

### 2026-10-06 · Webflow images publish with srcset; swapping src does nothing
- Area: js
- Scope: template-candidate
- Symptom: the Capabilities tabs changed `src` on the collage image, but the
  photo on staging stayed the same.
- Cause: Webflow publishes every asset image with `srcset` and `sizes`
  (`-p-500` … `-p-2000` variants); the browser picks from `srcset` and
  ignores a new `src`.
- Fix: `capabilities.ts` removes `srcset` and `sizes` before setting `src`.
  Any module that swaps a Webflow image must do the same (or set a new srcset).
- Status: fixed in this commit
- Found by: claude

### 2026-10-06 · Conditional classes are typed slugs, not linked styles
- Area: designer
- Scope: template-candidate
- Symptom: Mark Figure with *Is Caps* on published `mark-figure is-cap`, so
  the Home collage lost its placement.
- Cause: the component's "conditional classes" are a custom `class`
  attribute with a Conditional text value. The value is a typed string
  (`is-cap`, one letter short of `is-caps`), not a reference to a style, so
  a typo publishes silently and a class rename in the Style Manager never
  reaches it. The API can't read or edit the value.
- Fix: corrected in the Designer (MANUAL-TODO T). After wiring a conditional
  class, check the published class list; re-check these attributes whenever
  a combo is renamed.
- Status: open
- Found by: claude + human

## Known from previous projects

Inherited from `wf-template`. Found across earlier client repos; listed so
they are not rediscovered. Status refers to the template.

### 2026-10-02 · Element resets in §02 beat Designer tag styles
- Area: css
- Scope: template-candidate
- Symptom: A Designer tag style ("All H2 Headings", "All Links") margin or
  colour has no effect.
- Cause: Webflow emits tag styles as bare element selectors (`h2 {}`),
  0-0-1 — the same specificity as the §02 resets, which load later and win.
- Fix: none yet. Options: wrap the resets in `:where()` (then webflow.css
  defaults return), or drop them and set tag styles in the Designer.
- Status: open
- Found by: claude

### 2026-10-02 · Neutralizers in §03 override Designer styles
- Area: css
- Scope: template-candidate
- Symptom: A style changed in the Designer has no effect on the page.
- Cause: `src/styles.css` loads after `webflow.css`, so the §03 `.w-*` rules
  win same-specificity ties by source order. `.w-layout-blockcontainer
  { max-width }` silently overrode Designer container caps (threestars
  b5f122c); the `.w-dropdown-toggle` reset broke Webflow's chevron spacing
  (reformdd 8c65a5c).
- Fix: reformdd removed ten neutralizers so "Webflow's own defaults now stand
  unopposed" (c2e5f4b). Delete a neutralizer the moment it fights the
  Designer.
- Status: fixed in template v3 — selectable-component rules removed; only Designer-unselectable internals remain in §03
- Found by: human

### 2026-10-02 · Root font-size scale drifts from Designer tokens
- Area: css
- Scope: template-candidate
- Symptom: Designer variables named for px values ("Max Width - 1280px")
  render at different sizes; the scale is retuned again and again.
- Cause: The §01 fluid scale sets `:root` font-size, so every rem/em value
  coming out of the Designer scales with it. reformdd retuned it seven times
  (1680 → 1440 → 1680 → clamp → revert → 1920 → 1440); threestars found em
  layout tokens rendering 6.25% short.
- Fix: none general. Agree the scale with the designer before building, or
  drop it and let Webflow variables own sizing.
- Status: fixed in template v3 — the scale is a commented-out opt-in (override-webflow)
- Found by: human

### 2026-10-02 · Renaming a Webflow variable silently breaks repo CSS
- Area: css
- Scope: template-candidate
- Symptom: A container cap or token-driven value quietly stops applying.
- Cause: Container/Max Width was renamed to Section/Max Width in Webflow.
  Webflow rewrites its own references but cannot reach this bundle, so
  `var(--_layout---container--max-width, none)` fell back to `none`
  (reformdd 1ca59f6).
- Fix: avoid referencing Webflow variable names in repo CSS; if one is
  needed, log it here so renames get checked.
- Status: fixed in template v3 — the template no longer references Webflow variable names; the AGENTS.md policy forbids new ones without approval
- Found by: human

### 2026-10-02 · Removing a rule locally does not remove it on the canvas
- Area: designer
- Scope: template-candidate
- Symptom: A deleted CSS rule still applies in the Designer while `pnpm dev`
  runs.
- Cause: The canvas never runs scripts, so both the staging and the
  localhost `<link>` stay live. They are additive; staging's copy of the
  rule remains.
- Fix: push and wait for staging, or temporarily comment out the `bv-css`
  link in the Embed.
- Status: documented — v3 canvas shows staging only by default; applies only while the temporary localhost link is in use
- Found by: human

### 2026-10-02 · Static localhost link is requested by public visitors
- Area: loader
- Scope: template-candidate
- Symptom: Published pages request `http://localhost:3000/styles.css`; can
  block render and trigger Chrome's local-network-access prompt.
- Cause: The canvas Embed carries a static localhost `<link>` so the
  Designer can see local CSS; the script that removes it runs after the
  browser has already started the request.
- Fix: reformd e9f81ab and regenx a66d116 removed the static link
  independently and create it from script only in dev mode. Trade-off: the
  canvas then shows staging CSS only.
- Status: fixed in template v3 — the Embed has no static localhost link; the dev link is created by script in dev mode only
- Found by: human

### 2026-10-02 · VER lives in two snippets and a placeholder 404s at launch
- Area: release
- Scope: template-candidate
- Symptom: Prod CSS and JS both 404 the moment a custom domain is attached.
- Cause: `VER = "X.Y.Z"` is never exercised on `*.webflow.io`, and a release
  must bump VER in both the Embed and the footer snippet.
- Fix: regenx keeps one `RELEASE` value in the head config (`null` until the
  first tag) that the other snippets read.
- Status: fixed in template v3 — one RELEASE in head code; null serves staging with a console error instead of 404ing
- Found by: human

### 2026-10-02 · The add -f dist / untrack release ritual is error-prone
- Area: release
- Scope: template-candidate
- Symptom: Empty release tags, re-cut versions, `dist/` swept into unrelated
  commits.
- Cause: `dist/` is gitignored except in release commits. terawulf re-cut
  v1.1.1 with a tree identical to v1.1.0.
- Fix: brandvm, adaria and nexplan commit `dist/` permanently and fail CI on
  `git diff --exit-code -- dist`.
- Status: fixed in template v3 — dist/ is committed; CI fails on drift; dev builds stay in memory
- Found by: human

### 2026-10-02 · One throwing module leaves the page scroll-locked
- Area: js
- Scope: template-candidate
- Symptom: Page stays locked, or later modules never initialise.
- Cause: `src/index.ts` runs modules as a chain.
- Fix: reformdd and brandvm wrap each init in `run(name, init)` with
  try/catch; the template only has `finally` around the lock release.
- Status: fixed in template v3 — run(name, init) isolates each module; the lock is released before modules run; the head timeout no longer waits for load
- Found by: human

### 2026-10-02 · CDN `defer` scripts cannot be ordered against the bundle
- Area: js
- Scope: template-candidate
- Symptom: Lenis, GSAP or Finsweet is undefined when a module runs.
- Cause: The footer loader appends the bundle dynamically (async), so a
  sibling `<script defer>` has no ordering promise.
- Fix: bundle libraries with `pnpm add`. Do not also load Webflow's own GSAP
  or jQuery a second time.
- Status: documented
- Found by: human

### 2026-10-02 · Webflow's anchor scroll ignores a sticky header
- Area: js
- Scope: project
- Symptom: Same-page hash links land under a sticky nav.
- Cause: Webflow's scroll module offsets only for `position: fixed` headers
  and never reads `scroll-margin-top`.
- Fix: threestars `anchor-scroll.ts` unbinds `click.wf-scroll` and measures
  `--nav-h` from the nav.
- Status: project pattern
- Found by: human
