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
