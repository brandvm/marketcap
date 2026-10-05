# MarketCap Webflow build — session handoff

Last updated 2026-10-05 (end of day). Read this first when resuming on a
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
| 5 | Components | **In progress** — see below |
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
| Nav (Global) | `722d79d0-a781-bebe-927c-95abea6d8b6f` | G \| Nav W › G \| Nav (nav) › Nav Component. Toggle is now a real `<button>`. |
| Footer (Global) | `e5c41852-4c9b-7995-afff-4609aa305c82` | Newsletter class on the FormForm. Logo asset `6ac4173ae27b5fba958aeb48`. |
| Closing CTA (Sections) | `7d517192-6e85-cab8-5eea-974a1c919e13` | Heading, Text, Button Link, Anchor ID; variant Reversed `8c46e651-a853-052d-0495-355e2a3d765f`. Built from Home markup (has `id="mark"` + `data-brand-lines`). |
| Photo Band (Sections) | `fb7d0108-1312-fb00-e7b4-aeed40553e42` | Image, Value, Caption (also aria-label). |
| Page Head (Sections) | `f54db91e-74a0-bf34-69a3-c98f01bff43e` | Chip, Heading, Text, slot (Kajal renaming to Control). |
| Mark Figure (Content) | `b8791d08-8be4-699b-1966-7c7313999fa4` | Image, Image Alt, Image ID, switches Is Caps / Is Contact → conditional classes (Kajal wired them). |
| Dev Card (Content) | `0da92a6e-ba9f-bf93-2611-05a773fd11fa` | Title, Link, Image, Address, Fact 1–3, GFA, GFA Count, Storeys, Parking, Acres, Heading Tag (Kajal added). Binds to CMS later. |
| Global Components | `93e9b303-4d7e-d42e-0873-4e5de2cfda77` | Pre-existing: the loader embeds. Must be on every page. |

Remaining in step 5:

1. **`<button>` fix (in progress).** The WHTML importer turns `<button>` into
   a Link (`<a type="button">`, no href, not focusable). Fix = create a DOM
   element with `dom_tag: button`, same classes and attributes, move the
   children in, remove the Link. Done for the Nav toggle. Still to do: 22 on
   the style guide (query elements with attribute `type=button`). Build every
   future button this way, not through WHTML.
2. **Gallery** — from `.gallery` in Components section (has
   `data-lightbox-group`, `data-lightbox`, hidden Gallery Source with
   `data-lightbox-item`). Convert its buttons first, then transform. Static
   images now; CMS multi-image later.
3. **Plans Slider** — the whole template section (`data-slider`,
   `data-slider-prev/next`, `data-slider-track`), placed as a new preview in
   Page components.
4. **Searchable Select** — Finsweet Combo Box + List Sort (Kajal: "finsweet
   now"). Script tag goes in Site settings head (manual) and later in
   `loader.html`. Check Finsweet Attributes v2 docs for current attribute
   names before building.

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
