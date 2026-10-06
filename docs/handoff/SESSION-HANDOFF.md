# MarketCap Webflow build — session handoff

Last updated 2026-10-06 (all 10 components built). Read this first when resuming on a
new machine, then `AGENTS.md`, `GOTCHAS.md` and the two files next to this
one:

- `MANUAL-TODO.md` — values the Webflow MCP can't write, entered by Kajal in
  the Designer, with their status.
- `repo-css-pending.css` — 107+ rules that go into `src/styles.css` at the
  repo step (tagged per AGENTS.md). Not loaded by anything yet.

The approved prototype (`prototype/`, with `HANDOFF.md`, `CLASSES.md`,
`index.html` and the inner pages), the client `Assets/` and the hero film
(`video/out/`) are **not** in this repo: it is public. Bring them from the
original machine (or a private share) if you need the reference.

## Working rules (from Kajal)

- Work directly on `master` (dev phase): no branches or PRs unless asked.

- Stop for Kajal's OK after each step.
- Don't create, rename or remove anything beyond the handoff without asking.
- Don't edit the prototype. Repo work comes after the Webflow steps unless
  Kajal says otherwise.
- Log surprises in `GOTCHAS.md`.
- Values the Designer can't show go in repo CSS, never written into a class
  through the MCP (Kajal chose the repo for the timeline tick tiling).
- Track every manual Designer entry in `MANUAL-TODO.md` and flag it on the
  style guide (`data-manual-todo` caption).

## Site facts

- Site `6ac0183f4c3b275e72bfa228`; no site plan yet (freelancer Workspace
  plan), so sitemap indexing controls are unavailable (MANUAL-TODO A).
- Pages: Home `6ac018424c3b275e72bfa24a` (empty), Style Guide
  `6ac0245870f40abe1f2b188d` (folder `design`, slug `style-guide`).
- MCP: each new session gets a new `session_id` (send `start`); pick a new
  `agent_id` suffix.

## Step status

| # | Step | Status |
|---|---|---|
| 1 | Variables P1–P8 (P8 = repo CSS §01, approved-base) | Done (P8 waits for repo) |
| 2 | Native tag styles (H1–H6, p, a) | Done |
| 3 | Classes from CLASSES.md | Done; 23 calc/gradient values entered manually by Kajal |
| 4 | Style guide page | Done; previews 1–13 + anatomy; nav-state previews left out (Kajal) |
| 5 | Components | **Built** (10 of 10); waiting for Kajal's OK and MANUAL-TODO J–K |
| 6 | CMS (Developments, Milestones) | Not started (Kajal approved doing it) |
| 7 | Home page | Not started |
| 8 | Inner pages (Developments, Development template, Contact) | Not started |
| 9 | Repo: modules, repo CSS, `pnpm add gsap lenis`, build, push | Not started |
| 10 | Page settings: SEO, OG, JSON-LD, favicon | Not started |
| 11 | QA + release | Not started |

## Step 5 — components

Built (ids are component ids):

| Component | Id | Props / notes |
|---|---|---|
| Nav (Global) | `722d79d0-a781-bebe-927c-95abea6d8b6f` | G \| Nav W › G \| Nav (nav) › Nav Component. Toggle is a real `<button>`. |
| Footer (Global) | `e5c41852-4c9b-7995-afff-4609aa305c82` | Newsletter class on the FormForm. Logo asset `6ac4173ae27b5fba958aeb48`. |
| Closing CTA (Sections) | `7d517192-6e85-cab8-5eea-974a1c919e13` | Heading, Text, Button Link, Anchor ID; variant Reversed `8c46e651-a853-052d-0495-355e2a3d765f`. Built from Home markup (has `id="mark"` + `data-brand-lines`). |
| Photo Band (Sections) | `fb7d0108-1312-fb00-e7b4-aeed40553e42` | Image, Value, Caption (also aria-label). |
| Page Head (Sections) | `f54db91e-74a0-bf34-69a3-c98f01bff43e` | Chip, Heading, Text, slot (Kajal renaming to Control). |
| Mark Figure (Content) | `b8791d08-8be4-699b-1966-7c7313999fa4` | Image, Image Alt, Image ID, switches Is Caps / Is Contact → conditional classes (Kajal wired them). |
| Dev Card (Content) | `0da92a6e-ba9f-bf93-2611-05a773fd11fa` | Title, Link, Image, Address, Fact 1–3, GFA, GFA Count, Storeys, Parking, Acres, Heading Tag (Kajal added). Binds to CMS later. |
| Global Components | `93e9b303-4d7e-d42e-0873-4e5de2cfda77` | Pre-existing: the loader embeds. Must be on every page. |

| Gallery (Content) | `f42781b7-fc42-0304-3f03-358b49dc8ed8` | No props yet (static images). Lightbox hooks in place; items are real `<button>`s. |
| Plans Slider (Sections) | `ca71be19-ecd7-73ef-cd05-6b7bdcb4ae14` | Heading (`6f086c40…`), Note (`00a364bf…`). Arrows are real `<button>`s; 4 stand-in images = framing-site. Heading keeps `id="plans-title"` for the section's `aria-labelledby`. Built 2026-10-06. |
| Searchable Select (Content) | `3ea8d732-c469-d2a7-6acb-8b6f48116ec2` | Prop Label (sr-only, `46995581…`). Form Block › Form › SR label + Dropdown (`fs-combobox-element`: dropdown, text-input, select, option-template, empty). The hidden select also carries `fs-list-element="sort-trigger"`, so List Sort reads it. Finsweet runs from `src/modules/finsweet.ts`. Clear button (Select Clear) required by Combo Box 2.7.1. Built 2026-10-06. |

Done this session after the first push: the `<button>` fix. The WHTML
importer turns `<button>` into a Link (`<a type="button">`, no href, not
focusable). All 23 were rebuilt as DOM elements with `dom_tag: button`
(same classes and attributes, children moved, Link removed): the Nav toggle
and the 22 on the style guide. **Build every future button this way, never
through WHTML `<button>`.**

**Next:**

1. Finsweet runs from the bundle, not a head script (Kajal, 2026-10-06;
   threestars pattern): `src/modules/finsweet.ts`, pinned
   `@finsweet/attributes@2.7.1`, `.pnpmfile.cjs`. No Site settings code and
   no `loader.html` change. See GOTCHAS "Finsweet Combo Box 2.7.1".
2. Done 2026-10-06 (Kajal): new class **Select Clear** on a `<button
   aria-label="Clear sort" fs-combobox-element="clear">` with an × svg,
   before the chevron (Finsweet shows it only once a sort is chosen; 0.6
   opacity, 1 on hover/focus-visible). "Oldest first" dropped, so options
   read Newest first, Largest GFA, Name A–Z. Neither change is in the
   prototype (read-only). Harness check passed: three sorts, clear resets
   select and input; the list keeps its last order after clearing.
3. MANUAL-TODO J and K done (Kajal). Still: visual check of the Dropdown
   on the canvas.
3a. New classes since CLASSES.md (prototype is read-only, so they're only
   listed here): **Select Clear** and **Form Block** (margin-bottom 0, on
   every Form Block wrapper). Webflow default overrides added to Select
   Input, Select Toggle, Select Option and Select (GOTCHAS, 2026-10-06).
4. Pushed to master 2026-10-06 (staging deployed, CI green). On staging, check keyboard selection (needs webflow.js,
   not testable in the harness) and the sort on the real Developments list.
5. Report step 5 to Kajal for OK.

## Step 6 — CMS (approved)

- **Developments**: name, slug, status, address, city, image, image alt,
  facts 1–4, GFA (sq ft), storeys, parking, acres, a date to sort by. Items:
  Four-storey medical centre (18558 Yonge St, East Gwillimbury; 85,083 /
  4 / 146 / 1.03) and EV automotive sales and service centre (11644 Yonge
  St, Richmond Hill; 30,375 / 2 / 60 / 1.08).
- **Milestones**: period, title, body, image, image alt, order. Items:
  Mid-1980s, Mid-1990s, Today (copy in `prototype/index.html`).
- Home hero card = Developments list, limit 1, newest first.

## Decisions waiting for Kajal (before Home)

- Hero film: `hero-1080-graded.mp4` recommended; Background Video can't be
  created by the MCP (Designer, or a `<video>` Embed).
- Capabilities tabs: keep the custom tabs (recommended) or native Tabs.
- Whether repo work (step 9) moves up to right after Home.

## Assets

Uploaded (asset id → file): `6ac3f1e67aca539ca701bc2b` framing-site,
`6ac3f1e609d7440234654989` step-build-site, `6ac3f1e68c0a2d36a3290e89`
approach-clouds, `6ac3f1e6a29e50893335f653` family-3,
`6ac3f1e655b3050298bdc5a8` step-hold-terrain, `6ac3f1e68c0a2d36a3290ece`
medical-centre, `6ac3f1e68c0a2d36a3290eee` cap-electrical,
`6ac3f1e7bc72515b1d79913d` building, `6ac3f1e78c0a2d36a3290f36` ev-centre,
`6ac3f1e78c0a2d36a3290f59` hero-aerial, `6ac4173ae27b5fba958aeb48`
logo-vertical.svg.

Still to upload for Home: cap-lighting, cap-materials, cap-flooring,
cap-concrete, favicon.svg, mark-mask.svg (then point the `.mask-mark` URL in
`repo-css-pending.css` at the hosted file), the hero MP4 + poster.

Upload = `create_asset` (MD5 hash) then a multipart POST of the bytes to the
returned S3 `uploadUrl` with every `uploadDetails` field (201 = done). The
WHTML importer can't link CDN URLs to assets: bind images afterwards with
`set_image_asset`.
