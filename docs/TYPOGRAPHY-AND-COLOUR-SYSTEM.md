# JHALAR — Typography & Colour System

The single source of truth is `style.css`. This document explains the system so
it stays intact; it does not duplicate values that live in code.

Related runtime contracts: `script.js` (`setTheme`, validation) and the Pro
Editor Theme tab (`editor.html` / `editor.js`, constants `BRAND_FONT_STACK`
and `PALETTE`).

---

## 1. Font authority

One family, self-hosted, declared once:

```css
--font-heading: Mogranx, 'Helvetica Neue', Arial, sans-serif;
--font-body:    Mogranx, 'Helvetica Neue', Arial, sans-serif;
```

- `font-family` appears exactly twice outside `@font-face`: on `body` and on
  `h1–h6`. No component, page or runtime script may set a family.
- Only the Mogranx files that exist on disk are declared: **400 / 500 / 700**,
  each in roman and true italic (`Mogranx-Slanted`, `-MediumSlanted`,
  `-BoldSlanted`).
- `font-synthesis: none` is set on `html`. The browser can never fake a bold or
  an oblique; the hero's `<em>` renders the real Mogranx Slanted file.
- Weight 600 is not used anywhere — there is no 600 file.

## 2. Type scale

Ten roles, fluid from 320px to ~1440px, then capped. Nothing outside this list
may invent a size.

| Role      | Token              | 320px | 768px | 1440px+ | Used by |
|-----------|--------------------|-------|-------|---------|---------|
| Display   | `--text-display`   | 44    | 60    | 84      | hero `h1`, 404 `h1` |
| H1        | `--text-h1`        | 40    | 50    | 68      | document pages |
| H2        | `--text-h2`        | 34    | 43    | 56      | section headings |
| H3        | `--text-h3`        | 24    | 28    | 34      | modal title, doc `h2` |
| H4        | `--text-h4`        | 20    | 22    | 24      | sub-headings |
| Body L    | `--text-body-lg`   | 17    | 18    | 19      | hero lede, product title |
| Body      | `--text-body`      | 16    | 16    | 16      | paragraphs, CTAs |
| Body S    | `--text-body-sm`   | 15    | 15    | 15      | nav, filters, footer |
| Caption   | `--text-caption`   | 13    | 13    | 13      | overlays, hints, mobile meta |
| Eyebrow   | `--text-eyebrow`   | 12    | 12    | 12      | uppercase labels |

Hierarchy comes from **scale, space and composition**, not weight: `h1`/`h2`
are Regular 400, `h3`–`h6` Medium 500, Bold 700 is reserved for `<strong>`.

### Leading

| Token | Value | Where |
|---|---|---|
| `--leading-display` | 1.05 | hero display |
| `--leading-heading` | 1.14 | h1–h3 |
| `--leading-title`   | 1.28 | h4–h6, product titles |
| `--leading-lede`    | 1.5  | body large |
| `--leading-body`    | 1.6  | reading text |
| `--leading-ui`      | 1.35 | nav, buttons, captions |
| `--leading-label`   | 1.2  | eyebrows |

### Tracking

`--tracking-normal: 0` for **all** reading text and headings. Brand type is
never compressed — negative letter-spacing is not available anywhere in the
system, including the CMS. Positive tracking exists only for uppercase labels:
`--tracking-label: .08em`, `--tracking-eyebrow: .1em`.

### Measure

`--measure-display: 9ch`, `--measure-lede: 46ch`, `--measure-prose: 54ch`,
`--measure-support: 43ch`. Headings use `text-wrap: balance` and paragraphs
`text-wrap: pretty` to control orphans and ragged breaks.

## 3. Colour

### Palette (raw values, declared once)

| Token | Hex | Meaning |
|---|---|---|
| `--brand-canvas`   | `#FFFAF1` | main canvas |
| `--brand-surface`  | `#FFFDF8` | light surface |
| `--brand-red`      | `#C82039` | primary brand red |
| `--brand-red-deep` | `#A71931` | deep red |
| `--brand-navy`     | `#141942` | dark navy |
| `--brand-heritage` | `#622331` | heritage / premium text |

Everything else — borders, muted text, scrims, shadows, the sunken media
surface — is **derived** from these six via `rgba(var(--*-rgb), …)` or
`color-mix()`. No seventh colour exists.

### Semantic roles

| Token | Resolves to | Applies to |
|---|---|---|
| `--color-canvas` | canvas | page, header, audience strip, story |
| `--color-surface` | surface | cards, custom section, modal |
| `--color-surface-sunken` | heritage 7% on surface | image wells |
| `--color-ink` | navy | body copy, product titles, nav, structural UI |
| `--color-ink-muted` | navy 80% on canvas | support and secondary copy |
| `--color-heading` | heritage | h1–h6, editorial headings |
| `--color-label` | heritage | eyebrows, product category |
| `--color-primary` | red | hero kicker, primary CTA fill, active thumb |
| `--color-primary-strong` | deep red | hover, active filter, focus ring |
| `--color-inverse-surface` | navy | contact + footer |
| `--color-ink-inverse` / `-muted` / `--color-label-inverse` | canvas tints | text on navy |
| `--color-border` / `-soft` / `-inverse` | navy or canvas alpha | rules and outlines |

Dark sections do not override component colours; `.contact, .footer` re-point
the semantic tokens once, and every component inside keeps working unchanged.

### Red discipline

Red is an accent and an action signal, never a text default. It appears in
exactly four places: the hero kicker, the active filter chip, the primary
WhatsApp CTA, and interaction states (hover, focus, active thumbnail).
It is never used for headings, body copy or large areas.

### Contrast (WCAG 2.1 AA, all pass)

Heritage headings on canvas 11.2:1 · navy body on canvas 16.2:1 · muted ink
8.8:1 · hero kicker red 5.4:1 · canvas on deep-red chip 7.2:1 · canvas on red
CTA 5.4:1 · contact body on navy 10.2:1 · footer text 10.2:1. A
`prefers-contrast: more` block hardens muted tones further.

## 4. What the CMS may change

`content/theme.json` can move six typographic values and six colour roles, and
`script.js` validates every one of them:

- colours must be valid hex and land on a semantic role;
- weights must be 400, 500 or 700 (a real font file);
- letter-spacing must be `0` or positive, max `0.12em`;
- line-height must be between 1 and 2.

Font families and the size scale are **not** runtime-adjustable. Anything
invalid is ignored and the stylesheet default stands.

## 5. Rules for future changes

1. Add a role before adding a value. No stray `font-size`, `clamp()` or hex.
2. Never append a "final fix" or "override" block; edit the rule that owns it.
3. `!important` is only permitted in the reduced-motion block.
4. Mobile gets intentional composition (measure, spacing, role swaps), never a
   second parallel type scale.
