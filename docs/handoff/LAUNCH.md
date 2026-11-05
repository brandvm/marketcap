# MarketCap — launch tracker

From `wf-template/.claude/skills/webflow-launch/SKILL.md` (template 0.18.0).
This repo predates the `pnpm wf:*` scripts: the checks ran from the
template's scripts with a config pointing at staging (`--live` against
https://marketcap.webflow.io, so they saw exactly what visitors get).

Status: **live** at https://www.marketcapltd.com (apex and http redirect
there with a 301). Found 2026-11-05; the repo notes still said "not
launched". The pre-launch QA below ran on staging the same day; the
post-launch checks at the end ran on the live domain.

## Pre-launch QA — run 2026-11-05 (claude)

Pages checked: `/`, `/developments`, both development items, `/contact`,
`/terms`, `/404`.

### Content

- [x] No `#` links, no lorem ipsum, no broken internal links (wf:links).
- [ ] Placeholder copy: `/terms` is still "[Terms of use to be provided by
      Market Cap Sales Ltd.]". `[ Municipalities served ]` and
      `[ Aug 2026 ]` are bracket-style design labels, not placeholders.
- [x] No `data-manual-todo` markers in the published HTML.
- [ ] `REVIEW.md` › Before launch: none of the six items ticked yet.
- [ ] Contact data — **needs a decision:**
  - footer `mailto:` on every page is `sales@marketcapltd.com`; Contact
    page and JSON-LD use `info@marketcapltd.com`;
  - no phone number anywhere (no `tel:` link, no `telephone` in JSON-LD);
  - JSON-LD `@id` still `https://marketcap.com/` (open question from
    2026-10-28: should it be the production domain?).
- [ ] Legal pages: **footer has no Privacy or Terms link.** `/privacy-policy`
      returns 404; `/terms` exists but is a placeholder with noindex.
- [ ] Copyright line reads "© Market Cap Sales Ltd." with no year (fine
      if intended). No social links (fine if the client has none).
- [ ] Person: proofread every page.

### Function

- [x] All links and buttons resolve; the one external link
      (brandvm.com) answers (wf:links --external).
- [x] Real 404: unknown URLs return HTTP 404 with the custom page.
- [x] No console errors on `/developments`.
- [x] No sort or filter on Developments any more (two items), so nothing
      to test there.
- [ ] Person: submit Contact Enquiry and Newsletter once each on a normal
      browser (Turnstile blocks headless); check the inbox — the Forms
      notification recipient is still unconfirmed (2026-10-28).
- [ ] Footer markup: a stray `<link rel="noopener" href="https://www.brandvm.com">`
      sits after the "Site by" link — a `rel` attribute created as an
      element. Harmless, but remove it in the Footer component.

### Devices, accessibility, speed

- [x] Overflow: nothing runs off the right edge on any page at 2560–360
      (13 widths each).
- [ ] Accessibility (axe, WCAG 2.2 AA, 1440 and 390): one rule fails
      everywhere — **color-contrast**:
  - footer legal line (`© …` and "Site by") on every page — the 60%
    opacity open decision from the handoff;
  - Mark Figure X/Y guide labels (dev pages, Contact) — decorative;
  - Plans gate login line (`[data-gate-login]`, text-secondary on Clay);
  - Chip is-dark and caption on Clay sections (known 3.44:1 / 4.29:1);
  - `#about-heading` at 390 on Home.
  No other serious or critical rule fails.
- [ ] Person: real devices (iPhone Safari, Android Chrome; desktop
      Chrome, Safari, Firefox, Edge); screen reader spot check.
- [ ] Keyboard walkthrough: not done (the browser pane was hidden).
- [ ] Performance, phone profile (5 runs, median). CLS 0 and TBT under
      100 ms everywhere; **LCP misses 2.5 s on every page:**

      | Page | Score | LCP | Transfer |
      | --- | --- | --- | --- |
      | `/` | 73 | 12.3 s | 11.1 MB |
      | `/developments` | 74 | 8.4 s | 1.4 MB |
      | four-storey medical centre | 72 | 8.1 s | 13.4 MB |
      | EV centre | 74 | 7.0 s | 6.1 MB |
      | `/contact` | 80 | 4.5 s | 2.8 MB |
      | `/terms`, `/404` | 81–85 | 4.0–4.7 s | 0.6 MB |

      Desktop scores 99 on the light pages. The weight on Home and the
      medical centre is the hero video (1080p, 9 MB / 9+ MB): a 720p
      phone source (or a smaller poster-first load) is the biggest win.

### SEO and tracking

- [x] Every page has a title, description, canonical and one H1, except:
  - [ ] `/404`: no meta description, no OG description or image, no H1;
  - `/` description is 177 characters (note);
  - EV centre title is 71 characters (note).
- [x] JSON-LD parses with no HTML entities (Organization on Home,
      ContactPage, Place on both developments). `/developments` has none
      (add one or accept).
- [x] Favicon on every page.
- [ ] `/terms` is noindex (expected until its copy is in).
- [ ] `robots.txt` disallows everything and there is no `sitemap.xml`:
      expected on staging without a site plan; must change at launch.
- [ ] "Made in Webflow" badge markup is present (hidden by the temporary
      head style, MANUAL-TODO AM); goes away with the site plan.
- [ ] Canonicals on the live domain: after the domain is attached.
- [ ] Tracking: no analytics or tag manager loads on staging yet;
      run `wf:tracking --live` once tags are on the domain.

## Post-launch checks — run 2026-11-05 on www.marketcapltd.com (claude)

- [x] Domain (wf:domain): certificate Google Trust Services, expires
      2027-02-02 and renews itself; marketcapltd.com registered at GoDaddy
      until 2028-01-06; DNS at GoDaddy.
- [x] Redirects: http → https, apex → www, trailing slash removed; the
      query string survives every hop (gclid/UTM safe).
- [x] Links (wf:links --live --external): 7 pages, no 404s, no chains.
- [x] robots.txt allows indexing; no page has a stray noindex except
      `/terms` (placeholder, intended).
- [ ] **RELEASE was `null` in the head code: the live site loaded the
      staging bundle** (`brandvm.github.io/marketcap/…`), so every push to
      master went live at once. Tagged **v1.0.0** on `7bc0175` (CI passed,
      `dist/` rebuilt clean) with Kajal's OK, 2026-11-05; jsDelivr serves
      `@1.0.0/dist/index.js` and `styles.css` byte-identical to the tag.
      `loader.html` has `RELEASE = "1.0.0"`. Left: paste that into the
      Webflow head code, publish, check the live page loads `@1.0.0`.
- [ ] **No canonical tag on any page.** Site settings › SEO › Global
      canonical tag URL: `https://www.marketcapltd.com`, then publish.
- [ ] **No `sitemap.xml` (404).** Site settings › SEO › Auto-generate
      sitemap, then exclude `/design/*`; submit it in Search Console.
- [ ] "Made in Webflow" badge markup still present (hidden by the
      temporary head style): turn it off in Site settings › General and
      remove the style (MANUAL-TODO AM).
- [ ] **No analytics or tag manager** on any page, and no cookie banner
      (wf:tracking --live: nothing tracks). Add GA4 if the client wants
      visit data; a consent banner goes with it.
- [ ] JSON-LD `@id` and URLs point at `https://marketcap.com/` — a
      different company's live site. Change to the live domain.
- [ ] wf:install: the template's checker expects its newer snippet names
      (`wfc`); this project's `bv` snippets differ by design, so its
      findings are not actionable, apart from RELEASE above.
- [ ] Person: Search Console — verify the domain, submit the sitemap,
      export "Not found (404)" after a few days.
- [ ] Person: week 1 leads arriving; weeks 2–4 indexing and traffic.
- [ ] 30-day check-in (around 2026-12-05): wf:domain again.

## Known issues

| Issue | When | Owner |
| --- | --- | --- |
| Privacy and Terms copy, pages and footer links | fix before launch | client copy → Kajal |
| Footer email sales@ vs info@ elsewhere; no phone | fix before launch | Kajal (decide) |
| JSON-LD `@id` domain | fix before launch | Kajal (decide) |
| Forms notification recipient; one real submit per form | fix before launch | Kajal |
| Phone LCP 7–12 s (hero videos) | fix before launch | claude (720p sources) |
| Contrast: footer legal line, Clay chip/caption, gate line | decide before launch | Kajal |
| `/404` description, OG image, H1 | fix before launch | claude |
| Stray `<link>` in Footer | fix before launch | claude |
| Live loads the staging bundle (RELEASE null) | fix now | claude, with Kajal's OK |
| No canonical, no sitemap, badge setting | fix now | Kajal (Site settings) |
| JSON-LD `@id` on marketcap.com | fix now | claude (sent to Webflow session) |
| No analytics / consent | decide | client → Kajal |
