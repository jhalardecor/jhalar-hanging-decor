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
  // Filter chips are rendered at runtime from the catalogue itself
  // (script.js renderFilters), so completeness means every product has a
  // usable category and there is more than one category to filter by.
  const categories = new Set(catalogue.products.map(product => product.category).filter(c => typeof c === 'string' && c.trim()));
  assert.ok(categories.size > 1, 'Expected more than one category for filtering');
  for (const product of catalogue.products) {
    assert.ok(product.description && product.description.trim().length > 30, `Missing description: ${product.id}`);
    assert.ok(categories.has(product.category), `Missing filter: ${product.category}`);
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
  for (const [htmlFile, script] of [['index.html', 'script.js?v='], ['editor.html', 'editor.js?v=']]) {
    const html = fs.readFileSync(path.join(root, htmlFile), 'utf8');
    const namingIndex = html.indexOf('scripts/product-naming.js?v=');
    assert.ok(namingIndex >= 0 && namingIndex < html.indexOf(script));
  }
});
