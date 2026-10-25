import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildPairedPayload, expectedContentVersion, expectedNewsId, validatePairedPayload } from "./build-paired-news-data.mjs";

const bound = (event, explanation) => {
  const newsId = expectedNewsId(event);
  return { ...event, executive_explanation: { ...explanation, content_version: expectedContentVersion(event, newsId) } };
};

const report = { date: "2026-10-25", srt_levels: [{ level: 9, events: [
  bound({ title: "Одинаковый первые сорок символов A", description: "A", fact: "Факт A", why_important: "Причина A", sources: ["https://example.test/a"], related_levels: [1, 9], importance: { level: "low", rationale: "Низкий прямой эффект" } }, { what_happened: "A", why_important: "A важно", business_impact: "A влияние" }),
  bound({ title: "Одинаковый первые сорок символов B", description: "B", fact: "Факт B", why_important: "Причина B", sources: ["https://example.test/b"], related_levels: [2, 9], importance: { level: "high", rationale: "Подтверждённый высокий эффект" } }, { what_happened: "B", why_important: "B важно", business_impact: "B влияние" }),
] }, { level: 1, events: [
  { title: "Уровень один без оценки", description: "C", fact: "Факт C", why_important: "Причина C", sources: ["https://example.test/c"], related_levels: [1, 4] },
] }] };

const paired = buildPairedPayload(report);
assert.equal(validatePairedPayload(paired.report, paired.executive).events, 3);
assert.equal(paired.executive.executive_events.filter(x => x.status === "available").length, 2);
assert.equal(paired.report.srt_levels[0].events[0].importance.level, "low", "L9 is allowed to be low");
assert.equal(paired.report.srt_levels[1].events[0].importance, null, "missing importance stays unknown");
assert.notEqual(paired.executive.executive_events[0].news_id, paired.executive.executive_events[1].news_id, "prefix collisions cannot collide");

const titleEdited = structuredClone(report); titleEdited.srt_levels[0].events[0].title = "Переименованное событие A";
const changed = buildPairedPayload(titleEdited);
assert.equal(changed.report.srt_levels[0].events[0].news_id, paired.report.srt_levels[0].events[0].news_id, "source identity survives title edit");
assert.notEqual(changed.report.srt_levels[0].events[0].content_version, paired.report.srt_levels[0].events[0].content_version, "content version changes with title");
assert.equal(changed.executive.executive_events[0].status, "unavailable", "an old inline explanation is not restamped onto edited content");
assert.equal(changed.executive.executive_events[0].unavailable_reason, "stale_or_unbound");

const freshTitleEdited = structuredClone(titleEdited);
const editedEvent = freshTitleEdited.srt_levels[0].events[0];
editedEvent.executive_explanation.content_version = expectedContentVersion(editedEvent, expectedNewsId(editedEvent));
const freshChanged = buildPairedPayload(freshTitleEdited);
const stale = structuredClone(freshChanged.executive); stale.executive_events[0].content_version = paired.executive.executive_events[0].content_version;
assert.throws(() => validatePairedPayload(freshChanged.report, stale), /stale executive explanation/);

const factMutatedWithOldVersion = structuredClone(paired.report);
factMutatedWithOldVersion.srt_levels[0].events[0].fact = "Изменённый факт";
assert.throws(() => validatePairedPayload(factMutatedWithOldVersion, paired.executive), /content_version does not match content/);

const duplicate = structuredClone(report); duplicate.srt_levels[1].events[0].sources = ["https://example.test/a"];
assert.throws(() => buildPairedPayload(duplicate), /duplicate news_id/);
const orphan = structuredClone(paired.executive); orphan.executive_events[0].news_id = "news_aaaaaaaaaaaaaaaaaaaa";
assert.throws(() => validatePairedPayload(paired.report, orphan), /orphan executive explanation/);
const invalidImportance = structuredClone(report); invalidImportance.srt_levels[0].events[0].importance = { level: "urgent", rationale: "x" };
assert.throws(() => buildPairedPayload(invalidImportance), /importance must/);

const current = JSON.parse(await readFile(new URL("../../test-fixtures/news-contract/current-2026-10-25.json", import.meta.url), "utf8"));
const currentPaired = buildPairedPayload(current);
assert.equal(validatePairedPayload(currentPaired.report, currentPaired.executive).events, 34);
assert.equal(currentPaired.executive.executive_events.filter(x => x.status === "unavailable").length, 34, "unseen current report is explicitly unavailable rather than matched by title");
console.log("news contract: all scenarios passed");
