# Repository Audit - JHALAR Hanging Decor
**Audited:** 2026-09-02 | Branch `arena/01a06229-jhalar-hanging-decor` @ `517d60f`
**Verdict:** Well-designed static marketing site that is **not yet functional as shipped** - no real product images render, contact info is placeholder, and the CMS/data pipeline is fragmented across three incompatible setups.

---

## 1. What This Repo Is
A single-page **B2B marketing website** for "JHALAR Hanging Decor" - a Howrah, India manufacturer of handcrafted decorative hangings (pom-pom, bead, bell, floral jhalars, torans, tassels) targeting event planners, wholesalers, and retailers.

**Tech stack:** Plain HTML5 + CSS3 + vanilla JS. No framework, no build step.
**Intended hosting:** Netlify (forms + CMS) - but docs also push GitHub Pages (conflicting, see section 4.2).

### File inventory
| Path | Purpose | Notes |
|---|---|---|
| `index.html` (520 ln) | The entire site: hero -> trust strip -> features -> product grid -> custom orders -> applications -> CTA -> process -> about -> FAQ -> contact form -> footer + product modal | [OK] Clean semantic markup |
| `style.css` (1,411 ln) | Full design system: CSS variables for brand colors (`#C82039` red, `#C9A84C` gold), Playfair Display + DM Sans, 5-level shadows, responsive grids | [OK] Professional quality |
| `script.js` (346 ln) | Product loading from JSON, category filters, mobile nav, FAQ accordion, product modal, scroll-reveal, form UX | [OK] Valid syntax, graceful fallbacks |
| `content/products.json` | 8 products consumed by the frontend | [!] Hand-maintained, images 404 |
| `product/` (35 folders, **22 MB**) | Real product photos (`Products_0000...` with spaces/UUIDs in names) | [X] **Not referenced by any code** |
| `admin/` (Decap CMS) | `config.yml` + `index.html` + logo | [X] Points at non-existent `static/images/products/` |
| `tina.config.ts` + `package.json` | TinaCMS (a *second*, competing CMS) | [X] Incomplete - targets empty `_products/` |
| `content/products/*.md` | 1 markdown product (Decap format) | [!] Orphaned: not read by frontend |
| 7 x `*.md` status docs + `AUTO_DEPLOY.sh` + `OPEN_IN_BROWSER.html` | Deployment guides written by a previous AI/dev pass | [!] Redundant & mutually contradictory |
| `privacy.html`, `404.html`, `sitemap.xml`, `robots.txt`, `netlify.toml`, `analytics-placeholder.html` | Supporting files | [!] Issues below |

---

## 2. What Works
- **Design system is genuinely good** - consistent tokens, typography, responsive grids, accessible contrast.
- **JS is solid:** valid syntax, `loadProducts()` has error handling with hardcoded fallback products, modal closes on Escape/overlay, accordions manage `aria-expanded`/`hidden`, mobile nav toggles `aria-expanded`, form uses proper labels + `autocomplete`.
- **SEO basics:** title, meta description, keywords, semantic headings.
- **Netlify security headers** (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`) and long-cache on `/assets/*`.
- `products.json` is valid JSON; `404.html`, `privacy.html`, favicon, SVG logo all present.

---

## 3. Critical Issues
### 3.1 The site renders ZERO real images
`script.js` **ignores the `image` field entirely**. Both `renderProducts()` and `openProductModal()` output a static `<div class="img-placeholder">...{title} Image</div>` instead of an `<img>`. The modal's `#modal-image` element is never updated by JS. Meanwhile:
- `assets/images/products/` is **empty** (only `.gitkeep`) -> every path in `products.json` would 404 anyway.
- **22 MB of real photos** sit unused in `product/Products_XXXX_.../... .jpg`.
- Hero, Custom Orders, and About sections also show icon-only placeholders.

**Effect:** the live site is a red-and-cream brochure with literally no product photography.

### 3.2 Contact info is placeholder everywhere
- `wa.me/91YOUR_NUMBER_HERE` appears **7 times** (hero, CTA, modal, footer x2, contact card x2) - all WhatsApp buttons are dead links.
- `your-email@gmail.com` x2, GST "Available on request".
- Confusingly, `LAUNCH_SUMMARY.md` claims these were "replaced" with `+91 98765 43210` / `lokeshdugar040@gmail.com` - **the docs lie about the state of the code.**

### 3.3 Three incompatible product-data pipelines
| System | Content shape | Storage | Media path | Consumed by frontend? |
|---|---|---|---|---|
| Frontend (`script.js`) | `{id, title, category, description, image, b2bTag}` | `content/products.json` | `/assets/images/products/` | [OK] (the only live one) |
| Decap CMS (`admin/config.yml`) | `{name, description_short, description_full, moq, price, ...}` | `content/products/*.md` | `static/images/products/` [X] (dir doesn't exist) | [X] never read |
| TinaCMS (`tina.config.ts`) | `{title, category, description, image, b2b_tag}` | `_products/*.json` [X] (empty) | `assets/images/` | [X] never read |

**Effect:** editing products in *either* CMS changes nothing on the website. `products.json` must be hand-edited, so the entire CMS layer is decorative. Also `package.json` scripts run `tinacms dev/build`, but `netlify.toml` has an empty build command and `TINA_CLIENT_ID`/`TINA_TOKEN` are unset - Tina cannot build in CI.

### 3.4 Deployment platform contradiction
- `README.md`, `netlify.toml`, `robots.txt`, `sitemap.xml` -> Netlify.
- `QUICK_START.md`, `AUTO_DEPLOY.sh`, `OPEN_IN_BROWSER.html` -> GitHub Pages.

GitHub Pages breaks three things silently:
1. `fetch('/content/products.json')` is **absolute** - under `lokeshdugar040.github.io/jhalar-hanging-decor/` it 404s (site silently shows 6 generic fallback products).
2. **Netlify Forms stop working** - `data-netlify="true"` does nothing on GH Pages; enquiries vanish with no error.
3. **Decap CMS stops working** - `git-gateway` backend requires Netlify Identity.

---

## 4. Moderate Issues
| # | Issue | Detail |
|---|---|---|
| 4.1 | Catch-all redirect swallows 404s | `netlify.toml` rewrites `/* -> /index.html` (200), so `404.html` is unreachable on Netlify. It's only useful on GH Pages. For a one-page anchor site, this redirect isn't needed at all. |
| 4.2 | Invalid sitemap | Contains fragment URLs (`/#collection`) - fragments aren't crawlable; hardcodes placeholder domain `jhalar-hanging-decor.netlify.app`. |
| 4.3 | No SRI / CSP | Font Awesome & Google Fonts loaded from CDNs without `integrity` hashes; no Content-Security-Policy header. |
| 4.4 | Spam-exposed form | No honeypot field or reCAPTCHA on the enquiry form; `novalidate` + submit-disable is fine UX but nothing blocks bots. |
| 4.5 | Missing SEO/rich snippets | No Open Graph/Twitter cards, no canonical URL, no `Organization`/`Product` JSON-LD - poor for a B2B catalog shared on WhatsApp. |
| 4.6 | Modal a11y | No focus trap or initial focus when opened; background remains tabbable/screen-reader-visible. |
| 4.7 | Analytics not wired | `analytics-placeholder.html` exists but is never included in `index.html`. |

## 5. Repo Hygiene
- **22 MB of unreferenced photos** committed -> `.git` alone is 21 MB. Rename folders (spaces -> slugs), optimize (WebP), and actually wire them in, or move to external storage.
- **7 overlapping status docs** (`FIXES_APPLIED`, `LAUNCH_SUMMARY`, `SETUP_CHECKLIST`, `DEPLOYMENT_GUIDE`, `PRO_MODE_IMPROVEMENTS`, `QUICK_START`, `UPDATE_CONTACT_INFO`) written by a prior pass - several assert fixes that aren't true in code. Consolidate into `README.md` + one `DEPLOYMENT.md`.
- License contradiction: `package.json` says MIT, `README.md` says "All rights reserved".
- No lockfile; `tinacms ^2.0.0` never installed here.
- Leftover scaffolding: `OPEN_IN_BROWSER.html`, `AUTO_DEPLOY.sh`, `analytics-placeholder.html` are deployment-helper litter, not site assets.

---

## 6. Recommended Fix Order
1. **Wire real images (highest business impact):** copy/optimize photos from `product/` -> `assets/images/products/`, update `products.json` paths, and make `script.js` emit `<img src alt loading="lazy">` in cards + modal.
2. **Centralize contact config:** one `content/site-settings.json` (whatsapp/email/phone/location/gst) injected by JS - single place to edit, image-of-record for Tina's `siteSettings` collection.
3. **Pick ONE platform (Netlify) and ONE CMS (Decap):** delete `tina.config.ts`/`_products/`/`package.json` scripts *or* actually build the Tina->JSON pipeline; align Decap's fields/media folder with what `script.js` reads; delete the GH-Pages docs/scripts or switch entirely.
4. **Replace placeholders** with the real WhatsApp number/email everywhere (7 spots).
5. Fix `fetch('content/products.json')` -> relative path; remove the SPA catch-all redirect; regenerate `sitemap.xml` without fragments and with the final domain.
6. Add honeypot to the form; SRI hashes + a CSP; OG/Twitter meta + JSON-LD.
7. Purge stale docs down to README + DEPLOYMENT; resolve the license line; `.gitignore` any future helper clutter.

**Bottom line:** the *design and front-end code quality are good*, but the site is a dressed-up skeleton - images, contact details, and the CMS/content pipeline all need one focused session of wiring before this can go live.

---

## Fix Log - 2026-09-02 (post-audit)
All critical/moderate issues from this audit were addressed:

- **Real images wired in:** 16 products now render optimized photos from `assets/images/products/` (~3.4 MB, down from 22 MB of unreferenced originals in `product/`, now removed). Hero, Custom Orders and About sections use real photos; modal shows the product photo.
- **Contact info set:** WhatsApp/phone **+91 81006 56258** everywhere (8 links/buttons), email `lokeshdugar040@gmail.com`. Centralized in `content/site-settings.json` and applied by `script.js` (hardcoded fallbacks also updated in HTML).
- **CMS layer removed (hosting reality):** owner hosts on **GitHub Pages**, where Decap/Tina cannot authenticate without an OAuth gateway. Removed `tina.config.ts`, `_products/`, `admin/`, `netlify.toml` and the orphaned markdown folder. `content/products.json` + `content/site-settings.json` are the hand-edited (or future CMS) sources of truth; logo moved to `assets/logo-jhalar-02.svg`.
- **Platform contradiction resolved:** GitHub Pages is now the single documented target. Removed the old GH-Pages helper litter (`QUICK_START.md`, `AUTO_DEPLOY.sh`, `OPEN_IN_BROWSER.html`) and 6 other stale status docs; added `.nojekyll`.
- **Subpath-safe:** every URL is relative (works under `/jhalar-hanging-decor/`); `404.html` fixed to relative links; `fetch()` already relative.
- **Enquiry form works serverless:** GitHub Pages cannot receive form POSTs - submit now composes a detailed WhatsApp message (name, company, buyer type, phone, email, city, category, quantity, date, details) and opens `wa.me/918100656258` pre-filled.
- **netlify.toml:** removed; CSP + Permissions-Policy delivered via `<meta>` CSP instead (GH Pages ignores `netlify.toml`); no SPA redirect - 404.html works natively on GH Pages.
- **SEO:** canonical + OG/Twitter + JSON-LD now point at the live GitHub Pages URL, `og-cover.jpg` branded preview, cleaned sitemap/robots for the real domain.
- **Typography:** fluid type scale tokens (`--text-xs...--text-2xl`), consistent heading sizing, `text-wrap: balance`, better line-heights.
- Note: CSP via `<meta>` cannot cover `frame-ancestors` - GitHub Pages response headers are not configurable; assessed as low risk for a brochure site.
- **A11y:** `:focus-visible` states, `aria-label`/`aria-hidden` on decorative icons, fixed non-existent `fa-festival` icon -> `fa-fire`, modal focuses close button on open, product buttons are real `<button>` data-attributes (no inline `onclick`).
- **License contradiction resolved:** `UNLICENSED`/All rights reserved consistently.

## Fix Log - 2026-09-06 (catalogue-first homepage)

- Page flow is now Hero → Catalogue → Custom enquiries → About → FAQ → Contact.
  The "Why JHALAR" (No Middlemen) and "Who It's For" sections and the trust
  strip content were removed; the hero badge, hero highlight chips and the
  repeated "Made to order" card badge are gone.
- Hero copy: "Jhalars and hanging decor for weddings and events" with the
  browse/enquire intro and "View catalogue" / "Enquire on WhatsApp" actions.
- Howrah/karigar/factory framing no longer drives the copy. The location stays
  in the contact section, footer contact block and LocalBusiness structured
  data; manufacturing is mentioned briefly in About.
- Product modals show category, name, description, catalogue reference and the
  WhatsApp enquiry button only (generic assurance bullets removed).
- `heroHighlights` and `trustItems` are empty in `content/site-settings.json`;
  empty lists now genuinely hide those blocks (static HTML ships them hidden,
  and `script.js` shows them only when entries exist). A global
  `[hidden]{display:none !important}` guard keeps `display:flex` containers
  honouring the attribute.
- SEO: catalogue-first title, description, OG/Twitter tags and keywords.
- Synced everywhere: `site-settings.json`, `index.html`, `script.js` defaults,
  `editor.js` defaults, editor panels/placeholders, `sections.json`,
  `theme.json` (feature-card tokens removed with the sections), `style.css`
  and `package.json` description. `b2bTag` was removed from `products.json`
  (all 35 entries otherwise byte-identical).
- All 35 catalogue entries, approved names, descriptions, images and JH-###
  references are unchanged, including separate JH-027 / JH-035.
