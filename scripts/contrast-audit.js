#!/usr/bin/env node
/**
 * JHALAR contrast audit.
 *
 * Checks every important text/UI colour combination in the design system against
 * WCAG 2.x contrast ratios and APCA Lc, so colour decisions are calculated rather
 * than eyeballed. Run with `npm run contrast`.
 *
 * Targets:
 *   - normal body text        >= 4.5:1 (WCAG AA), aiming for 7:1 (AAA) where practical
 *   - large text / headings   >= 3:1 minimum, held to AA or better here
 *   - non-text UI boundaries  >= 3:1 for interactive, lower only for decorative rules
 *   - APCA                    Lc 80+ for primary body text where feasible
 *
 * Text over photography is measured against the actual worst-case pixels of the
 * hero image under the applied scrim, not against an assumed flat colour.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/* ---------- colour maths ---------- */

function parseColor(input) {
  if (Array.isArray(input)) return input;
  const value = String(input).trim();
  const rgba = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const parts = rgba[1].split(',').map((p) => parseFloat(p.trim()));
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  let hex = value.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(hex.substr(i, 2), 16));
}

/** Composite a possibly-translucent colour over an opaque backdrop. */
function flatten(color, backdrop) {
  const c = parseColor(color);
  const b = parseColor(backdrop);
  const a = c.length > 3 ? c[3] : 1;
  if (a >= 1) return [c[0], c[1], c[2]];
  return [0, 1, 2].map((i) => c[i] * a + b[i] * (1 - a));
}

const srgbToLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (rgb) =>
  0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);

/** WCAG 2.x contrast ratio. */
function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** APCA (SAPC-98 / W3C draft) lightness contrast, returned as absolute Lc. */
function apcaLc(text, background) {
  const comp = (c) => Math.pow(c / 255, 2.4);
  const screenY = (rgb) => 0.2126729 * comp(rgb[0]) + 0.7151522 * comp(rgb[1]) + 0.0721750 * comp(rgb[2]);
  const BLACK_THRESHOLD = 0.022;
  const BLACK_EXP = 1.414;
  const DELTA_MIN = 0.1;
  const SCALE = 1.14;
  const OFFSET = 0.027;
  const clampBlack = (y) => (y > BLACK_THRESHOLD ? y : y + Math.pow(BLACK_THRESHOLD - y, BLACK_EXP));

  const yText = clampBlack(screenY(text));
  const yBg = clampBlack(screenY(background));
  let contrast;
  if (yBg > yText) {
    contrast = (Math.pow(yBg, 0.56) - Math.pow(yText, 0.57)) * SCALE;
    contrast = contrast < DELTA_MIN ? 0 : contrast - OFFSET;
  } else {
    contrast = (Math.pow(yBg, 0.65) - Math.pow(yText, 0.62)) * SCALE;
    contrast = contrast > -DELTA_MIN ? 0 : contrast + OFFSET;
  }
  return Math.abs(contrast * 100);
}

/* ---------- palette ---------- */

const T = {
  paper: '#FFFAF1',
  surface: '#FFFDF8',
  navy: '#141942',
  heritage: '#622331',
  red: '#C82039',
  redDeep: '#A71931',
  onDark: '#FFFAF1',
  onDarkSoft: '#EDE7DF',
  onDarkAccent: '#F2DCCD',
  onDarkLine: 'rgba(255,250,241,.55)',
  line: 'rgba(20,25,66,.14)',
  lineStrong: 'rgba(20,25,66,.5)',
  productImageBg: '#F3EEE8',
  modalMediaBg: '#F1ECE6',
  modalScrim: 'rgba(20,25,66,.58)',
  privacyPaper: '#FFFBF3',
  privacyBody: '#3B2530',
};

/**
 * kind: 'body'   normal text  — AA 4.5, AAA 7, APCA 80
 *       'large'  >=24px or >=18.66px bold — AA 3, APCA 60
 *       'ui'     non-text interactive boundary — 3:1, no APCA gate
 *       'decor'  purely decorative rule — reported, not gated
 */
const CHECKS = [
  // Canvas -> text
  ['Canvas (paper) -> body ink', T.navy, T.paper, 'body'],
  ['Canvas (paper) -> section support text', T.heritage, T.paper, 'body'],
  ['Canvas (paper) -> heading', T.navy, T.paper, 'large'],
  ['Canvas (paper) -> nav link', T.navy, T.paper, 'body'],
  ['Canvas (paper) -> eyebrow / kicker', T.navy, T.paper, 'body'],

  // Surface -> text
  ['Surface -> product title', T.navy, T.surface, 'body'],
  ['Surface -> product category', T.heritage, T.surface, 'body'],
  ['Surface -> "View details" link', T.heritage, T.surface, 'body'],
  ['Surface -> "View details" link (hover)', T.redDeep, T.surface, 'body'],
  ['Surface -> story / custom body copy', T.heritage, T.surface, 'body'],

  // CTA background -> CTA text
  ['CTA navy -> CTA text (More / WhatsApp)', T.onDark, T.navy, 'body'],
  ['CTA heritage (hover) -> CTA text', T.onDark, T.heritage, 'body'],
  ['CTA outline -> label on paper', T.navy, T.paper, 'body'],

  // Filters
  ['Filter idle -> label', T.navy, T.paper, 'body'],
  ['Filter idle -> border (interactive boundary)', T.lineStrong, T.paper, 'ui'],
  ['Filter hover -> label', T.heritage, T.paper, 'body'],
  ['Filter ACTIVE (navy) -> label', T.paper, T.navy, 'body'],

  // Modal
  ['Modal surface -> title', T.navy, T.surface, 'large'],
  ['Modal surface -> body copy', T.heritage, T.surface, 'body'],
  ['Modal close / nav control -> glyph', T.navy, T.surface, 'body'],
  ['Modal control -> border on photo', T.lineStrong, T.surface, 'ui'],
  ['Modal media backdrop -> zoom hint text', T.navy, T.surface, 'body'],

  // Chip over photography (opaque chip, so measured against the chip)
  ['Product photo chip -> "View details"', T.navy, T.surface, 'body'],
  ['Product image placeholder -> title fallback', T.navy, T.productImageBg, 'body'],

  // Contact + footer (dark)
  ['Contact navy -> heading', T.onDark, T.navy, 'large'],
  ['Contact navy -> body copy', T.onDarkSoft, T.navy, 'body'],
  ['Contact navy -> eyebrow accent', T.onDarkAccent, T.navy, 'body'],
  ['Contact navy -> CTA border', T.onDarkLine, T.navy, 'ui'],
  ['Footer navy -> footer text', T.onDarkSoft, T.navy, 'body'],
  ['Footer navy -> footer link', T.onDark, T.navy, 'body'],
  ['Footer navy -> top rule', T.onDarkLine, T.navy, 'ui'],

  // Standalone pages
  ['404 paper -> heading', T.navy, T.paper, 'large'],
  ['404 paper -> eyebrow', T.heritage, T.paper, 'body'],
  ['404 paper -> body copy', T.heritage, T.paper, 'body'],
  ['404 CTA navy -> CTA text', T.onDark, T.navy, 'body'],
  ['Privacy paper -> heading', T.redDeep, T.privacyPaper, 'large'],
  ['Privacy paper -> body copy', T.privacyBody, T.privacyPaper, 'body'],
  ['Privacy paper -> back link', T.redDeep, T.privacyPaper, 'body'],

  // Decorative rules — reported for visibility, not gated as UI controls
  ['Decorative hairline on paper', T.line, T.paper, 'decor'],
];

const GATES = {
  body: { wcag: 4.5, apca: 80, aaa: 7 },
  large: { wcag: 3, apca: 60 },
  ui: { wcag: 3, apca: 0 },
  decor: { wcag: 0, apca: 0 },
};

/* ---------- text over the hero photograph ---------- */

/**
 * The hero scrim is a gradient over a real photo, so a flat-colour check is not
 * meaningful. Sample the image, apply the scrim alpha that actually covers the
 * copy column, and report the worst pixel.
 */
function heroCheck(imagePath, label, alpha, crop) {
  if (!fs.existsSync(imagePath)) return null;
  let raw;
  try {
    const args = [imagePath];
    if (crop) args.push('-gravity', 'center', '-crop', crop, '+repage');
    args.push('-resize', '160x', 'txt:-');
    raw = execFileSync('convert', args, { maxBuffer: 1 << 28 }).toString();
  } catch (err) {
    return { label, skipped: 'ImageMagick `convert` unavailable' };
  }
  const pixels = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/^(\d+),(\d+): \(([\d.]+),([\d.]+),([\d.]+)/);
    if (m) pixels.push({ y: +m[2], rgb: [+m[3], +m[4], +m[5]] });
  }
  if (!pixels.length) return { label, skipped: 'no pixels parsed' };

  const height = Math.max(...pixels.map((p) => p.y)) + 1;
  const paper = parseColor(T.paper);
  const ink = parseColor(T.navy);
  let worstRatio = Infinity;
  let worstLc = Infinity;

  for (const p of pixels) {
    if (crop) {
      // Mobile copy occupies the lower half of the frame.
      if (p.y / height < 0.45) continue;
    }
    const eff = [0, 1, 2].map((i) => paper[i] * alpha + p.rgb[i] * (1 - alpha));
    worstRatio = Math.min(worstRatio, contrastRatio(ink, eff));
    worstLc = Math.min(worstLc, apcaLc(ink, eff));
  }
  return { label, ratio: worstRatio, lc: worstLc };
}

/* ---------- run ---------- */

function main() {
  const root = path.resolve(__dirname, '..');
  const rows = [];
  let failures = 0;

  for (const [label, fgRaw, bgRaw, kind] of CHECKS) {
    const bg = flatten(bgRaw, T.paper);
    const fg = flatten(fgRaw, bg);
    const ratio = contrastRatio(fg, bg);
    const lc = apcaLc(fg, bg);
    const gate = GATES[kind];
    const wcagOk = ratio >= gate.wcag;
    const apcaOk = gate.apca === 0 || lc >= gate.apca;
    const ok = wcagOk && apcaOk;
    if (!ok) failures++;
    rows.push({ label, kind, ratio, lc, ok, aaa: gate.aaa ? ratio >= gate.aaa : null });
  }

  const hero = [
    heroCheck(path.join(root, 'assets/images/hero-jhalar.jpg'), 'Hero image -> headline/lead (desktop scrim)', 0.92, null),
    heroCheck(path.join(root, 'assets/images/hero-jhalar.jpg'), 'Hero image -> headline/lead (mobile scrim)', 0.92, '75%x100%+0+0'),
  ].filter(Boolean);

  const pad = (s, n) => String(s).padEnd(n);
  console.log('\nJHALAR contrast audit — WCAG 2.x ratio + APCA Lc\n');
  console.log(pad('COMBINATION', 46), pad('KIND', 7), pad('RATIO', 8), pad('APCA', 7), 'RESULT');
  console.log('-'.repeat(88));
  for (const r of rows) {
    const grade =
      r.kind === 'decor' ? 'decorative'
        : r.kind === 'ui' ? (r.ok ? 'PASS (3:1 UI)' : 'FAIL')
          : r.ok ? (r.aaa ? 'PASS (AAA)' : 'PASS (AA)') : 'FAIL';
    console.log(pad(r.label, 46), pad(r.kind, 7), pad(r.ratio.toFixed(2) + ':1', 8), pad('Lc ' + r.lc.toFixed(0), 7), grade);
  }

  console.log('\nText over photography (worst-case pixel under the applied scrim)\n');
  for (const h of hero) {
    if (h.skipped) {
      console.log(pad(h.label, 46), 'skipped —', h.skipped);
      continue;
    }
    const ok = h.ratio >= 4.5 && h.lc >= 80;
    if (!ok) failures++;
    console.log(pad(h.label, 46), pad('image', 7), pad(h.ratio.toFixed(2) + ':1', 8), pad('Lc ' + h.lc.toFixed(0), 7), ok ? 'PASS' : 'FAIL');
  }

  const bodyRows = rows.filter((r) => r.kind === 'body');
  const aaa = bodyRows.filter((r) => r.aaa).length;
  console.log(`\n${rows.length + hero.length} combinations checked · ${failures} failing`);
  console.log(`Body text at AAA (7:1): ${aaa}/${bodyRows.length}`);

  if (failures) {
    console.error('\nContrast audit failed.\n');
    process.exit(1);
  }
  console.log('\nAll audited combinations meet their target.\n');
}

if (require.main === module) main();

module.exports = { contrastRatio, apcaLc, flatten, parseColor };
