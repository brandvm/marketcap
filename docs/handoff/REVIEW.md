# MarketCap — review phase

Dev phase closed on 2026-10-08 (last dev commit `ca13a3d`). Every page in the
approved prototype and the newer Figma is built in Webflow, wired to the CMS
and the repo bundle, and checked against the prototype at 1440, 820 and 390.
From here on, work is driven by review feedback.

## What is built (staging: https://marketcap.webflow.io)

| Page | URL | Notes |
| --- | --- | --- |
| Home | `/` | Hero film, Story pin (sepia → black-and-white stats photo), Timeline, Dev cards, Approach, Capabilities, Closing CTA |
| Developments | `/developments` | CMS list, Searchable Select + List Sort, reversed Closing CTA |
| Development template | `/developments/<slug>` | Every Figma section, CMS-bound; Plans behind the dev-phase PIN gate with a blurred preview |
| Contact | `/contact` | Form (Webflow forms + Turnstile), contact info with Phone, live map with warm tint |
| Privacy, Terms | `/privacy`, `/terms` | Shells with `[bracketed]` placeholder copy, noindex |
| 404 | `/404` | |
| Style guide, Media | `/design/style-guide`, `/design/media` | noindex; §08 keeps Timeline, Lightbox and Plans previews (script-only classes, and Section Is Large / S Wrapper Is Narrow, Is Text kept by Kajal) |

SEO: every page has a title, description and share image; development pages
build theirs from CMS fields. JSON-LD: Organization (Home), ContactPage
(Contact), Place (each development), all in page head code.

## How review works

- Feedback comes in rounds. Each round: Claude lists the items, fixes them
  (Designer first, repo CSS only with a `repo-css:` tag), publishes to
  staging, verifies at 1440 / 820 / 390, and asks before every commit.
- Anything the API can't do goes in `MANUAL-TODO.md` (next letter: AM).
- Every surprise goes in `GOTCHAS.md`.
- Staging updates on every push. If reviewers need a build that doesn't move
  under them, cut a tag and set `RELEASE` (README › Release).

## Round 1 (2026-10-13, internal review notes from Kajal)

| # | Item | Where | Status |
|---|---|---|---|
| 1 | Remove the "Made in Webflow" badge | Site settings › General (needs a paid site or Workspace plan) | Kajal |
| 2 | Nav bar shows again on scroll up | `nav-state.ts` + repo CSS `.is-up` | Pushed; motion to check on staging |
| 3 | "View" cursor button follows without lag | `cursor-button.ts` (no easing) | Pushed; to check on staging |
| 4 | Capabilities steps through the items by itself (3 s), hover still picks | `capabilities.ts`. Follow-up 2026-10-13: a hairline under the active item fills over the 3 s (`--cap-progress`, repo CSS js-state); needs Cap Item position relative in the Designer | Autoplay pushed; progress line built, waiting for commit OK |
| 5 | Footer changed colour when a project was clicked | `transition.ts`: the image zoom no longer fades the dark overlay over the old page; zoom only from an image at least half on screen. Follow-up 2026-10-13: Barba ignored that rule, so footer links ran the zoom with no image and looked dead; the rule now sits inside `to` and they get the default transition (GOTCHAS) | Fix built, waiting for commit OK |
| 6 | Footer: remove phone numbers, add "Design by BVM" | Webflow (Footer component) | Done 2026-10-13, on staging. Phone span removed; third legal link "Site by: Brand Vision" → https://www.brandvm.com (new tab; wording from Kajal) |
| 7 | Projects page: remove the Sort by filter | Webflow (Developments page) | Done 2026-10-13, on staging. Searchable Select instance removed from Page Head's Control slot; the component and the Finsweet module stay (style guide) |
| 8 | Contact: Google map inside the logo mask (or a linked map image); remove phone numbers | Webflow (Contact page), JSON-LD phone too | Done 2026-10-13, on staging. Phone Label Group and both JSON-LD `telephone` entries removed. The Mark Figure instance is unlinked on this page: its image is now a div (Mark Figure Media + Mask Mark) holding the Map Frame iframe and Map Tint, so the live map shows through the mark (720×294 at 1440, 370×151 at 390). The lower "Where we are" heading and Map section were removed (Kajal, 2026-10-13); the class Contact Where is now unused anywhere, and Map / Map Card / Map Frame live on only on the style guide |
| 9 | Mobile pass | Staging at 390 | Started: no sideways scroll, no text under 12px; small tap targets (Cap items 20px, footer links 25px, legal links 13px, Contact text links 14px); the Contact map's address card covers about half the map. Animated sections still to review with the browser pane visible |

### Round 1 follow-ups (2026-10-13, Kajal's phone screenshots)

| Item | Where | Status |
|---|---|---|
| Dev Card on phones: even 2-column stat grid with one divider, numbers 1.75em, padding = card body padding, stronger Is Dim overlay behind the title and facts | Webflow, Mobile Landscape and down (Dev Stats, Dev Stat + nth-child(even), Dev Stat Value, S Bg Overlay › Is Dim) | Done, on staging |
| Hero: H1 and text lose contrast on bright video frames | Webflow, S Bg Overlay › Is Gradient (0.34 → 0.3 at 35% → 0.6; was 0.2 → 0 at 30% → 0.55), all breakpoints | Done, on staging |
| Approach on phones: photo stays in the viewport with the zoom, steps scroll over it in one column, the step at the reading line is active (others 40%) and its photo fades in | Webflow (Steps List 1 column, Steps List Item opacity override removed at Mobile Landscape) + `approach-steps.ts` `.is-stacked` + repo CSS js-state | Done, on staging (812087b). Later the same day: S Bg Overlay › Is Strong darker at Mobile Landscape (0.72 → 0.58 → 0.8), and new combo D4 › Is Step (1.5em at Mobile Landscape) on the five step titles. Square on the left, text on the right: Steps List Item is a 2-column grid at Mobile Landscape (Is Cms keeps flex for the template's Stages), new combo Marker › Is Step spans the three text rows |
| Story stats on phones: photo was stretched over the whole section; now one viewport tall and sticky, changing to the black-and-white stats photo when the cards arrive | `story-sequence.ts` `.is-stats-on` + repo CSS js-state (`.story.is-static`) | Done, on staging (812087b) |
| iOS Safari: see-through strip between the collapsed Safari bar and the open nav menu | Nav Menu height 100svh → 100lvh (Webflow at Tablet; same value in the repo's desktop sheet rule) | Webflow on staging; to confirm on an iPhone. Repo line waiting for commit OK |

## Open design decisions

| Item | Now | Options |
| --- | --- | --- |
| Inactive Capabilities items | Clay at 40%, contrast 1.8:1 | 70% (≈ 3:1), or keep as decorative |
| Footer legal line, Story "Scroll" caption | 60% opacity, 4.37:1 | 64% reaches 4.5:1 |
| Hero video pause (WCAG 2.2.2) | none; reduced motion shows the poster | small pause button in the hero corner |
| Word-only Location figures (EV page) | same size as numbers | smaller size for word values |
| Cursor "View" button icon | current size | Kajal's call |
| Story on phones | static, sepia photo only | also show the black-and-white photo behind the stats |

## Before launch

- [ ] Client content: era photos (Timeline), step photos (Approach),
      Industrial coatings photo, real plans; Privacy and Terms copy; the
      medical centre's `[Site plan application — status]` and
      `[Approvals — status]`; team content if Leadership Team gets a page
      (it points to `/#about` for now).
- [ ] Replace the Plans PIN gate (`plans-gate.ts`) with real protection if
      the plans must stay private; it hides, it doesn't protect.
- [ ] Remove noindex from `/privacy` and `/terms` once their copy is in.
- [ ] Buy the site plan → MANUAL-TODO A (sitemap and search settings).
- [ ] Attach the custom domain; tag a release whose CI passed and set
      `RELEASE` (README › Release) before the domain goes live.
- [ ] Final pass: `pass`, `anchors`, `outline`, `transitions`, `load-film`
      at three widths on the release build.
