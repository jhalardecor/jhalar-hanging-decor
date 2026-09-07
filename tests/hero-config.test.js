#!/usr/bin/env node
'use strict';
// Acceptance tests for the hero pipeline.
//
// These assert the contract the editor, the stylesheet and the published theme
// all depend on: a selected mobile ratio must produce an exact hero geometry,
// and nothing in the stylesheet may be able to override it.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('../scripts/hero-config.js');

const root = path.join(__dirname, '..');
// comments are stripped so prose about min-height cannot satisfy a check
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/* ---- 1. the mandated ratio maths ---------------------------------------- */
// Preview width 390px = the mobile device frame in the editor.
const W = 390;
const heightFor = ratio => H.heroMobileHeight({ mobile: { ratio } }, W);

test('Square renders a hero as tall as it is wide', () => {
  assert.strictEqual(heightFor('square'), W);
});
test('4:5 renders height = width x 1.25', () => {
  assert.ok(Math.abs(heightFor('4:5') - W * 1.25) < 0.001, heightFor('4:5') + ' != ' + W * 1.25);
});
test('Portrait renders height = width x 1.3333', () => {
  assert.ok(Math.abs(heightFor('portrait') - W * (4 / 3)) < 0.001);
});
test('Tall renders a 9:16 hero', () => {
  assert.ok(Math.abs(heightFor('tall') - W * (16 / 9)) < 0.001);
});
test('Full screen follows the viewport instead of a ratio', () => {
  assert.strictEqual(heightFor('fullscreen'), null);
  assert.strictEqual(H.heroCssVars({ mobile: { ratio: 'fullscreen' } })['--hero-mobile-min-height'], '100svh');
  assert.strictEqual(H.heroCssVars({ mobile: { ratio: 'fullscreen' } })['--hero-mobile-ratio'], 'auto');
});

/* ---- 2. the CSS variables the ratios emit -------------------------------- */
const RATIO_CSS = { square: '1 / 1', '4:5': '4 / 5', portrait: '3 / 4', tall: '9 / 16' };
Object.keys(RATIO_CSS).forEach(key => {
  test('"' + key + '" emits aspect-ratio ' + RATIO_CSS[key] + ' with min-height 0px', () => {
    const vars = H.heroCssVars({ mobile: { ratio: key } });
    assert.strictEqual(vars['--hero-mobile-ratio'], RATIO_CSS[key]);
    // The historic bug: a min-height that outranks the ratio.
    assert.strictEqual(vars['--hero-mobile-min-height'], '0px');
  });
});

test('switching ratios repeatedly always produces the current value', () => {
  const order = ['square', 'tall', 'square', '4:5', 'fullscreen', 'square', 'portrait'];
  order.forEach(key => {
    const vars = H.heroCssVars({ mobile: { ratio: key } });
    const expected = key === 'fullscreen' ? 'auto' : RATIO_CSS[key];
    assert.strictEqual(vars['--hero-mobile-ratio'], expected, 'stale value after selecting ' + key);
  });
});

test('desktop heights map to the published scale', () => {
  const h = k => H.heroCssVars({ desktop: { height: k } })['--hero-desktop-height'];
  assert.strictEqual(h('compact'), '520px');
  assert.strictEqual(h('standard'), '640px');
  assert.strictEqual(h('tall'), '760px');
  assert.strictEqual(h('fullscreen'), '100svh');
});

/* ---- 3. normalising whatever a saved theme.json contains ----------------- */
test('a missing hero block falls back to the published default', () => {
  assert.deepStrictEqual(H.normaliseHero(undefined), H.DEFAULT_HERO);
  assert.deepStrictEqual(H.normaliseHero(null), H.DEFAULT_HERO);
  assert.deepStrictEqual(H.normaliseHero('square'), H.DEFAULT_HERO);
});
test('unknown option values fall back instead of reaching CSS', () => {
  const hero = H.normaliseHero({
    desktop: { height: 'enormous' },
    mobile: { ratio: '16 / 9; }' },
    image: { desktopPosition: 'url(evil)' },
    typography: { headingSize: '900px' }
  });
  assert.strictEqual(hero.desktop.height, 'standard');
  assert.strictEqual(hero.mobile.ratio, 'portrait');
  assert.strictEqual(hero.image.desktopPosition, 'center center');
  assert.strictEqual(hero.typography.headingSize, 'medium');
});
test('the flat shape is accepted as well as the nested one', () => {
  const hero = H.normaliseHero({ mobileRatio: 'square', desktopHeight: 'tall', textPosition: 'right' });
  assert.strictEqual(hero.mobile.ratio, 'square');
  assert.strictEqual(hero.desktop.height, 'tall');
  assert.strictEqual(hero.content.horizontal, 'right');
});
test('normalising is stable, so save -> reload -> save cannot drift', () => {
  const once = H.normaliseHero({ mobile: { ratio: 'square' }, overlay: { strength: 0.62 } });
  assert.deepStrictEqual(H.normaliseHero(once), once);
});
test('overlay strength is clamped to a legible range', () => {
  const s = v => H.normaliseHero({ overlay: { strength: v } }).overlay.strength;
  assert.strictEqual(s(0), H.OVERLAY_MIN);
  assert.strictEqual(s(5), H.OVERLAY_MAX);
  assert.strictEqual(s(0.65), 0.65);
  assert.strictEqual(s('nonsense'), 1);
  assert.strictEqual(H.heroCssVars({ overlay: { enabled: false } })['--hero-overlay-strength'], '0');
});
test('text position also steers the scrim so copy stays on canvas', () => {
  assert.strictEqual(H.heroCssVars({ content: { horizontal: 'right' } })['--hero-scrim-angle'], '270deg');
  assert.strictEqual(H.heroCssVars({ content: { horizontal: 'left' } })['--hero-scrim-angle'], '90deg');
  assert.strictEqual(H.heroCssVars({ content: { vertical: 'bottom' } })['--hero-content-y'], 'flex-end');
});
test('every option list produces a complete set of variables', () => {
  const keys = Object.keys(H.heroCssVars({}));
  Object.keys(H.MOBILE_RATIO).forEach(ratio => {
    Object.keys(H.DESKTOP_HEIGHT).forEach(height => {
      const vars = H.heroCssVars({ mobile: { ratio }, desktop: { height } });
      assert.deepStrictEqual(Object.keys(vars), keys, ratio + '/' + height + ' emitted a different var set');
      Object.entries(vars).forEach(([k, v]) => assert.ok(v !== '' && v != null, k + ' was empty'));
    });
  });
});

/* ---- 4. one source of truth in the stylesheet ---------------------------- */
const heroMinHeights = css.match(/\.hero-banner\s*\{[^}]*min-height:[^;}]+/g) || [];
test('the stylesheet declares hero min-height only through the tokens', () => {
  assert.ok(heroMinHeights.length > 0, 'no hero min-height found at all');
  heroMinHeights.forEach(decl => {
    const value = /min-height:\s*([^;}]+)/.exec(decl)[1].trim();
    assert.ok(/^var\(--hero-(desktop-height|mobile-min-height)\)$/.test(value),
      'hard-coded hero min-height would defeat the ratio: ' + value);
  });
});
test('the mobile hero reads its aspect-ratio from the token', () => {
  assert.ok(/aspect-ratio:\s*var\(--hero-mobile-ratio\)/.test(css), 'mobile hero is not ratio-driven');
  const ratios = css.match(/\.hero-banner\s*\{[^}]*aspect-ratio:[^;}]+/g) || [];
  assert.strictEqual(ratios.length, 1, 'expected exactly one hero aspect-ratio rule, found ' + ratios.length);
});
test('no hero rule is forced with !important', () => {
  const forced = (css.match(/[^}]*hero[^{]*\{[^}]*!important[^}]*\}/gi) || []);
  assert.strictEqual(forced.length, 0, 'hero rules must not stack !important overrides');
});
test('the stylesheet defaults match DEFAULT_HERO', () => {
  const defaults = H.heroCssVars(H.DEFAULT_HERO);
  const rootBlock = /:root\s*\{[\s\S]*?\n\}/.exec(css)[0];
  Object.entries(defaults).forEach(([token, value]) => {
    const declared = new RegExp(token.replace(/[-]/g, '\\-') + ':\\s*([^;]+);').exec(rootBlock);
    assert.ok(declared, token + ' is not declared in :root');
    assert.strictEqual(declared[1].trim(), value, token + ' default drifted from hero-config.js');
  });
});

/* ---- 5. the editor is wired to the same module --------------------------- */
const editorJs = fs.readFileSync(path.join(root, 'editor.js'), 'utf8');
const editorHtml = fs.readFileSync(path.join(root, 'editor.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
test('both the editor and the site load hero-config.js', () => {
  assert.ok(/scripts\/hero-config\.js/.test(editorHtml), 'editor.html does not load hero-config.js');
  assert.ok(/scripts\/hero-config\.js/.test(indexHtml), 'index.html does not load hero-config.js');
});
test('the editor renders hero controls from the shared option lists', () => {
  assert.ok(/JHALARHero/.test(editorJs), 'editor.js does not use the shared hero module');
  assert.ok(/hero\.mobile\.ratio|mobile:\s*\{\s*ratio/.test(editorJs), 'editor.js does not write hero.mobile.ratio');
});
test('hero settings never travel through customCSS', () => {
  const customCssWrites = editorJs.match(/customCSS\s*=\s*[^;]+/g) || [];
  customCssWrites.forEach(line => assert.ok(!/hero/i.test(line), 'hero must not be patched via customCSS: ' + line));
});
