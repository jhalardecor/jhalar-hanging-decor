# JHALAR Hanging Decor - Catalogue and Enquiry Website

Catalogue website for JHALAR Hanging Decor, a maker of handcrafted decorative hangings (pom pom garlands, floral jhalars, bell hangings, torans, tassel hangings, decorative strings and custom designs) based in Howrah, West Bengal, India. Visitors browse designs, open a product for details and enquire on WhatsApp using its catalogue reference.

**Stack:** plain HTML + CSS + vanilla JS. No framework, no build step.
**Hosting:** **GitHub Pages** -> https://lokeshdugar040.github.io/jhalar-hanging-decor/

## Deploy on GitHub Pages

1. Repo **Settings -> Pages**.
2. Source: **Deploy from a branch** -> branch `main`, folder `/ (root)` -> **Save**.
3. Wait 1-2 minutes; the site goes live at the URL above.

All paths in the code are relative, so the site works correctly under the `/jhalar-hanging-decor/` subpath (and under a custom domain later).

## How the enquiry form works

GitHub Pages is static (no server to receive form POSTs), so the form **composes a WhatsApp message** with every field pre-filled and opens it - the visitor just presses send. The enquiry lands at **+91 81006 56258**.

## Contact (single source of truth)

All contact details live in **`content/site-settings.json`** and are applied across the page by `script.js`:

| Field | Value |
|---|---|
| WhatsApp | `918100656258` (wa.me links) |
| Phone | `+91 81006 56258` |
| Email | `lokeshdugar040@gmail.com` |
| Location | Howrah, West Bengal, India |

> The same values are also hardcoded in `index.html` as fallback, so links work even before JS runs.

## Project structure

```
|-- index.html            # The whole site (single page)
|-- style.css             # Design system + all styles
|-- script.js             # Product grid, filters, modal, WhatsApp form, settings
|-- content/
|  |-- products.json       # Product catalogue (rendered on the site)
|  |-- product-naming.json # Approved names, pairings and reviewed image bindings
|  |-- site-settings.json  # Contact info and current site copy
|  `-- theme.json          # Active visual tokens and fonts
|-- AGENTS.md              # Required guidance for future agents
|-- docs/                  # JHALAR master agent knowledge base
|-- scripts/               # Site validation and deterministic naming gate
|-- tests/                 # Naming gate regression tests
|-- assets/
|  |-- logo-jhalar-02.svg # Brand logo
|  `-- images/            # Optimized imagery (hero, collage, og-cover)
|     `-- products/       # Product photos used by products.json
|-- privacy.html / 404.html / sitemap.xml / robots.txt / favicon.svg
|-- .nojekyll             # Prevents Jekyll processing on GitHub Pages
`-- AUDIT.md              # Repo audit + fix log
```

## Catalogue and approved product names

The current release contains **35 catalogue entries across 18 series**, using all
35 original product images. The owner asked to keep **JH-027 and JH-035** separate:
both are named **Shobha Series — Red Yellow & White**, but their references and
source photos differ. This is 34 series/colour pairings, not 35 unique names.

Read [AGENTS.md](AGENTS.md), the
[master knowledge base](docs/JHALAR-AGENT-KNOWLEDGE-BASE.md), and the
[owner publication record](docs/CATALOGUE-PUBLICATION.md) before changing identities.

- **Canonical format:** `[Series Name] Series — [Colour Name]`. Preserve exact
  registry spelling and case, and use a spaced em dash.
- **Approved registry:** `content/product-naming.json`. It includes names, pairings
  and owner-reviewed product/image bindings. New filenames and draft suggestions
  are not automatically approved.
- **Human-reviewed records:** `naming.reviewMethod` is `human`, with confidence
  left null. The controlled registry must bind that exact product ID, series,
  colour, original image and display image. Candidate-supplied approval flags do
  not count. See the publication record for this release's actual owner request.
- **Automatic assessments:** require a permitted pairing, current revision,
  evidence, review clearance and independent confidence scores of at least 85%.
- **Images:** `sourceImage` preserves the original JPEG; `image` uses a WebP copy
  under `assets/images/products/catalogue/`. Both must be in the image manifest.
- **References:** stable IDs generate visible `JH-###` catalogue references, also
  included in WhatsApp enquiries. Do not recycle or regenerate existing IDs.
- **Descriptions:** limited to visible features; materials, measurements, weight,
  stock and pack quantities need owner-backed specifications.

Categories remain product-type metadata, not series. Allowed categories are
`Pom Pom Hangings`, `Bead Hangings`, `Bell Hangings`, `Floral Jhalars`, `Torans`,
`Tassel Hangings`, `Decorative Strings`, and `Custom Designs`. Empty category
filters are hidden. The first six products appear initially; “View all” reveals
all entries, while category views show every match.

The homepage is catalogue-first: Hero → Catalogue → Custom enquiries → About →
FAQ → Contact. Manufacturing is mentioned briefly in About; the location
(Howrah, West Bengal) appears in contact details and structured data, not in
page headlines. Optional highlight lists (hero highlights, trust strip) are
empty by default and genuinely hidden — they only appear if entries are added
in `content/site-settings.json` or the editor. Product cards and modals show
name, category, description and catalogue reference only; there are no badges,
prices, stock levels or ecommerce features.

```bash
npm test                 # Dependency-free regression and catalogue integrity tests
npm run validate         # Site guards plus registry/canonical-title checks
npm run naming:review    # Strict approval gate; every published product must pass
node scripts/product-naming.js --strict --json
```

The public loader and editor share the same naming gate. The site does not show
obsolete fallback names/images if loading or validation fails. The editor refreshes
the registry before publication and blocks unapproved titles or image mappings.
Old local editor drafts can be inspected but must not overwrite the reviewed
catalogue; clear outdated drafts before editing the new catalogue.

Run all three checks and verify the browser before publication. No new CI workflow
is implied by these commands. A local preview or unmerged PR is not a completed
live deployment: confirm the GitHub Pages build and deployed catalogue afterwards.

> Note: the Decap/Netlify CMS was removed - it requires Netlify authentication and doesn't work on GitHub Pages. If you ever migrate to Netlify, a CMS can be re-added.

## Brand

- Primary red `#C82039`, accent gold `#C9A84C`
- Active fonts: DM Sans (headings and body), configured in `content/theme.json`
- Playfair Display and Mogranx are available assets, not the active theme
- Logo: `assets/logo-jhalar-02.svg`

## Local preview

```bash
python3 -m http.server 8000   # or: npm run dev
# open http://localhost:8000
```

## License

(c) JHALAR Hanging Decor - All rights reserved.
