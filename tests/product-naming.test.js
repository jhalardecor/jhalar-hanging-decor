'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { STATUS, validateRegistry, evaluateNaming, validateCatalogue } = require('../scripts/product-naming.js');

// All approvals, criteria and references here are SYNTHETIC TEST FIXTURES.
// The user's Shobha example is exercised as formatting, not as live approved data.
const approval = () => ({ approvedBy: 'Synthetic test fixture', approvedOn: '2026-09-06', reference: 'Test only; not a JHALAR owner approval' });
function registryFixture() {
  return {
    schemaVersion: 1,
    registryVersion: 'test-revision-1',
    confidenceThreshold: 85,
    series: [
      { id: 'shobha', name: 'Shobha Series', designCriteria: ['Synthetic design criterion A'], referenceImages: ['test-fixture://design-a'], approval: approval() },
      { id: 'fixture-second', name: 'Fixture Second Series', designCriteria: ['Synthetic design criterion B'], referenceImages: ['test-fixture://design-b'], approval: approval() }
    ],
    colours: [
      { id: 'royal-crimson', name: 'Royal Crimson', paletteCriteria: ['Synthetic palette criterion A'], referenceImages: ['test-fixture://palette-a'], approval: approval() },
      { id: 'fixture-colour', name: 'Fixture Colour', paletteCriteria: ['Synthetic palette criterion B'], referenceImages: ['test-fixture://palette-b'], approval: approval() }
    ],
    approvedVariants: [{ seriesId: 'shobha', colourId: 'royal-crimson', approval: approval() }]
  };
}
function candidateFixture() {
  return {
    registryVersion: 'test-revision-1',
    seriesId: 'shobha', colourId: 'royal-crimson',
    confidence: { series: 94, colour: 89 },
    evidence: { series: 'Synthetic match and score basis A', colour: 'Synthetic match and score basis B' },
    requiresReview: false
  };
}
const namedProduct = () => ({ id: 1, title: 'Shobha Series — Royal Crimson', naming: candidateFixture() });

function assertReview(result, status) {
  assert.equal(result.status, status);
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.finalProductName, null);
  assert.ok(result.reasons.length > 0);
}

test('exact series-first canonical name and separate confidence scores', () => {
  const registry = registryFixture();
  assert.deepEqual(validateRegistry(registry), []);
  assert.deepEqual(evaluateNaming(candidateFixture(), registry), {
    registryVersion: 'test-revision-1',
    seriesId: 'shobha', series: 'Shobha Series',
    colourId: 'royal-crimson', colour: 'Royal Crimson',
    finalProductName: 'Shobha Series — Royal Crimson',
    confidence: { series: 94, colour: 89 },
    status: 'Approved', humanReviewRequired: false, reasons: []
  });
});

test('empty approved lists are valid configuration, never approval', () => {
  const registry = { ...registryFixture(), series: [], colours: [], approvedVariants: [] };
  assert.deepEqual(validateRegistry(registry), []);
  const result = evaluateNaming(candidateFixture(), registry);
  assertReview(result, 'SERIES NOT IDENTIFIED — HUMAN REVIEW REQUIRED');
  assert.equal(result.series, null);
  assert.equal(result.colour, null);
  assert.deepEqual(result.confidence, { series: null, colour: null });
});

test('series comes first; an approved colour cannot rescue an unknown series', () => {
  for (const seriesId of [null, undefined, 'invented-series', 'Shobha', 'SHOBHA', 'shobha ', 'Torans']) {
    const result = evaluateNaming({ ...candidateFixture(), seriesId }, registryFixture());
    assertReview(result, STATUS.SERIES);
    assert.equal(result.colour, null);
    assert.equal(result.confidence.colour, null);
  }
});

test('unknown colours keep the known series but never produce a final name', () => {
  for (const colourId of [null, undefined, 'red', 'Royal Crimson', 'ROYAL-CRIMSON', 'royal-crimson ']) {
    const result = evaluateNaming({ ...candidateFixture(), colourId }, registryFixture());
    assertReview(result, 'COLOUR NOT IDENTIFIED — HUMAN REVIEW REQUIRED');
    assert.equal(result.series, 'Shobha Series');
    assert.equal(result.confidence.series, 94);
    assert.equal(result.colour, null);
  }
});

test('individually approved names do not imply an approved pairing', () => {
  for (const changes of [{ seriesId: 'fixture-second' }, { colourId: 'fixture-colour' }]) {
    assertReview(evaluateNaming({ ...candidateFixture(), ...changes }, registryFixture()),
      'COMBINATION NOT APPROVED — HUMAN REVIEW REQUIRED');
  }
});

test('threshold equality passes; independent scores are not averaged or rounded', () => {
  const candidate = candidateFixture();
  candidate.confidence = { series: 85, colour: 85 };
  assert.equal(evaluateNaming(candidate, registryFixture()).status, STATUS.APPROVED);
  candidate.confidence = { series: 100, colour: 84.99 };
  assertReview(evaluateNaming(candidate, registryFixture()), STATUS.REVIEW);
  candidate.confidence = { series: 84.99, colour: 100 };
  assertReview(evaluateNaming(candidate, registryFixture()), STATUS.REVIEW);
  candidate.confidence = { series: 100, colour: 100 };
  assert.equal(evaluateNaming(candidate, registryFixture()).status, STATUS.APPROVED);
});

test('only the registry threshold is used, not a candidate override', () => {
  const registry = registryFixture();
  registry.confidenceThreshold = 95;
  assertReview(evaluateNaming({ ...candidateFixture(), confidenceThreshold: 1 }, registry), STATUS.REVIEW);
});

for (const key of ['series', 'colour']) {
  test(`${key} confidence fails closed for low, missing, non-numeric or out-of-range scores`, () => {
    for (const value of [84.99, 0, 0.94, -1, 101, NaN, Infinity, -Infinity, undefined, null, '94', '94%', true, false, {}, []]) {
      const candidate = candidateFixture();
      candidate.confidence[key] = value;
      const result = evaluateNaming(candidate, registryFixture());
      assertReview(result, STATUS.REVIEW);
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
        assert.equal(result.confidence[key], null);
      } else {
        assert.equal(result.confidence[key], value);
      }
    }
  });
  test(`${key} evidence must be present, not just a high score`, () => {
    for (const value of [undefined, null, '', '   ', 94, true, {}]) {
      const candidate = candidateFixture();
      candidate.evidence[key] = value;
      assertReview(evaluateNaming(candidate, registryFixture()), STATUS.REVIEW);
    }
  });
}

test('missing confidence/evidence objects, stale revisions and ambiguous assessments require review', () => {
  const changes = [
    { confidence: undefined }, { confidence: [] }, { evidence: null }, { evidence: [] },
    { registryVersion: undefined }, { registryVersion: 'old-revision' },
    { requiresReview: true }, { requiresReview: undefined }, { requiresReview: 'false' }, { requiresReview: 0 }
  ];
  for (const change of changes) assertReview(evaluateNaming({ ...candidateFixture(), ...change }, registryFixture()), STATUS.REVIEW);
});

test('supplied names or approval status cannot override the gate', () => {
  const candidate = { ...candidateFixture(), series: 'Invented', colour: 'Red', finalProductName: 'Invented Name', status: 'Approved' };
  assert.equal(evaluateNaming(candidate, registryFixture()).finalProductName, 'Shobha Series — Royal Crimson');
  candidate.seriesId = 'not-approved';
  assertReview(evaluateNaming(candidate, registryFixture()), STATUS.SERIES);
});

test('malformed/missing candidate data never crashes or guesses', () => {
  for (const candidate of [null, undefined, 'Shobha Series — Royal Crimson', [], 42, true, {}]) {
    assertReview(evaluateNaming(candidate, registryFixture()), STATUS.SERIES);
  }
});

const invalidRegistryChanges = [
  ['unsupported schema', r => { r.schemaVersion = 2; }],
  ['missing revision', r => { delete r.registryVersion; }],
  ['padded revision', r => { r.registryVersion = ' revision '; }],
  ['missing threshold', r => { delete r.confidenceThreshold; }],
  ['string threshold', r => { r.confidenceThreshold = '85'; }],
  ['zero threshold', r => { r.confidenceThreshold = 0; }],
  ['out-of-range threshold', r => { r.confidenceThreshold = 101; }],
  ['non-finite threshold', r => { r.confidenceThreshold = Infinity; }],
  ['missing series list', r => { delete r.series; }],
  ['non-array colour list', r => { r.colours = {}; }],
  ['missing pairings', r => { delete r.approvedVariants; }],
  ['malformed series', r => { r.series[0] = null; }],
  ['malformed colour', r => { r.colours[0] = 'red'; }],
  ['malformed pairing', r => { r.approvedVariants[0] = []; }],
  ['invalid ID', r => { r.series[0].id = 'Shobha Series'; }],
  ['duplicate series ID', r => { r.series[1].id = r.series[0].id; }],
  ['duplicate colour name', r => { r.colours[1].name = r.colours[0].name; }],
  ['missing Series suffix', r => { r.series[0].name = 'Shobha'; }],
  ['duplicated Series suffix', r => { r.series[0].name = 'Shobha Series Series'; }],
  ['padded canonical name', r => { r.colours[0].name = 'Royal Crimson '; }],
  ['multi-line name', r => { r.colours[0].name = 'Royal\nCrimson'; }],
  ['no design criteria', r => { r.series[0].designCriteria = []; }],
  ['no palette criteria', r => { r.colours[0].paletteCriteria = [' ']; }],
  ['no reference images', r => { r.colours[0].referenceImages = []; }],
  ['no human approval', r => { delete r.series[0].approval; }],
  ['missing approver', r => { r.colours[0].approval.approvedBy = ''; }],
  ['invalid approval date', r => { r.colours[0].approval.approvedOn = '2026-02-30'; }],
  ['missing approval reference', r => { delete r.approvedVariants[0].approval.reference; }],
  ['dangling series reference', r => { r.approvedVariants[0].seriesId = 'missing'; }],
  ['dangling colour reference', r => { r.approvedVariants[0].colourId = 'missing'; }],
  ['duplicate pairing', r => { r.approvedVariants.push(structuredClone(r.approvedVariants[0])); }],
  ['unsupported registry flag', r => { r.autoApprove = true; }],
  ['unrecognised draft status', r => { r.series[0].status = 'draft'; }]
];
for (const [label, mutate] of invalidRegistryChanges) {
  test(`invalid registry: ${label}`, () => {
    const registry = registryFixture();
    mutate(registry);
    assert.ok(validateRegistry(registry).length > 0);
    assertReview(evaluateNaming(candidateFixture(), registry), STATUS.DATABASE);
  });
}

test('absent or malformed registries fail closed before classification', () => {
  for (const registry of [undefined, null, [], {}, 'unavailable', 42, true]) {
    assertReview(evaluateNaming(candidateFixture(), registry), STATUS.DATABASE);
    assert.ok(validateCatalogue({ products: [namedProduct()] }, registry).errors.length > 0);
  }
});

test('classification does not mutate candidates or the approved registry', () => {
  const candidate = candidateFixture();
  const registry = registryFixture();
  const before = structuredClone({ candidate, registry });
  evaluateNaming(candidate, registry);
  assert.deepEqual({ candidate, registry }, before);
});

test('legacy descriptive records remain pending without being renamed', () => {
  const catalogue = { products: [{ id: 1, title: 'Pink Pom Pom Gota Hanging', category: 'Pom Pom Hangings' }] };
  const before = structuredClone(catalogue);
  const report = validateCatalogue(catalogue, registryFixture());
  assert.deepEqual(report.errors, []);
  assert.equal(report.approvedCount, 0);
  assert.equal(report.reviewCount, 1);
  assertReview(report.products[0], STATUS.SERIES);
  assert.deepEqual(catalogue, before);
});

test('only fully validated canonical catalogue records count as approved', () => {
  const report = validateCatalogue({ products: [namedProduct()] }, registryFixture());
  assert.deepEqual(report.errors, []);
  assert.equal(report.approvedCount, 1);
  assert.equal(report.reviewCount, 0);
});

test('catalogue spelling, punctuation, order and suffix must match exactly', () => {
  const invalidTitles = [
    'SHOBHA SERIES — Royal Crimson', 'Shobha Series - Royal Crimson',
    'Shobha Series – Royal Crimson', 'Royal Crimson — Shobha Series',
    'Shobha Series — Royal Red', 'Shobha Series Series — Royal Crimson',
    'Shobha Series —  Royal Crimson', ' Shobha Series — Royal Crimson',
    'Shobha Collection — Royal Crimson'
  ];
  for (const title of invalidTitles) {
    const report = validateCatalogue({ products: [{ ...namedProduct(), title }] }, registryFixture());
    assert.ok(report.errors.some(error => error.includes('Title must exactly equal')));
    assert.equal(report.approvedCount, 0);
    assertReview(report.products[0], STATUS.REVIEW);
  }
});

test('unregistered series-style titles and unresolved naming metadata cannot pass migration checks', () => {
  for (const product of [
    { id: 1, title: 'Shobha Series — Royal Crimson' },
    { id: 1, title: 'Invented SERIES - Red' },
    { id: 1, title: 'Legacy title', naming: null },
    { ...namedProduct(), naming: { ...candidateFixture(), requiresReview: true } }
  ]) {
    const report = validateCatalogue({ products: [product] }, registryFixture());
    assert.ok(report.errors.length > 0);
    assert.equal(report.approvedCount, 0);
    assert.equal(report.reviewCount, 1);
    assert.equal(report.products[0].finalProductName, null);
  }
});

test('catalogue shape, IDs and titles are validated', () => {
  for (const catalogue of [null, {}, [], { products: null }, { products: [null] }]) {
    assert.ok(validateCatalogue(catalogue, registryFixture()).errors.length > 0);
  }
  for (const id of [undefined, null, 0, -1, 1.2, '1', true]) {
    const report = validateCatalogue({ products: [{ ...namedProduct(), id }] }, registryFixture());
    assert.ok(report.errors.length > 0);
    assert.equal(report.approvedCount, 0);
  }
  assert.ok(validateCatalogue({ products: [namedProduct(), namedProduct()] }, registryFixture()).errors.length > 0);
  assert.ok(validateCatalogue({ products: [{ ...namedProduct(), title: '' }] }, registryFixture()).errors.length > 0);
});

// CLI tests use disposable fixtures, never edits to the live catalogue/registry.
function withFiles(catalogue, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jhalar-naming-test-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.mkdirSync(path.join(root, 'content'));
    fs.copyFileSync(path.join(__dirname, '../scripts/product-naming.js'), path.join(root, 'scripts/product-naming.js'));
    fs.writeFileSync(path.join(root, 'content/product-naming.json'), JSON.stringify(registryFixture()));
    fs.writeFileSync(path.join(root, 'content/products.json'), JSON.stringify(catalogue));
    const run = (...args) => spawnSync(process.execPath, [path.join(root, 'scripts/product-naming.js'), ...args], { cwd: os.tmpdir(), encoding: 'utf8' });
    callback(run, root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('CLI migration mode reports pending records; strict mode fails and emits JSON', () => {
  withFiles({ products: [{ id: 1, title: 'Legacy descriptive title' }] }, run => {
    const normal = run();
    assert.equal(normal.status, 0);
    assert.match(normal.stdout, /0 approved; 1 require human review/);
    assert.match(normal.stdout, /not naming approval/);
    const strict = run('--strict', '--json');
    assert.equal(strict.status, 1);
    const report = JSON.parse(strict.stdout);
    assert.equal(report.reviewCount, 1);
    assertReview(report.products[0], STATUS.SERIES);
  });
});

test('CLI strict mode passes only approved records, regardless of working directory', () => {
  withFiles({ products: [namedProduct()] }, run => {
    const result = run('--strict', '--json');
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).approvedCount, 1);
    assert.equal(run('--unknown').status, 2);
    assert.equal(run('--help').status, 0);
  });
});

test('CLI fails clearly for malformed or missing registry files', () => {
  withFiles({ products: [namedProduct()] }, (run, root) => {
    const registryPath = path.join(root, 'content/product-naming.json');
    fs.writeFileSync(registryPath, '{not json');
    let result = run('--json');
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).errors.length, 1);
    fs.unlinkSync(registryPath);
    result = run('--json');
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).errors.length, 1);
  });
});
