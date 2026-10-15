#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function fail(errors, message) {
  errors.push(message);
}

export function extractInlinePlacesData(html) {
  const marker = 'const PLACES_DATA = ';
  const markerAt = html.indexOf(marker);
  if (markerAt < 0) throw new Error('places.html: const PLACES_DATA assignment not found');
  const start = html.indexOf('{', markerAt + marker.length);
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return JSON.parse(html.slice(start, index + 1));
  }
  throw new Error('places.html: incomplete PLACES_DATA JSON');
}

export function validatePlacesCandidate({ candidate, baseline, html, asOf, migratedIds = [] }) {
  const errors = [];
  const places = Array.isArray(candidate?.places) ? candidate.places : [];
  const meta = candidate?.meta || {};
  const requiredMeta = ['version', 'period', 'coverage', 'trends', 'sources'];
  for (const field of requiredMeta) if (meta[field] == null) fail(errors, `schema regression: meta.${field} is required`);
  if (!Array.isArray(meta.trends) || meta.trends.length === 0) fail(errors, 'schema regression: meta.trends must be non-empty');
  if (!Array.isArray(meta.sources) || meta.sources.length === 0) fail(errors, 'schema regression: meta.sources must be non-empty');
  for (const field of ['source_reviewed', 'unchecked', 'primary_sources']) {
    if (!Number.isInteger(meta.coverage?.[field])) fail(errors, `schema regression: meta.coverage.${field} must be an integer`);
  }
  if (meta.total_places !== places.length) fail(errors, `count mismatch: meta.total_places=${meta.total_places}, places=${places.length}`);

  const ids = places.map(place => place?.id).filter(Boolean);
  if (new Set(ids).size !== places.length) fail(errors, 'schema regression: every place must have a unique id');
  for (const place of places) {
    for (const field of ['baseline_assessment', 'review']) {
      if (!place?.[field]) fail(errors, `schema regression: ${place?.id || '<missing-id>'}.${field} is required`);
    }
    if (!Array.isArray(place?.review?.source_ids)) fail(errors, `schema regression: ${place?.id || '<missing-id>'}.review.source_ids must be an array`);
  }

  const endDate = meta.period?.end_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) fail(errors, 'schema regression: meta.period.end_date must be YYYY-MM-DD');
  else if (endDate > asOf) fail(errors, `future period: ${endDate} is later than ${asOf}`);

  const candidateIds = new Set(ids);
  const candidateById = new Map(places.map(place => [place.id, place]));
  const allowedRemovals = new Set(migratedIds);
  const lostIds = (baseline?.places || []).map(place => place.id).filter(id => !candidateIds.has(id) && !allowedRemovals.has(id));
  if (lostIds.length) fail(errors, `lost IDs without explicit migration: ${lostIds.join(', ')}`);
  const lostCooperation = (baseline?.places || [])
    .filter(place => place.cooperation && candidateById.has(place.id) && !candidateById.get(place.id).cooperation)
    .map(place => place.id);
  if (lostCooperation.length) fail(errors, `schema regression: cooperation removed from ${lostCooperation.join(', ')}`);

  let inline;
  try {
    inline = extractInlinePlacesData(html);
  } catch (error) {
    fail(errors, error.message);
  }
  if (inline && JSON.stringify(inline) !== JSON.stringify(candidate)) fail(errors, 'inline/data mismatch: places.html PLACES_DATA differs from data/places_data.json');

  if (errors.length) throw new Error(errors.join('\n'));
  return { places: places.length, periodEnd: endDate };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) args[argv[index].replace(/^--/, '')] = argv[index + 1];
  return args;
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.baseline || !args['as-of']) {
    console.error('Usage: node scripts/validate-places-release.mjs --baseline <previous places_data.json> --as-of YYYY-MM-DD [--data path] [--html path] [--migration path]');
    process.exit(2);
  }
  const dataPath = args.data || 'data/places_data.json';
  const htmlPath = args.html || 'places.html';
  const migratedIds = args.migration ? (readJson(args.migration).removedPlaceIds || []) : [];
  try {
    const result = validatePlacesCandidate({
      candidate: readJson(dataPath),
      baseline: readJson(args.baseline),
      html: fs.readFileSync(htmlPath, 'utf8'),
      asOf: args['as-of'],
      migratedIds,
    });
    console.log(`places release valid: ${result.places} places, period ends ${result.periodEnd}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
