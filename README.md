# JHALAR Hanging Decor — Catalogue Website

A product-first catalogue for handcrafted jhalars and hanging decor. Plain HTML + CSS + vanilla JS; no framework or build step.

Live site: https://lokeshdugar040.github.io/jhalar-hanging-decor/

## Editing model

### Add or update a product
Edit **`content/products.json`**. Each product should contain:

```json
{
  "id": 36,
  "title": "Approved display name",
  "category": "Floral Jhalars",
  "description": "40 to 80 words. Describe visible arrangement, colour, finish and use; no unverified materials, sizes or origin.",
  "sourceImage": "assets/images/products/your-original.jpg",
  "image": "assets/images/products/catalogue/your-display.webp",
  "imageAlt": "Optional. Approved name first, then what the photo shows. Falls back to the title.",
  "naming": {
    "registryVersion": "CURRENT_REGISTRY_VERSION",
    "reviewMethod": "human",
    "seriesId": "approved-series-id",
    "colourId": "approved-colour-id",
    "confidence": { "series": null, "colour": null },
    "evidence": {
      "series": "Why the design belongs to the approved series.",
      "colour": "Why the palette belongs to the approved colour."
    },
    "requiresReview": false
  }
}
```

Use **`content/product-template.json`** as the starting point. The numeric `id` is an internal data key; it is **not a customer-facing catalogue reference** and must not be displayed on the website.

### Approval / naming
`content/product-naming.json` remains the controlled identity database. It is an internal publication gate for series, colours, pairings and image bindings. Do not invent IDs, pairings or approval records. Run the naming checks before publishing a new product.

### Site copy
Edit **`content/site-settings.json`** for hero copy, navigation, contact details, FAQ, section copy and footer copy. Keep this file as the human-editable content source rather than changing duplicated strings in HTML or JS.

### Visual system
Edit **`content/theme.json`** for the high-level design tokens: colours, typography family, section spacing, container width, card radius, grid gaps and responsive layout defaults. `style.css` is the implementation layer.

The current website uses a single self-hosted **DM Sans** family for a clean geometric system. Avoid mixing in decorative display fonts without a deliberate brand redesign.

## Product UX rules

The public journey is:

**Discover → Browse → Open a design → Enquire**

WhatsApp is intentionally concentrated at the product/contact decision points rather than repeated throughout the header and hero.

Public product cards show:

- image
- category
- product name
- concise description
- View details

They do **not** show internal numeric IDs or `JH-###` catalogue references.

The product modal uses the selected product title, category, description and a single **Enquire about this design** action. The generated WhatsApp message identifies the product by its human-readable name.

## Validation and release

Run:

```bash
npm test
npm run validate
npm run naming:review
node scripts/product-naming.js --strict --json
```

Then check the page in the browser across narrow mobile, tablet, normal desktop and large desktop widths.

## Repository structure

```text
index.html
style.css
script.js
editor.html
editor.js
content/
  products.json
  product-template.json
  product-naming.json
  site-settings.json
  theme.json
  sections.json
  custom-css.json
assets/
  images/
  fonts/
scripts/
tests/
docs/
```

The editor is intended for publishing the JSON content files. For safest future maintenance, treat the JSON content files as the source of truth and avoid duplicating the same copy in runtime code.

## Future-proof editing checklist

For a new product: add the image assets, copy the product template, assign a new internal `id`, select an approved series/colour pairing, add evidence, update the naming registry binding, run validation, then publish.

For a visual refresh: change tokens in `content/theme.json` first; use `style.css` only for structural/layout implementation; do not stack large one-off override blocks at the end of the file.

For copy changes: update `content/site-settings.json` first and let the runtime render it.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(c) JHALAR Hanging Decor — All rights reserved.
