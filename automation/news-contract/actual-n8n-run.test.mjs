import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { expectedContentVersion, expectedNewsId } from "../../scripts/news-contract/build-paired-news-data.mjs";
import { run } from "./actual-n8n-run.mjs";

const nodes = JSON.parse(await readFile(new URL("./producer-nodes-sanitized.json", import.meta.url), "utf8"));
const parserCode = nodes["Parse Report to JSON"].parameters.jsCode;
const validatorCode = nodes["Validate Report"].parameters.jsCode;

// Synthetic positive: the mock represents a future second-stage generator that
// received the already-computed event version. No live model is invoked.
function syntheticEvent(index, level) {
  const event = {
    title: `Событие ${index}`,
    fact: "Факт",
    why_important: "Причина",
    description: "Факт Почему это важно: Причина",
    sources: [`https://${level}.test/${index}`],
    related_levels: [level, 9],
    importance: { level: level === 1 ? "high" : "low", rationale: "Явно" },
  };
  const newsId = expectedNewsId(event);
  return {
    ...event,
    executive_explanation: {
      content_version: expectedContentVersion(event, newsId),
      what_happened: "Факт",
      why_important: "Причина",
      business_impact: "Влияние",
    },
  };
}

const raw = {
  date: "2026-10-25",
  srt_levels: [9, 8, 7, 1].map(level => ({
    level,
    level_summary: "Есть изменение",
    events: Array.from({ length: level === 9 ? 3 : 4 }, (_, index) => syntheticEvent(index, level)),
  })),
  cross_level_links: [],
  structural_shifts: [],
  radar_signals: [],
  trends: [],
};

for (const mode of ["old", "invalid", "duplicate", "malformed-json"]) {
  const input = structuredClone(raw);
  const calls = [];
  if (mode === "old") input.date = "2026-10-24";
  if (mode === "invalid") input.srt_levels[0].events[0].importance = { level: "bad", rationale: "x" };
  if (mode === "duplicate") input.srt_levels[0].events[1].sources = input.srt_levels[0].events[0].sources;
  const agentOutput = mode === "malformed-json" ? "{bad" : JSON.stringify(input);
  try {
    await run({ agentOutput, parserCode, validatorCode, writer: { writePair: async pair => calls.push(pair) } });
  } catch {}
  assert.equal(calls.length, 0, `${mode} must not write`);
}

const calls = [];
const out = await run({ agentOutput: JSON.stringify(raw), parserCode, validatorCode, writer: { writePair: async pair => calls.push(pair) } });
assert.equal(out.written, true);
assert.equal(calls.length, 1);
assert.deepEqual(Object.keys(calls[0]).sort(), ["executive_data_ru.json", "latest-report.json"]);
assert.equal(calls[0]["executive_data_ru.json"].executive_events[0].status, "available");

const staleRaw = structuredClone(raw);
staleRaw.srt_levels[0].events[0].fact = "Изменённый факт";
const staleCalls = [];
const staleOut = await run({ agentOutput: JSON.stringify(staleRaw), parserCode, validatorCode, writer: { writePair: async pair => staleCalls.push(pair) } });
assert.equal(staleCalls.length, 1);
assert.equal(staleOut.pair.executive.executive_events[0].status, "unavailable");
assert.equal(staleOut.pair.executive.executive_events[0].unavailable_reason, "stale_or_unbound");

console.log(JSON.stringify({
  suite: "actual producer parser+validator+pair writer spy",
  model: "synthetic mock only",
  positiveWrites: calls.length,
  staleWrites: staleCalls.length,
  negativeWrites: 0,
  status: "passed",
}));
