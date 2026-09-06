'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { STATUS, validateRegistry, evaluateNaming, validateCatalogue, productReference } = require('../scripts/product-naming.js');

// Synthetic fixtures only; live approvals are stored in the controlled registry.
function fixture() {
  const approval = { approvedBy: 'Test fixture', approvedOn: '2026-09-07', reference: 'Synthetic test, not an owner approval' };
  const registry = {
    schemaVersion: 1, registryVersion: 'test-human-1', confidenceThreshold: 85,
    series: [{ id: 'test', name: 'Test Series', designCriteria: ['Test construction'], referenceImages: ['test-fixture://design'], approval }],
    colours: [{ id: 'test-colour', name: 'Test Colour', paletteCriteria: ['Test palette'], referenceImages: ['test-fixture://palette'], approval }],
    approvedVariants: [{ seriesId: 'test', colourId: 'test-colour', approval }],
    approvedProducts: [{ productId: 42, seriesId: 'test', colourId: 'test-colour', sourceImage: 'assets/images/source.jpg', image: 'assets/images/display.webp', approval }]
  };
  const candidate = {
    registryVersion: 'test-human-1', reviewMethod: 'human', productId: 42,
    seriesId: 'test', colourId: 'test-colour', sourceImage: 'assets/images/source.jpg', image: 'assets/images/display.webp',
    confidence: { series: null, colour: null }, evidence: { series: 'Test construction reviewed', colour: 'Test palette reviewed' }, requiresReview: false
  };
  return { registry, candidate };
}
function assertReview(result) {
  assert.notEqual(result.status, STATUS.APPROVED);
  assert.equal(result.finalProductName, null);
  assert.equal(result.humanReviewRequired, true);
}

test('registered human approval resolves review without inventing confidence percentages', () => {
  const { registry, candidate } = fixture();
  assert.deepEqual(validateRegistry(registry), []);
  const result = evaluateNaming(candidate, registry);
  assert.equal(result.status, STATUS.APPROVED);
  assert.equal(result.finalProductName, 'Test Series — Test Colour');
  assert.equal(result.approvalMethod, 'human');
  assert.deepEqual(result.confidence, { series: null, colour: null });
  assert.equal(result.humanReviewRequired, false);
});

test('a candidate cannot grant its own human approval', () => {
  const { registry, candidate } = fixture();
  registry.approvedProducts = [];
  candidate.approved = true;
  candidate.approval = { approvedBy: 'Claimed owner', approvedOn: '2026-09-07', reference: 'Not in registry' };
  assertReview(evaluateNaming(candidate, registry));
  delete registry.approvedProducts;
  assertReview(evaluateNaming(candidate, registry));
});

test('human approval is bound to the exact product ID and source/display images', () => {
  const { registry, candidate } = fixture();
  for (const change of [{ productId: 43 }, { productId: '42' }, { image: 'assets/images/other.webp' }, { sourceImage: 'assets/images/other.jpg' }]) {
    assertReview(evaluateNaming({ ...candidate, ...change }, registry));
  }
});

test('human approval still requires current revision, evidence and review clearance', () => {
  const { registry, candidate } = fixture();
  for (const change of [
    { registryVersion: 'old' }, { evidence: {} }, { requiresReview: true },
    { requiresReview: undefined }, { reviewMethod: 'auto-approved' },
    { confidence: { series: 100, colour: 100 } }, { confidence: { series: '100%', colour: null } }
  ]) assertReview(evaluateNaming({ ...candidate, ...change }, registry));
});

test('human mode cannot bypass unknown names or unapproved pairings', () => {
  const { registry, candidate } = fixture();
  assertReview(evaluateNaming({ ...candidate, seriesId: 'invented' }, registry));
  assertReview(evaluateNaming({ ...candidate, colourId: 'invented' }, registry));
  registry.approvedVariants = [];
  assert.ok(validateRegistry(registry).length > 0);
  assertReview(evaluateNaming(candidate, registry));
});

test('malformed or duplicate human registry bindings fail closed', () => {
  for (const mutate of [
    r => { r.approvedProducts = null; },
    r => { r.approvedProducts[0] = null; },
    r => { r.approvedProducts.push(structuredClone(r.approvedProducts[0])); },
    r => { r.approvedProducts[0].productId = 0; },
    r => { r.approvedProducts[0].image = 'javascript:alert(1)'; },
    r => { r.approvedProducts[0].sourceImage = 'assets/images/../../private.jpg'; },
    r => { r.approvedProducts[0].colourId = 'unknown'; },
    r => { delete r.approvedProducts[0].approval; }
  ]) {
    const { registry, candidate } = fixture();
    mutate(registry);
    assert.ok(validateRegistry(registry).length > 0);
    assertReview(evaluateNaming(candidate, registry));
  }
});

test('catalogue checks bind outer identity fields instead of imported metadata claims', () => {
  const { registry, candidate } = fixture();
  const product = { id: 42, title: 'Test Series — Test Colour', image: candidate.image, sourceImage: candidate.sourceImage, naming: candidate };
  assert.equal(validateCatalogue({ products: [product] }, registry).approvedCount, 1);
  for (const change of [{ id: 43 }, { image: 'assets/images/other.webp' }, { sourceImage: 'assets/images/other.jpg' }, { title: 'Test Series - Test Colour' }]) {
    const report = validateCatalogue({ products: [{ ...product, ...change }] }, registry);
    assert.ok(report.errors.length > 0);
    assert.equal(report.approvedCount, 0);
  }
});

test('reference formatting distinguishes products without changing canonical names', () => {
  assert.equal(productReference({ id: 27 }), 'JH-027');
  assert.equal(productReference({ id: 35 }), 'JH-035');
  assert.equal(productReference({ id: 1234 }), 'JH-1234');
  for (const product of [null, {}, { id: 0 }, { id: '27' }, { id: -1 }]) assert.equal(productReference(product), 'Unassigned');
});

test('the same naming gate runs in browsers without Node imports or global collisions', () => {
  const source = fs.readFileSync(path.join(__dirname, '../scripts/product-naming.js'), 'utf8');
  const context = { STATUS: 'existing-global' };
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.equal(context.STATUS, 'existing-global');
  const { registry, candidate } = fixture();
  const result = context.JHALARNaming.evaluateNaming(candidate, registry);
  assert.equal(result.status, STATUS.APPROVED);
  assert.equal(context.JHALARNaming.productReference({ id: 27 }), 'JH-027');
});

test('an empty published catalogue cannot pass strict review', () => {
  const { registry } = fixture();
  const report = validateCatalogue({ products: [] }, registry);
  assert.ok(report.errors.some(error => error.includes('at least one product')));
});
