# Typography & Key-Functionality Audit — JHALAR Hanging Decor

**Audited:** 2026-09-08 · Branch `arena/01a080b2-jhalar-hanging-decor` @ `a79740b`
**Status:** ✅ Fixed on 2026-09-08 — see the "Fix Log - 2026-09-08" section in `AUDIT.md` and the branch PR. (One erratum recorded there: the modal zoom hint already passed contrast; its size was still raised to .75rem.)
**Scope:** Typography (type system, readability, contrast, hierarchy) + key site functionality.
**Method:** Static cascade analysis of `index.html` / `style.css` / `script.js`; WCAG 2.1 contrast math on the final computed palette; font-binary inspection (cmap, metrics, weights) with fontTools; functional smoke test of the real `index.html` + `script.js` + `content/*.json` executed in jsdom over a local server (filters, modal, nav, runtime settings all exercised against the actual shipped code). No fixes were applied — this is an audit only.

---

## 0. Verdict

The **reading layer is in good shape** (Arial body at 16px/1.6 with 43–52ch measures, strong ink contrast, sensible fluid clamps), and the **core catalogue machinery works** (35 products render, filter, modal, WhatsApp deep links, mobile nav all verified passing).

But the type system has **one critical functional bug, three WCAG contrast failures, a hierarchy inversion where a section heading out-sizes the page H1, and micro-type down to 8.3px in the mobile footer**. Underneath it all, `style.css` is now 40+ stacked override layers with **1,247 `!important` declarations**, which is already silently defeating later redesigns (two of the most recent typography systems in the file are dead code — see §5).

### Scorecard

| Area | Grade | One-line summary |
|---|---|---|
| Body readability | **A−** | 16px/1.6 Arial, 43–52ch measures, 9.4:1+ contrast; only micro-type drags it down |
| Heading hierarchy | **C+** | Contact H2 (72px @1440) outranks the hero H1 (64.8px); three different H2 scales |
| Color contrast | **B−** | Core palette passes; footer, inactive tabs and zoom hint fail WCAG AA |
| Type scale discipline | **C** | Good clamps, but 8.3–11.5px micro-type in five components |
| Font loading | **C+** | Only 1 of 3 preloaded weights is used; `font-display:block` (FOIT); 142 unused font files (2.9 MB) shipped |
| Key functionality | **B−** | Catalogue/filters/modal/nav pass; audience selector + planning picker are dead UI |
| CSS system integrity | **D** | 1,247 `!important`s; last-wins war zone; theme.json tokens mostly placebo |
| Tests | **C** | 70/72 pass; 2 failures are stale-test drift, not runtime bugs |

---

## 1. Type system inventory (final computed values)

Families in actual use (after the full cascade resolves):

| Role | Family | Weight | Notes |
|---|---|---|---|
| Headings H1–H3, product titles, modal title | **Mogranx** (self-hosted) | 500 | Locked by `!important`; Medium is the only weight actually rendered |
| Body, UI, nav, buttons, footer | **Arial/Helvetica** | 400/500/600 | Locked by `!important` (§35 override layer) |

### Fluid scale (desktop 1440 / phone 375, computed px)

| Level | Rule (winner in cascade) | @1440 | @375 |
|---|---|---|---|
| Hero H1 | `h1{clamp(2.5rem,4.5vw,4.75rem)!important}` (layer 35) | 64.8px | 37.5px (mobile hero override `clamp(2.15rem,10vw,3.15rem)`) |
| Section H2 | `h2{clamp(2rem,3.3vw,3.5rem)!important}` (layer 35) | 47.5px | 30px |
| **Contact H2** | `.contact-box h2{clamp(2.4rem,5vw,5rem)!important}` (layer 19, later) | **72px** | 30px |
| Modal H3 | `h3{clamp(1.35rem,2vw,2rem)!important}` (layer 35 beats later ID rules) | 28.8px | 21.6px |
| Product title | `.product-title{1.2rem!important}` (layer 35 beats later ID rules) | 19.2px | 19.2px |
| Body / leads | 16px, lh 1.6; hero lead `clamp(1rem,1.25vw,1.18rem)` | 16–18.9px | 16px |
| Audience tabs | `clamp(.95rem,1.4vw,1.08rem)` | 17.3px | 15.4px |
| Eyebrow / kicker | `.72rem` (11.5px), uppercase, 700, +.16em | 11.5px | 11.5px |
| Product category | `.64rem` / `.58rem` mobile | 10.2px | **9.3px** |
| Modal zoom hint | `.67rem` | 10.7px | 10.7px |
| Footer links | `clamp(.62rem,1.65vw,.88rem)` → `.56rem` @≤620px | 14.1px | **9.0px** |
| Footer column H4 | `clamp(.56rem,1.45vw,.75rem)` → `.52rem` @≤620px | 12px | **8.3px** |
| Footer copyright | `clamp(.62rem,1.55vw,.76rem)` → `.56rem` @≤620px | 12.2px | **9.0px** |

### The font itself (binary inspection, fontTools)

- Mogranx Regular/Medium/Bold are **genuinely distinct cuts** (different outlines; advance widths grow ~4.7% from Regular→Bold). Full a–z, 0–9, curly quotes, em-dash. **No `₹` glyph** (falls back to Arial if ever used in a heading). **No italic cut.**
- Large x-height (53.9% of em) — reads bigger than its point size; fine for display use.
- Internal family name of the Medium file is `"Mogranx Med"` (cosmetic only; the CSS `@font-face` binding is unaffected).
- **`<em>` in the hero H1 renders upright.** `h1 em{font-style:italic}` meets `font-synthesis:none` (inherited from the heading lock) and no italic face exists → the accent on “Colour *sets the mood.*” is silently dropped (weight 400-vs-500 is a ~3% stroke difference, imperceptible at display sizes).

---

## 2. Readability

**What’s working well**

- Body copy: Arial 16px, line-height 1.6, `#141942` on ivory (16.2:1). Long-form paragraphs in custom/story/contact sit at 48–58ch measures — textbook.
- Hero lead 46–48ch, section support text 43ch, audience note 52ch, modal description ~45ch in its ~380px column. All inside the comfortable 45–75ch band.
- Fluid clamps all have sane min/max (no runaway `vw` type); mobile H1 floor is 34.4px at 320px.
- Product descriptions: all 35 are 66–80 words (spec: 40–80), every product has alt text, images lazy-load, `text-wrap: balance/pretty` used on headings/description.
- `prefers-reduced-motion` is respected globally.

**Problems**

| # | Severity | Finding |
|---|---|---|
| R1 | **High** | **Mobile footer micro-type.** At ≤620px the “single-row footer system” keeps 4 columns and scales type down to **.56rem links (9px), .52rem H4 (8.3px), .56rem copyright (9px)**, with `overflow-wrap:anywhere` breaking `lokeshdugar040@gmail.com` mid-word inside a ~100px column. 8–9px is below any usability floor (HIG 11pt, Material 16sp) and contradicts `UX_STANDARD.md` §8 (“UI typography must prioritize readability”, every level must define a minimum size). |
| R2 | **High** | **Product category labels at 9.3px (mobile) / 10.2px (desktop)**, uppercase, 700, +.1em tracking. Uppercase + tracking at sub-11px sizes strips the word-shape cues that make small caps legible. These are the only per-card category signal above the title. |
| R3 | Medium | Eyebrow/kicker labels at 11.5px uppercase (red) — passable for 2-word labels but below the 12px floor most design systems hold for uppercase micro-labels. |
| R4 | Medium | **`font-display:block` on all three `@font-face`s** → up to ~3s FOIT: headings are invisible on slow connections while Mogranx loads (self-hosted, same origin, ~18KB, so usually fast — but `swap` costs nothing and removes the failure mode). |
| R5 | Medium | **Font preload waste:** `Mogranx-Regular.woff2` and `Mogranx-Bold.woff2` are preloaded (high priority, ~36KB) but **no element on the page renders them** — every Mogranx rule resolves to weight 500 (Medium). Meanwhile **142 of the 145 font files in `assets/fonts/` (2.9 MB) are dead weight deployed to the live site**. |
| R6 | Low | Modal zoom hint at 10.7px with 3.49:1 contrast (see C3) — a visible hint that is nearly illegible at the size where legibility matters most (it teaches the zoom gesture). |
| R7 | Low | `body{overflow-x:hidden}` — masks any horizontal overflow instead of fixing it, explicitly banned by the repo’s own `UX_STANDARD.md` §5. |

---

## 3. Contrast (WCAG 2.1, computed on the final cascade)

Core pairs — all comfortable:

| Pair | Ratio | AA (4.5) |
|---|---|---|
| Body `#141942` on ivory `#FFFAF1` | 16.19:1 | ✅ AAA |
| Headings `#622331` on ivory | 11.19:1 | ✅ AAA |
| Body `rgba(20,25,66,.82)` on ivory | 9.35:1 | ✅ AAA |
| Modal description `rgba(20,25,66,.78)` on `#FFFAF1` | 8.23:1 | ✅ AAA |
| Red accent `#C82039` (eyebrows, links, categories, WA link) on ivory/card | 5.43:1 | ✅ AA |
| Filter active `#FFFDF8` on `#622331` | 11.45:1 | ✅ AAA |
| Primary CTA `#FFFDF8` on `#C82039` / hover `#A71931` | 5.55 / 7.31:1 | ✅ AA / AAA |
| Toast `#FFFAF1` on navy `#141942` | 16.19:1 | ✅ AAA |
| Hero copy zone | ≥ ~11:1 | ✅ (copy sits on the near-solid ivory end of the gradient; five successive gradient overrides all converge to solid `#FFFAF1` at the copy position) |

**Failures:**

| # | Severity | Pair | Ratio | Detail |
|---|---|---|---|---|
| C1 | **High** | Footer text `rgba(255,250,241,.78)` on footer gradient `#C82039→#7D2634` | **3.79:1** on `#C82039`, 4.11:1 on `#BD1E37` | The 135° gradient is lightest at the top-left — exactly where the brand column and the start of the copyright bar sit. Footer links are 14.1px desktop / **9px mobile** (normal-size text ⇒ 4.5:1 required). Fails across the left half of the footer. |
| C2 | Medium | Audience tabs, inactive state `opacity:.58` | **4.16:1** | 15–17px normal text needs 4.5:1. The dimmed-state treatment dips below the floor; `.55`–`.58` opacity is the whole difference. |
| C3 | Medium | Modal zoom hint `rgba(20,25,66,.52)` | **3.49:1** | At 10.7px (R6) this is doubly hard to read. (`aria-hidden`, so no AT violation — but the humans it’s written for can’t read it.) |
| C4 | Low | Contact note `rgba(20,25,66,.62)` | 4.79:1 | Passes AA, but with no margin at 13px; any future background tweak tips it under. |

---

## 4. Hierarchy

**Sound:** DOM heading structure is clean (1× H1, 4× H2 sections, H3 product titles + modal title, H4 only in footer). Product cards have a strong internal hierarchy (category → title → image action). One primary CTA per section is mostly respected.

**Problems**

| # | Severity | Finding |
|---|---|---|
| H1 | **High** | **The contact section heading out-ranks the page title.** Contact H2 resolves to `clamp(2.4rem,5vw,5rem)` (72px @1440, up to 80px) while the hero H1 resolves to `clamp(2.5rem,4.5vw,4.75rem)` (64.8px @1440, cap 76px). From ~1520px viewport up, the contact H2 exceeds even the H1’s maximum. The page’s loudest type is a mid-page section heading. |
| H2 | Medium | **Three competing H2 scales:** standard sections 47.5px, contact 72px @1440 — a 1.5× jump between sibling section headings for no content reason (contact is the closer, not the opener). |
| H3 | Medium | **Three competing micro-label systems:** red eyebrow (11.5px, +.16em), audience label (12.5px, `#141942`, +.1em), planning label (13.1px, +.06em, uncoloured). Same job, three treatments. |
| H4 | Low | Footer H4 (12px/8.3px) vs footer links (14.1px/9px) — the column headers are smaller than the content beneath them on desktop (12 vs 14.1px), inverting label/content weight. |
| H5 | Low | The intended “function-first” card typography (Arial 1rem titles, layer “PRODUCT DISCOVERY”) is **dead code** — see §5 — so cards render Mogranx 19.2px titles the later redesign explicitly tried to replace. The shipped hierarchy is an accident of cascade order, not a decision. |

---

## 5. System integrity (why the above keeps happening)

`style.css` is 3,375 lines of **40+ stacked override layers** — multiple blocks literally titled “FINAL”, “authoritative”, “source of truth” — containing **1,247 `!important` declarations**. Concrete damage observed:

- **Layer 35’s `!important` typography locks beat every later, more specific rule.** Verified examples: the “PRODUCT DISCOVERY” card redesign (`#product-grid .product-title` → Arial 1rem/600/`#141942`, including its `.92rem` mobile size) is fully defeated by layer 35’s `.product-title{Mogranx,1.2rem,500,#622331!important}`. The modal title’s intended `clamp(1.55rem,2.4vw,2.2rem)` (ID-specificity, but normal) loses to `h3{...!important}`. Nav typography is declared Mogranx-16px in layer 34 and Arial-15px in layer 35 — the file contains two contradictory nav type systems, and which one ships depends on line order.
- **`theme.json` / editor Theme tab are mostly placebo.** `setTheme()` writes `--heading-weight`, `--heading-tracking`, `--heading-leading`, `--body-leading`, `--h1-size`, `--h2-size`, `--card-title-size`, `--grid-gap`, `--shell-max`, `--product-cols`, `--card-pad`, `--section-head-gap`, `--split-gap`, `--radius-card` — **none of these variables are consumed anywhere in `style.css`** (verified by grep). Only `--header-h` is consumed (8 uses). Documented tokens also disagree with reality: `theme.json` says headingWeight 700 / tracking −0.018em / bodyLeading 1.7 / container 1440px; the shipped site is 500 / 0 / 1.6 / 1200px shell.
- **Stale docs:** `README.md` still says the site uses “a single self-hosted DM Sans family”; it uses Mogranx + Arial. README’s live URL (`lokeshdugar040.github.io`) disagrees with canonical/OG/sitemap/robots (`jhalardecor.github.io`) — the canonical set is internally consistent and matches the git remote, so README is the stale one.
- `--header-h:82px` vs an 88px `.header-row` (desktop) and 64px vs 72px (mobile) — the fixed header overlaps ~6–8px of page content under it.

---

## 6. Key functionality (verified by executing the real code in jsdom)

**Passing — the catalogue core is solid:**

- ✅ 35/35 products render with `<img>` + alt text (0 empty alts); images lazy-load; all 70 image paths in `products.json` exist on disk.
- ✅ Filter rail builds dynamically (6 buttons: All + 5 categories), each with `aria-pressed`; filtering to “Pom Pom Hangings” correctly yields 8 cards; returning to “All” restores 35; active state and `aria-pressed` stay in sync; the rail auto-scrolls to the selected pill without moving the page.
- ✅ Product modal opens with category/title/description, composes the prefilled WhatsApp deep link (`wa.me/918100656258?text=Hello JHALAR, I am interested in <name>.`), locks body scroll, closes on Escape/backdrop/×, restores scroll, and restores focus to the invoking card. Zoom/pan engine (wheel, pinch, drag, double-click, bounded pan, reset on media change) is present and defensively coded.
- ✅ Mobile nav toggles with `aria-expanded` + label swap, closes on link click.
- ✅ Runtime pipeline works: `site-settings.json` / `theme.json` / `sections.json` / `custom-css.json` all fetch and apply (document.title, section copy, WhatsApp number verified applied); naming-gate validation runs as console diagnostics without blocking the catalogue; `content/*.json` all valid; `script.js`/`editor.js`/`scripts/product-naming.js` all parse.
- ✅ Reduced-motion, focus-visible outlines, semantic buttons/labels, `aria-live` regions (grid + modal status + toast) are all present.

**Broken:**

| # | Severity | Finding |
|---|---|---|
| F1 | **Critical** | **The audience selector and the planning picker are dead UI.** `initPremiumInteractions()` (script.js:70) — the function that wires the “Who we work with” tabs and the Wedding/Retail/Event/Custom picker — **is defined but never called anywhere**. Verified live: clicking “Retailers” leaves the note on the wholesale text and the active tab unmoved; clicking “Event” in the planning picker does nothing. The HTML ships `role="tablist"`/`role="tab"` with `aria-selected="true"` hardcoded on the first tab, so assistive tech announces a working tab set that doesn’t respond. (The previous commit was literally “Apply clean interactive audience selector on desktop and mobile” — the wiring was lost.) |
| F2 | Medium | `applySettings()` writes the footer tagline via `setTxt('.footer-row span:nth-child(2)', …)` — **`.footer-row` no longer exists in `index.html`** (footer was rebuilt as `.footer-grid`). Dead code path; `footerTagline` can never render. |
| F3 | Medium | **Runtime copy ≠ shipped HTML copy.** `site-settings.json` differs from the static HTML for heroIntro, collection/custom/about/contact titles + intros, meta description and `<title>`. Visitors see a copy flash as JS overwrites the HTML, and crawlers index different copy than users read. |
| F4 | Medium | **2/72 repo tests fail** (`node --test tests/*.test.js`): (a) `catalogue.test.js` expects static `data-filter` buttons in `index.html`, but filters have been dynamic since `renderFilters()` landed — stale assertion; (b) the gate-order test false-positives on the head version-checker’s inline `'script.js?v='` string (the actual `<script defer>` order is correct). The suite has drifted from the architecture — and it would block any CI gate built on it. |
| F5 | Low | Planning options carry no `aria-pressed`/`aria-selected` even in the dead code (needed when F1 is fixed); the tablist has no arrow-key handling (WAI-ARIA tabs pattern). |
| F6 | Low | Version manager force-reloads every visitor once per deploy (`?_jv=` via `location.replace`) and adds `?_fresh=` on logo clicks — deliberate cache-busting, but a full reload cost on the very first paint after each publish; canonical URL absorbs the SEO impact. |
| F7 | Low | Filter pills are `min-height:42px` (ID rule) — just under the 44px touch minimum the repo’s own UX standard asks for. |

---

## 7. Prioritized recommendations (not applied)

1. **Wire up `initPremiumInteractions()`** (one call) and add `aria-pressed` to planning options — restores two headline interactions (F1).
2. **Footer triage (R1 + C1 + H4):** on ≤620px let the footer stack to 2 columns/1 column and set a hard floor of ~12px text (ideally 12–14px); raise body/footer text to full-opacity ivory or darken the gradient’s light end to ≥4.5:1 across the whole bar.
3. **Lift micro-type floors:** product category ≥ .68rem everywhere (kill the `.58rem` mobile override); zoom hint to .75rem at `rgba(20,25,66,.7)`+; keep uppercase labels ≥ 12px (R2, R3, C3).
4. **Fix the H2 inversion:** cap contact H2 at the standard section scale (`clamp(2rem,3.3vw,3.5rem)`) or make it deliberately the closer’s echo of the H1 — but never larger than the H1 (H1 finding).
5. **Audience tab inactive state:** raise opacity to ~.72 (≈5.5:1) and signal selection with the underline alone (C2).
6. **Font loading hygiene:** `font-display:swap`, drop the Regular/Bold preloads, delete the 142 unused font files (~2.9 MB off the deploy) (R4, R5).
7. **Reconcile the token system:** either make `style.css` consume the `--heading-*`/`--*-size` variables or delete them from `theme.json` + the editor Theme tab; update README (DM Sans → Mogranx/Arial; live URL). Then start collapsing the override layers — every finding in §5 is a symptom of layer-35 `!important` locks outranking later intent (the card and modal redesigns are already dead code).
8. **Fix the two stale tests** (dynamic filters; gate-order check should target the `<script defer>` tags, not any substring) and re-enable the suite as a publish gate (F4).
9. Small repairs while in there: `em` accent (use a real style lever — colour or weight — since synthetic italic is disabled), `.footer-row` tagline selector, `--header-h` 82→88 / 64→72, replace `overflow-x:hidden` with the actual overflow fix, and sync `site-settings.json` copy with the shipped HTML (or render from one source).

---

*Audit artifacts: computed contrast table and jsdom functional log reproduced inline above; no repository files were modified by this audit.*
