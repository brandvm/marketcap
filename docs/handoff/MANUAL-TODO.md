# Manual Designer entries — MarketCap Webflow build

Values the Webflow connector cannot write (a variable inside `calc()`, a
gradient or a shadow collapses to a single variable — see
`marketcap/GOTCHAS.md`). Kajal enters these in the Designer in one pass;
Claude then reads each back to check the variables are linked.

On the style guide page, each affected specimen carries a small note
(Caption + Text Accent, attribute `data-manual-todo`) so it can be found
and removed once done.

How: select the class → switch to the breakpoint → type `calc(` in the
field and insert variables with the variable picker. Gradients: Backgrounds
→ linear gradient, pick each colour stop from the variables.

| # | Class | Breakpoint | Property | Value (⟨ ⟩ = pick the variable) | Done |
|---|---|---|---|---|---|
| 1 | Section + Is Hero | Desktop | Padding top | `calc(⟨Nav/Height⟩ + ⟨Section/Padding V⟩)` — the style guide's hero previews are Section › Is Ironstone › Is Hero: select one, remove Is Ironstone in the selector field, enter the value on Section › Is Hero, then add Is Ironstone back | ☑ entered 10-05 |
| 2 | Section + Is Top | Desktop | Padding top | `calc(⟨Nav/Height⟩ + ⟨Section/Padding V Compact⟩)` | ☑ entered 10-05 |
| 3 | Timeline List Wrapper | Desktop | Margin left | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 |
| 4 | Timeline List Wrapper | Desktop | Margin right | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 |
| 5 | Timeline List | Desktop | Background | Gradient 90°: ⟨Brand/Field⟩ 0% → 17.65%, transparent 17.65% → 100% (done by Kajal in the Designer). The tiling (`background-size: 17px 1em; background-repeat: repeat-x`) goes in repo CSS — queued in repo-css-pending.css. Until the repo is pushed, the canvas shows one wide stripe instead of ticks. | ☑ gradient done · tiling waits for repo step |
| 6 | Timeline Dot | Desktop | Box shadow | 0 0 0 1em ⟨Field Tint/Field 20⟩ | ☑ entered 10-05 |
| 7 | Timeline Line | Desktop | Background | linear gradient 180°: ⟨Field Tint/Field 12⟩ → ⟨Brand/Field⟩ | ☑ entered 10-05 |
| 8 | Timeline Fade + Is Left | Desktop | Background | linear gradient 90°: ⟨Brand/Chalk⟩ → transparent | ☑ entered 10-05 |
| 9 | Timeline Fade + Is Right | Desktop | Background | linear gradient 270°: ⟨Brand/Chalk⟩ → transparent | ☑ entered 10-05 |
| 10 | Dev Card | Desktop | Top | `calc(⟨Nav/Height⟩ + ⟨Spacing/24⟩)` | ☑ entered 10-05 |
| 11 | Dev Card | Desktop | Height | `min(47.25em, calc(100svh - ⟨Nav/Height⟩ - 3em))` | ☑ entered 10-05 |
| 12 | Steps List Track | Desktop | Left | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 |
| 13 | Steps List Track | Desktop | Right | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 |
| 14 | Steps List Progress | Desktop | Left | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 |
| 15 | Steps List Progress | Desktop | Right | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 |
| 16 | Slider Track | Desktop | Margin right | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 (visual check pending) |
| 17 | Mark Figure + Is Caps | Tablet | Width | `calc(100% + ⟨Section/Padding H⟩)` | ☑ entered 10-05 |
| 18 | Mark Figure + Is Caps | Tablet | Margin right | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 |
| 19 | Mark Figure + Is Contact | Desktop | Margin right | `calc(⟨Section/Padding H⟩ * -1)` | ☑ entered 10-05 |
| 20 | Mark Figure + Is Contact | Desktop | Margin left | `calc(⟨Spacing/8⟩ * -1)` | ☑ entered 10-05 |
| 21 | Nav Menu | Tablet | Height | `calc(100svh - ⟨Nav/Height⟩)` | ☑ entered 10-05 |
| 22 | Gallery Thumb + Is Active | Desktop | Outline offset | `calc(⟨Spacing/2⟩ * -1)` | ☑ entered 10-05 |
| 23 | Select List | Desktop | Top | `calc(100% + ⟨Spacing/4⟩)` | ☑ entered 10-05 (visual check pending) |

## Other manual items

| # | Item | Why | Done |
|---|---|---|---|
| A | Style guide page settings → turn off **Sitemap indexing** | The API answers "Site plan doesn't support sitemap indexing controls" (403). The toggle may also need a paid site plan. | ⏸ blocked — no site plan yet (built on the freelancer Workspace plan). Do it when the site plan is bought, before launch. |
| B | Style guide page settings → **Exclude from site search** | No API for it. | ☑ done 10-05 |
| C | Style guide page settings → Custom code (head): `<meta name="robots" content="noindex">` | Keeps search engines out even if the page is linked; no API for page custom code. | ☑ done 10-05 |
| D | Style guide: delete the last Section (the scratch section with the tag-touch headings/paragraph/link) | It was only there to create the tag styles. Delete it in the Navigator, below the Page components section. | ☑ done 10-05 |
| E | Delete the test class **Label** (Style Manager) | Your test class from earlier; nothing uses it. | ☑ deleted via MCP 10-05 |
| F | Page Head component: rename its slot **Slot** → **Control** | The API can't rename slots. | ☑ done 10-06 (Kajal) |
| G | Style guide: drag the table of contents (nav "On this page", now just below the Page Head) into Page Head's slot | The API can't move elements into a slot. | ☑ done 10-06 (Kajal) |
| H | Mark Figure component, conditional classes: root **Is Caps** when switch *Is Caps* is on; root **Is Contact** when *Is Contact* is on; Mark Figure Line H **Is Short** when *Is Contact* is on | Your call (switch + conditional classes). Until then the Capabilities and Contact previews show the base placement, and Is Caps / Is Contact / Is Short are unused. | ☑ done 10-05 (Kajal) |
| I | Dev Card title heading level: h3 by default; the Developments listing uses h2 | The API has no prop type for a heading tag. Bind the tag in the Designer if it offers it, or set it per page later. | ☑ done 10-05 (Kajal, Heading Tag prop on Dev Card) |
| J | Searchable Select: Select Input → Settings → **Placeholder** `Sort by` | The API treats `placeholder` as a reserved attribute and has no placeholder setting. | ☑ done 10-06 (Kajal) |
| K | Searchable Select: check the hidden select (Select Native) has 4 options — `` "Sort by"; `date-desc` "Newest first"; `gfa-desc` "Largest GFA"; `name-asc` "Name A–Z" | Imported through WHTML; the API can't read or write select options. Values must match List Sort's `field-asc/desc` format, and Combo Box lists options sorted by value, which is why "Oldest first" was dropped (Kajal, 2026-10-06). | ☑ done 10-06 (Kajal) |
| L | CMS › Developments › field **Acres**: Number format → Decimal, 2 places. Then enter 1.03 (medical centre) and 1.08 (EV centre), or tell Claude to fill them | The API created it as a whole-number field and can't change a field's format; both items have Acres empty until then. | ☑ done 10-06 (Kajal; Acres filled by Claude) |
| M | Collection template pages **Milestones** and **Program Rows**: exclude from search and sitemap (or leave them unlinked) | Their items must be published to show on Home / the Development template, so Webflow serves a template page for each. Nothing links to them. | ☑ done 10-06 (Kajal) |
| N | Home › Hero Card (Link Block in the hero Collection List) → Link Settings → **Collection Page › Current Development** | The API can't set a "current item" link: `collectionPage` and `page` modes publish a literal or `/developments`. The Dev Card links need the same setting. | ☑ done 10-06 (Kajal) |
| O | **C \| Video** component: each `source` → Visibility → **Conditional**: WebM source when *WebM URL* is set, MP4 source when *MP4 URL* is set | The API only binds visibility to boolean props. Until then an empty `<source src="">` is output (harmless, the browser skips it). | ☑ done 10-06 (Kajal) |
| P | Pages panel: drag the new **Media** page (now `/media`) into the `design` folder → `/design/media`; Page settings: exclude from search, add `<meta name="robots" content="noindex">`. Then add a **Background Video** with `video/out/hero-1080-graded.mp4`, publish, and tell Claude | The API can't move a page into a folder. Webflow transcodes the upload to muted .mp4 and .webm; Claude copies those URLs into the hero C \| Video (now on the raw upload as a stand-in). | ☑ done 10-06 (Kajal) |
| Q | Re-paste all three snippets from `marketcap/loader.html` (head code, the Embed in Global Components, footer code) and publish | Load-flash fix: font preload, paint held until repo CSS loads, stylesheet URL set once. A push never updates these. | ☑ done 10-06 (Kajal) |
| R | CMS › Developments › field **Stage**: rename option **Planning** → **In planning** | Kajal's choice (10-06). The API can't edit option names; renaming in the Designer keeps the option id, so items keep their stage. | ☑ done 10-06 (Kajal) |
| S | Home › Developments list › **Dev Card** instance → prop **Link** → Collection Page › **Current Development** | Same API gap as N: a link prop only takes url/email/phone. Until then both cards link to the medical centre (the component default). The Developments page and the template's "Other development" card need the same once built. | ☑ done 10-06 (Kajal) |
| T | **Mark Figure** component → root → Custom attributes → `class` = Conditional → *If Is Caps = True*: change the text **is-cap** → **is-caps** | The value is a typed class name, and `is-cap` is the Marker combo's class, so Home and the style guide publish `mark-figure is-cap` and the collage loses its desktop placement. The API can't edit a conditional attribute value. Checked with `is-caps` added in the browser: the section then matches the prototype at 1440, 820 and 390. | ☑ done 10-06 (Kajal) |
| U | Style **Story CTA** → Margin Top: `calc(⟨Content/Gap⟩ * 0.875)` (variable picker inside calc) | In the prototype the gap sits on the button (font size 0.875em), in Webflow on the Story CTA wrapper (1em), so the same 2em computes 4px larger (32 vs 28 at 390, 34 vs 30 at 1440) and Story runs 4px long, pushing every section below. The API collapses a calc with a variable into a plain binding (GOTCHAS). | ☑ done 10-06 (Kajal) |
| V | Developments page: drag the **Searchable Select** (now just above the Dev List) into **Page Head › Control** slot | The API can't move or insert elements into an instance's slot. | ☐ |
| W | Developments page › Dev List › **Dev Card** instance → prop **Link** → Collection Page › **Current Development** | Same API gap as N and S; until then every card links to the medical centre (the component default). | ☐ |
| X | **Closing CTA** component → switch to the **Reversed** variant → select the CTA Grid element (S Wrapper · is-wide · CTA Grid) → Flex direction **Row reverse** | The variant's override sits on the global CTA Grid style, but the element's own style is the combo `.s-wrapper.is-wide.cta-grid`, so Webflow never adds the variant class and every Reversed instance (Developments, style guide) renders the base layout. The API's variant styles are addressed by style name and can't reach the combo. | ☑ done 10-07 (Kajal) |

## Not manual — waiting for the repo step

`repo-css-pending.css` (107 rules) goes into `marketcap/src/styles.css`,
tagged per AGENTS.md, when the repo work starts.
