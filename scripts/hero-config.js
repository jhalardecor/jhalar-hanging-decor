#!/usr/bin/env node
(function () {
'use strict';

// JHALAR hero configuration — the single source of truth for hero geometry.
//
//   editor control -> state.theme.hero -> normaliseHero() -> heroCssVars()
//   -> CSS custom properties on :root -> style.css hero rules -> rendered hero
//
// The same module runs in the editor, in the public site runtime and in the
// Node test suite, so the editor preview, the published site and the tests can
// never disagree about what "Square" means.
//
// Rules
//  - Every value is chosen from a closed option list. Unknown input falls back
//    to the default; nothing is passed through to CSS unvalidated.
//  - A ratio mode always ships min-height:0 so nothing can fight aspect-ratio.
//  - Full screen is the only mode that uses a min-height, and it clears the
//    aspect-ratio in the same pass.

const DESKTOP_HEIGHT = Object.freeze({
  compact:    { label: 'Compact',     css: '520px' },
  standard:   { label: 'Standard',    css: '640px' },
  tall:       { label: 'Tall',        css: '760px' },
  fullscreen: { label: 'Full screen', css: '100svh' }
});

// ratio === null means "no aspect-ratio, use minHeight instead".
const MOBILE_RATIO = Object.freeze({
  square:     { label: 'Square',      ratio: '1 / 1',  value: 1,      minHeight: '0px' },
  '4:5':      { label: '4:5',         ratio: '4 / 5',  value: 4 / 5,  minHeight: '0px' },
  portrait:   { label: 'Portrait',    ratio: '3 / 4',  value: 3 / 4,  minHeight: '0px' },
  tall:       { label: 'Tall',        ratio: '9 / 16', value: 9 / 16, minHeight: '0px' },
  fullscreen: { label: 'Full screen', ratio: null,     value: null,   minHeight: '100svh' }
});

const IMAGE_POSITION = Object.freeze({
  'left top':      '0% 0%',   'center top':    '50% 0%',   'right top':    '100% 0%',
  'left center':   '0% 50%',  'center center': '50% 50%',  'right center': '100% 50%',
  'left bottom':   '0% 100%', 'center bottom': '50% 100%', 'right bottom': '100% 100%'
});

// Horizontal placement also decides which way the readability scrim runs, so
// the copy always sits on the opaque end of the gradient.
const CONTENT_H = Object.freeze({
  left:   { justify: 'flex-start', align: 'left',   inline: '0',    scrim: '90deg' },
  center: { justify: 'center',     align: 'center', inline: 'auto', scrim: '0deg'  },
  right:  { justify: 'flex-end',   align: 'right',  inline: '0',    scrim: '270deg' }
});
const CONTENT_V = Object.freeze({
  top:    'flex-start',
  center: 'center',
  bottom: 'flex-end'
});

const HEADING_SIZE = Object.freeze({
  small:  { label: 'Small',  scale: '0.82' },
  medium: { label: 'Medium', scale: '1' },
  large:  { label: 'Large',  scale: '1.16' }
});

// Below 0.4 the hero copy stops clearing WCAG AA over bright photography.
const OVERLAY_MIN = 0.4;
const OVERLAY_MAX = 1;

const DEFAULT_HERO = Object.freeze({
  desktop:    { height: 'standard' },
  mobile:     { ratio: 'portrait' },
  image:      { desktopPosition: 'center center', mobilePosition: 'center center' },
  content:    { horizontal: 'left', vertical: 'center' },
  overlay:    { enabled: true, strength: 1 },
  typography: { headingSize: 'medium' }
});

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const pick = (value, table, fallback) =>
  (typeof value === 'string' && Object.prototype.hasOwnProperty.call(table, value)) ? value : fallback;

function clampOverlay(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(OVERLAY_MAX, Math.max(OVERLAY_MIN, Math.round(n * 100) / 100));
}

// Accepts the canonical nested shape, the flat shape (hero.mobileRatio, …) and
// a missing/garbage config. Always returns a complete, valid hero object.
function normaliseHero(input) {
  const raw = isObject(input) ? input : {};
  const desktop = isObject(raw.desktop) ? raw.desktop : {};
  const mobile = isObject(raw.mobile) ? raw.mobile : {};
  const image = isObject(raw.image) ? raw.image : {};
  const content = isObject(raw.content) ? raw.content : {};
  const overlay = isObject(raw.overlay) ? raw.overlay : {};
  const typography = isObject(raw.typography) ? raw.typography : {};

  const overlayEnabled = overlay.enabled === undefined ? DEFAULT_HERO.overlay.enabled : overlay.enabled !== false;
  const strengthSource = overlay.strength !== undefined ? overlay.strength : raw.overlayStrength;

  return {
    desktop: {
      height: pick(desktop.height !== undefined ? desktop.height : raw.desktopHeight,
        DESKTOP_HEIGHT, DEFAULT_HERO.desktop.height)
    },
    mobile: {
      ratio: pick(mobile.ratio !== undefined ? mobile.ratio : raw.mobileRatio,
        MOBILE_RATIO, DEFAULT_HERO.mobile.ratio)
    },
    image: {
      desktopPosition: pick(image.desktopPosition !== undefined ? image.desktopPosition : raw.desktopImagePosition,
        IMAGE_POSITION, DEFAULT_HERO.image.desktopPosition),
      mobilePosition: pick(image.mobilePosition !== undefined ? image.mobilePosition : raw.mobileImagePosition,
        IMAGE_POSITION, DEFAULT_HERO.image.mobilePosition)
    },
    content: {
      horizontal: pick(content.horizontal !== undefined ? content.horizontal : raw.textPosition,
        CONTENT_H, DEFAULT_HERO.content.horizontal),
      vertical: pick(content.vertical !== undefined ? content.vertical : raw.textVertical,
        CONTENT_V, DEFAULT_HERO.content.vertical)
    },
    overlay: {
      enabled: overlayEnabled,
      strength: clampOverlay(strengthSource, DEFAULT_HERO.overlay.strength)
    },
    typography: {
      headingSize: pick(typography.headingSize !== undefined ? typography.headingSize : raw.headingSize,
        HEADING_SIZE, DEFAULT_HERO.typography.headingSize)
    }
  };
}

// The complete set of custom properties the hero reads. Every key is always
// present, so switching options can never leave a stale value behind.
function heroCssVars(input) {
  const hero = normaliseHero(input);
  const mobile = MOBILE_RATIO[hero.mobile.ratio];
  const horizontal = CONTENT_H[hero.content.horizontal];
  return {
    '--hero-desktop-height': DESKTOP_HEIGHT[hero.desktop.height].css,
    '--hero-mobile-ratio': mobile.ratio || 'auto',
    '--hero-mobile-min-height': mobile.minHeight,
    '--hero-image-position': IMAGE_POSITION[hero.image.desktopPosition],
    '--hero-image-position-mobile': IMAGE_POSITION[hero.image.mobilePosition],
    '--hero-content-x': horizontal.justify,
    '--hero-content-y': CONTENT_V[hero.content.vertical],
    '--hero-text-align': horizontal.align,
    '--hero-copy-inline': horizontal.inline,
    '--hero-scrim-angle': horizontal.scrim,
    '--hero-overlay-strength': String(hero.overlay.enabled ? hero.overlay.strength : 0),
    '--hero-heading-scale': HEADING_SIZE[hero.typography.headingSize].scale
  };
}

// Geometry contract used by the acceptance tests: what the hero must measure
// inside a preview frame of the given width.
function heroMobileHeight(input, frameWidth) {
  const hero = normaliseHero(input);
  const mode = MOBILE_RATIO[hero.mobile.ratio];
  if (!mode.value) return null;               // full screen follows the viewport
  return frameWidth / mode.value;
}

const api = Object.freeze({
  DESKTOP_HEIGHT, MOBILE_RATIO, IMAGE_POSITION, CONTENT_H, CONTENT_V, HEADING_SIZE,
  OVERLAY_MIN, OVERLAY_MAX, DEFAULT_HERO,
  normaliseHero, heroCssVars, heroMobileHeight
});

if (typeof module !== 'undefined' && module.exports) module.exports = api;
else globalThis.JHALARHero = api;
})();

/* build: 20260907.30 */
