'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateCatalogue, productReference } = require('../scripts/product-naming.js');
const root = path.resolve(__dirname, '..');
const load = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const catalogue = load('content/products.json');
const registry = load('content/product-naming.json');
const manifest = load('assets/images/manifest.json').images;

test('every published product passes the strict naming gate', () => {
  const report = validateCatalogue(catalogue, registry);
  assert.deepEqual(report.errors, []);
  assert.equal(report.reviewCount, 0);
  assert.equal(report.approvedCount, catalogue.products.length);
  assert.ok(catalogue.products.length > 0);
});

test('catalogue and manifest reference real files, not deleted legacy image paths', () => {
  assert.equal(manifest.length, new Set(manifest).size);
  for (const image of manifest) {
    assert.ok(image.startsWith('assets/images/'));
    const absolute = path.resolve(root, image);
    assert.ok(absolute.startsWith(path.join(root, 'assets/images') + path.sep));
    assert.ok(fs.statSync(absolute).size > 0, image);
  }
  for (const product of catalogue.products) {
    for (const field of ['image', 'sourceImage']) assert.ok(manifest.includes(product[field]), `${product.id}: ${field} absent from manifest`);
    if (product.image.endsWith('.webp')) {
      const bytes = fs.readFileSync(path.join(root, product.image));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    }
  }
});

test('product descriptions and category filters are complete', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const runtime = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  assert.ok(html.includes('id="product-filters"'), 'filter container missing from page');
  assert.ok(runtime.includes('function renderFilters'), 'filters are built at runtime from the catalogue');
  const categories = new Set(catalogue.products.map(product => product.category).filter(Boolean));
  assert.ok(categories.size >= 1, 'catalogue has no categories');
  for (const product of catalogue.products) {
    assert.ok(product.description && product.description.trim().length > 30, `Missing description: ${product.id}`);
    assert.ok(product.category && categories.has(product.category), `Missing category: ${product.id}`);
    if (product.naming.reviewMethod === 'human') assert.deepEqual(product.naming.confidence, { series: null, colour: null });
  }
});

test('the two owner-requested separate Shobha entries retain distinct references and images', () => {
  const a = catalogue.products.find(product => product.id === 27);
  const b = catalogue.products.find(product => product.id === 35);
  assert.ok(a && b);
  assert.equal(a.title, 'Shobha Series, Red Yellow & White');
  assert.equal(b.title, a.title);
  assert.notEqual(a.image, b.image);
  assert.notEqual(a.sourceImage, b.sourceImage);
  assert.notEqual(productReference(a), productReference(b));
});

test('website and editor load the shared gate before their catalogue code', () => {
  for (const [htmlFile, runtime] of [['index.html', 'script.js'], ['editor.html', 'editor.js']]) {
    const html = fs.readFileSync(path.join(root, htmlFile), 'utf8');
    // Compare the actual <script src> tags, not raw substrings: inline
    // cache-busting code also mentions "script.js?v=" and must not match.
    const sources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
    const gateIndex = sources.indexOf('scripts/product-naming.js');
    const runtimeIndex = sources.indexOf(runtime);
    assert.ok(gateIndex >= 0 && runtimeIndex >= 0 && gateIndex < runtimeIndex, `${htmlFile}: gate must load before ${runtime}`);
  }
});

test('interactive audience selector and planning picker are wired into the runtime', () => {
  const runtime = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  // The wiring was lost once before: the handler must be invoked, not only defined.
  assert.ok(/^initPremiumInteractions\(\);$/m.test(runtime), 'initPremiumInteractions() must be called at startup');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(/aria-controls="audience-note"/.test(html), 'audience tabs must reference the note region');
  assert.match(html, /class="planning-option[^"]*" aria-pressed="(?:true|false)"/);
});

test('shipped HTML copy matches runtime settings and script defaults (no flash, no crawler drift)', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const runtime = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  const settings = load('content/site-settings.json');
  const decode = value => value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const textOf = (re) => {
    const match = html.match(re);
    assert.ok(match, `pattern not found: ${re}`);
    return decode(match[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  };
  assert.equal(textOf(/<h1>([\s\S]*?)<\/h1>/), settings.heroHeadline);
  assert.equal(textOf(/<p class="hero-lead">([\s\S]*?)<\/p>/), settings.heroIntro);
  assert.equal(textOf(/<title>([\s\S]*?)<\/title>/), settings.siteTitle);
  assert.equal(textOf(/<meta name="description" content="([^"]*)">/), settings.siteDescription);
  assert.equal(textOf(/<h2 id="contact-title">([\s\S]*?)<\/h2>/), settings.sectionCopy.contact.title);
  assert.equal(textOf(/<p class="footer-tagline">([\s\S]*?)<\/p>/), settings.sectionCopy.footerTagline);
  // DEFAULTS parity: the runtime must not rewrite values the HTML already ships
  const defaultsHeadline = runtime.match(/heroHeadline:'([^']*)'/);
  assert.ok(defaultsHeadline, 'script.js DEFAULTS.heroHeadline missing');
  assert.equal(defaultsHeadline[1], settings.heroHeadline);
  assert.ok(/<em>sets the mood\.<\/em>/.test(html), 'hero em accent must survive in the shipped markup');
});
