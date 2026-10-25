import assert from "node:assert/strict";
import { buildPairedPayload } from "./build-paired-news-data.mjs";
import { validatePublishedPair } from "./validate-published-pair.mjs";

const legacy = {
  date: "2026-10-25",
  srt_levels: [{ level: 9, events: [{
    title: "Факт",
    fact: "Подтверждённый факт",
    why_important: "Интерпретация",
    description: "Подтверждённый факт",
    related_levels: [],
    sources: ["https://example.com/event"],
    importance: null,
  }] }],
};
assert.deepEqual(validatePublishedPair(legacy, { executive_events: [] }), { mode: "legacy", validated: false });

const pair = buildPairedPayload(legacy);
assert.deepEqual(validatePublishedPair(pair.report, pair.executive), {
  mode: "versioned",
  validated: true,
  events: 1,
  available: 0,
  report_content_version: pair.report.content_version,
});

assert.throws(() => validatePublishedPair(pair.report, { executive_events: [] }), /one-sided versioned news pair/);
assert.throws(() => validatePublishedPair(legacy, pair.executive), /one-sided versioned news pair/);

const mismatch = structuredClone(pair.executive);
mismatch.report_content_version = "report_deadbeefdeadbeefdead";
assert.throws(() => validatePublishedPair(pair.report, mismatch), /version mismatch/);

const duplicate = structuredClone(pair.executive);
duplicate.executive_events.push(structuredClone(duplicate.executive_events[0]));
assert.throws(() => validatePublishedPair(pair.report, duplicate), /duplicate executive news_id/);

const malformed = structuredClone(pair.report);
malformed.srt_levels[0].events[0].importance = { level: "low", rationale: "" };
assert.throws(() => validatePublishedPair(malformed, pair.executive), /importance/);

console.log(JSON.stringify({ status: "passed", scenarios: 7, versioned_fail_closed: true, legacy_preserved: true }));
