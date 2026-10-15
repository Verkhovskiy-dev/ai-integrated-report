import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { validatePlacesCandidate } from './validate-places-release.mjs';

const good = JSON.parse(fs.readFileSync(new URL('../data/places_data.json', import.meta.url), 'utf8'));
const clone = value => structuredClone(value);
const htmlFor = value => `<script>const PLACES_DATA = ${JSON.stringify(value)};</script>`;
const validate = (candidate, options = {}) => validatePlacesCandidate({
  candidate,
  baseline: options.baseline || good,
  html: options.html || htmlFor(candidate),
  asOf: '2026-10-15',
  migratedIds: options.migratedIds || [],
});

test('accepted 49-place release passes', () => {
  assert.deepEqual(validate(good), { places: 49, periodEnd: '2026-10-11' });
});

test('rejects missing coverage schema', () => {
  const candidate = clone(good);
  delete candidate.meta.coverage;
  assert.throws(() => validate(candidate), /schema regression: meta\.coverage/);
});

test('rejects lost IDs without explicit migration', () => {
  const candidate = clone(good);
  const lostId = candidate.places.pop().id;
  candidate.meta.total_places = candidate.places.length;
  assert.throws(() => validate(candidate), new RegExp(`lost IDs without explicit migration: ${lostId}`));
});

test('allows an explicitly migrated ID', () => {
  const candidate = clone(good);
  const lostId = candidate.places.pop().id;
  candidate.meta.total_places = candidate.places.length;
  assert.doesNotThrow(() => validate(candidate, { migratedIds: [lostId] }));
});

test('rejects a future reporting period', () => {
  const candidate = clone(good);
  candidate.meta.period.end_date = '2026-10-16';
  assert.throws(() => validate(candidate), /future period/);
});

test('rejects total count mismatch', () => {
  const candidate = clone(good);
  candidate.meta.total_places += 1;
  assert.throws(() => validate(candidate), /count mismatch/);
});

test('rejects stale inline data', () => {
  const inline = clone(good);
  inline.meta.version = 'stale';
  assert.throws(() => validate(good, { html: htmlFor(inline) }), /inline\/data mismatch/);
});
