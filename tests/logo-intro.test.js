'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('logo intro film ships with its choreography and safeguards intact', () => {
  const file = path.join(root, 'logo-intro.html');
  assert.ok(fs.existsSync(file), 'logo-intro.html is missing');
  const html = fs.readFileSync(file, 'utf8');

  // The film is built from the real wordmark paths, not a screenshot.
  assert.equal((html.match(/class="ltr"/g) || []).length, 6, 'six letter groups expected');
  assert.ok(html.includes('>hanging decor</text>'), 'wordmark subline missing');

  // Self-contained and subpath-safe: relative asset references that exist.
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    assert.ok(!/^https?:\/\//.test(ref) && !ref.startsWith('/'), `external or rooted reference: ${ref}`);
    if (!ref.startsWith('#') && ref !== './') {
      assert.ok(fs.existsSync(path.join(root, ref)), `referenced asset missing: ${ref}`);
    }
  }

  // Interaction safeguards: skippable, replayable, reduced-motion safe.
  assert.match(html, /prefers-reduced-motion:\s*reduce/);
  assert.match(html, /id="skip"/);
  assert.match(html, /id="replay"/);
  assert.match(html, /aria-label="Colour sets the mood\."/);

  // House rules: no internal catalogue references leak into the film.
  assert.doesNotMatch(html, /JH-\d{3}/);
  assert.doesNotMatch(html, /Catalogue ref:/);
});
