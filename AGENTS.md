# JHALAR agent instructions

## Catalogue identity

- Read [the master knowledge base](docs/JHALAR-AGENT-KNOWLEDGE-BASE.md) and
  [the owner publication record](docs/CATALOGUE-PUBLICATION.md).
- `content/product-naming.json` is the approved registry. It contains exact series
  and colour names, permitted pairings and owner-reviewed product/image bindings.
  New filenames, examples and unaccepted draft proposals are **not** approvals.
- Classify the design family first, then its colour. Categories are product-type
  metadata, not series. Never infer a family from colour alone.
- Independent names are `<series.name> — <colour.name>`. `series.name` already
  ends in ` Series`. Preserve exact spelling, case and the spaced em dash.
- Automatic assessments need the current registry version, an approved pairing,
  evidence, explicit review clearance and independent confidence scores at or
  above the registry threshold (85%). Missing confidence is unknown.
- Human review uses `reviewMethod: "human"` and an exact `approvedProducts` binding
  in the registry: product ID, series, colour, original image and display image.
  Confidence stays null. A candidate cannot approve itself or bypass the registry
  by claiming `approved: true`. Only record human approval when genuinely given.
- Unmatched, ambiguous, stale or unapproved assessments return no final name and
  require review. Never lower the threshold or invent confidence to make one pass.
- The owner authorised publication of the reviewed proposals on 7 September 2026
  and explicitly chose to keep Products_0027 separate from the labelled Shobha
  red/yellow/white image. Keep JH-027 and JH-035 separate, with visible references;
  do not invent a difference in dimensions or construction.
- Do not silently normalise existing labels such as `dark pink` or
  `green red & White`. Changes to official names need owner approval.
- Only an explicit request for proposal mode permits suggesting new draft names.
  Draft suggestions must not be treated as approved catalogue entries.

## Repository workflow

- Static HTML/CSS/vanilla JS; no build step. Keep browser asset/fetch paths relative
  for GitHub Pages subpath hosting and the preview environment.
- Copy/contact: `content/site-settings.json`. Visual rules: `content/theme.json`
  and `style.css`. Catalogue: `content/products.json`.
- New or rewritten copy must pass [the AI writing-pattern blacklist](docs/AI-WRITING-BLACKLIST.md):
  no banned words, patterns, structures or punctuation habits. Approved product
  descriptions and official names are records, not copy — never silently rewrite them.
- Products retain original uploads in `sourceImage` and use WebP display copies
  in `image`. `imageAlt` is optional descriptive alt text (approved name first);
  the site and editor fall back to the title when it is empty. Update the image manifest and approval binding when reviewing a new
  product image; preserve originals unless explicitly asked otherwise.
- Keep static HTML and editor/JS fallbacks in sync with current copy. Never restore
  obsolete sample products if loading fails; show the catalogue error instead.
- The site and editor share `scripts/product-naming.js`. The public loader rejects
  unresolved catalogue records; the editor refreshes the registry and blocks
  publication of unapproved names or image mappings. This is not an AI photo model
  or an authentication system, and it cannot verify the truth of supplied evidence.
- Run `npm test`, `npm run validate` and `npm run naming:review` before publishing.
  Strict review must pass for every public entry. Verify references in the grid,
  modal and WhatsApp enquiry, especially same-name entries.
- A preview or local commit is not a live deployment. Verify GitHub Pages after
  the release, and report deployment blockers rather than claiming publication.


## Visual repair loop

For every responsive UI change:

1. Run `npm run visual:audit`.
2. Read `test-results/layout-report.json`.
3. Inspect the matching `test-results/layout-*.png` screenshots.
4. Fix one root cause at a time.
5. Re-run the audit.
6. Do not stop while the report contains geometry failures.

The CI artifact named `visual-layout-report` is the handoff package for other agents: it contains the JSON report, screenshots, Playwright report and server log.

Priority order: horizontal overflow → section overlap → modal viewport escape → collapsed/clipped content → breakpoint failures → screenshot balance.

Avoid compensating hacks such as arbitrary negative margins, unnecessary absolute positioning or cascade fights.
