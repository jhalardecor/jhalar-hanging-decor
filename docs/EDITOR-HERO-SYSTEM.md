# Editor hero system

How a hero setting travels from a control to the published site, and why the
old "Square" control never worked.

## 1. Diagnosis (why Square did nothing)

Traced control → event → state → config → preview → save → site → responsive
output. The chain was broken at the first link and would have been broken at
the last one too.

1. **There was no control, and no state.** A repo-wide search for `ratio`,
   `heroRatio`, `mobile ratio` and similar across `editor.html`, `editor.js`,
   `script.js`, `style.css`, `content/*.json` and even the unapplied
   `pending-live-updates.patch` returned nothing related to hero sizing. The
   editor's only hero controls were copy, buttons and the hero image. So the
   "Square" option was never wired to anything: no event handler, no state
   field, no key in `theme.json`, no CSS variable, no consumer.
2. **The stylesheet would have blocked it anyway.** Hero height was hard-coded
   in three places — `min-height:clamp(500px,52vw,720px)` on desktop,
   `min-height:clamp(560px,145vw,680px)` below 760px, and `min-height:540px`
   below 390px. `min-height` beats `aspect-ratio`: a square hero told to be at
   least 560px tall on a 390px screen renders 390 × 560, not 390 × 390. Any
   ratio injected on top of those rules would have appeared to do nothing,
   which is exactly the reported symptom.
3. **The only route to hero visuals was the wrong one.** The Inspector
   serialises inline styles into `state.customCSS` with `!important`
   (`editor.js`). Sending hero geometry down that path is what produces
   stacked "fix" blocks, so hero settings are now explicitly kept out of it —
   a test asserts that no `customCSS` write mentions the hero.
4. **The transport was fine.** The preview is a same-origin iframe and
   `pushToIframe()` already calls `window.JHALAR.setTheme(state.theme)`.
   Putting the hero inside `theme.json` therefore needed no new channel, and
   `content/theme.json` was already in `FILES_TO_PUBLISH`, so save and persist
   came for free.
5. **Device modes were already real.** Desktop/tablet/mobile resize the iframe
   to real widths, so real media queries run. Mobile was widened 375 → 390 to
   match a current handset.

## 2. The system

One module owns the hero: **`scripts/hero-config.js`**. It is loaded by
`index.html`, by `editor.html` and by the test suite, so all three agree.

```
control click
  └─ setHeroValue('mobile.ratio','square')     editor.js
       └─ state.theme.hero                     one object, the source of truth
            ├─ populateHeroForm()              controls re-read state
            ├─ pushToIframe() → JHALAR.setTheme(theme)
            │     └─ applyHero() → heroCssVars() → CSS custom properties
            └─ publishToGitHub() → content/theme.json
```

`normaliseHero()` accepts the nested shape, the older flat shape or nothing at
all, and always returns a complete valid object; every value is picked from a
closed list, so an unknown or hostile value falls back instead of reaching CSS.
`heroCssVars()` returns the full set of twelve tokens every time, so switching
an option can never leave a stale value behind.

### Settings

| Setting | Values | Token |
| --- | --- | --- |
| `desktop.height` | Compact 520px · Standard 640px · Tall 760px · Full screen 100svh | `--hero-desktop-height` |
| `mobile.ratio` | Square 1/1 · 4:5 · Portrait 3/4 · Tall 9/16 · Full screen | `--hero-mobile-ratio` + `--hero-mobile-min-height` |
| `image.desktopPosition` / `image.mobilePosition` | nine-point grid | `--hero-image-position(-mobile)` |
| `content.horizontal` / `content.vertical` | left/centre/right · top/middle/bottom | `--hero-content-x/-y`, `--hero-text-align`, `--hero-copy-inline`, `--hero-scrim-angle` |
| `overlay.enabled` / `overlay.strength` | on/off · 0.4–1 | `--hero-overlay-strength` |
| `typography.headingSize` | Small 0.82 · Medium 1 · Large 1.16 | `--hero-heading-scale` |

### The ratio/full-screen conflict, solved with two tokens

A ratio and a minimum height cannot both win, so the mode decides both:

* ratio modes → `--hero-mobile-ratio:<x / y>` **and** `--hero-mobile-min-height:0px`
* full screen → `--hero-mobile-ratio:auto` **and** `--hero-mobile-min-height:100svh`

`style.css` then carries exactly one hero sizing rule per breakpoint:

```css
.hero-banner{min-height:var(--hero-desktop-height)}          /* desktop */
@media (max-width:760px){
  .hero-banner{aspect-ratio:var(--hero-mobile-ratio);
               min-height:var(--hero-mobile-min-height);height:auto}
}
```

No `!important`, no duplicate overrides, no per-fix blocks. Tests fail the
build if a hard-coded hero `min-height`, a second `aspect-ratio` rule or a
hero `!important` reappears.

Two deliberate exceptions on phones: the copy stays bottom-anchored (the scrim
settles downwards, so the vertical-position setting is desktop-only), and the
mobile image focus uses its own token so a portrait crop can differ from the
desktop one.

## 3. Checking it

* `npm test` — `tests/hero-config.test.js` asserts the ratio maths (Square →
  height = width, 4:5 → ×1.25, Portrait → ×1.333, Tall → 9:16), repeated
  switching, fallbacks, clamping, and the stylesheet invariants above.
* In the editor — **Hero → Test the mobile shapes** switches the preview to
  390px, applies every shape in turn and measures the real hero element in the
  preview document, reporting rendered versus expected height. The readout
  under the hero controls shows the same measurement live while editing.

## 4. Editing UX

The left rail lists page sections (Hero, Trust bar, Collection, Custom work,
Our story, FAQ, Contact) then theme areas and catalogue tools. Selecting a
section filters the settings panel to that section's controls and scrolls the
preview to it; a dot marks sections with unsaved edits. Undo/redo take one
snapshot when editing settles (400 ms, duplicates dropped), so a slider drag is
a single step, and the buttons disable at the ends of the stack. The save
indicator reads "Unsaved" from the first real change and only returns to
"Saved" after a successful publish.
