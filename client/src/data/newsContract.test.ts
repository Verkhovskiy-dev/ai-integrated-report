import { describe, expect, it } from "vitest";
import {
  computeContentVersion,
  computeReportContentVersion,
  executiveSafeDescription,
  importanceLabel,
  validateExecutiveNewsData,
  type ContractNewsEvent,
  type ContractNewsReport,
  type ExecutiveNewsData,
} from "./newsContract";

async function validPair() {
  const event: ContractNewsEvent = {
    news_id: "news_aaaaaaaaaaaaaaaaaaaa",
    title: "Synthetic contract fixture",
    description: "Synthetic description",
    fact: "Synthetic fact",
    why_important: "Synthetic reason",
    related_levels: [1, 9],
    sources: ["https://example.test/item"],
    importance: { level: "high", rationale: "Explicit synthetic assessment" },
  };
  event.content_version = await computeContentVersion(event, event.news_id!);
  const report: ContractNewsReport = { srt_levels: [{ events: [event] }] };
  report.content_version = await computeReportContentVersion([event]);
  const executive: ExecutiveNewsData = {
    schema_version: "news-executive/v1",
    report_content_version: report.content_version,
    executive_events: [{
      news_id: event.news_id!,
      content_version: event.content_version,
      status: "available",
      what_happened: "Synthetic event",
      why_important: "Synthetic importance",
      business_impact: "Synthetic impact",
    }],
  };
  return { report, executive };
}

describe("runtime news/executive contract", () => {
  it("accepts one fully bound synthetic pair", async () => {
    const { report, executive } = await validPair();
    await expect(validateExecutiveNewsData(report, executive)).resolves.toBe(executive);
  });

  it.each([
    "duplicate",
    "orphan",
    "root-mismatch",
    "empty-field",
    "stale-entry",
    "missing-entry",
  ])("fails closed for %s executive data", async mutation => {
    const { report, executive } = await validPair();
    if (mutation === "duplicate") executive.executive_events.push({ ...executive.executive_events[0] });
    if (mutation === "orphan") executive.executive_events[0].news_id = "news_bbbbbbbbbbbbbbbbbbbb";
    if (mutation === "root-mismatch") executive.report_content_version = "report_deadbeefdeadbeefdead";
    if (mutation === "empty-field") executive.executive_events[0].why_important = "";
    if (mutation === "stale-entry") executive.executive_events[0].content_version = "cv_deadbeefdeadbeefdead";
    if (mutation === "missing-entry") executive.executive_events = [];
    await expect(validateExecutiveNewsData(report, executive)).rejects.toThrow();
  });

  it("rejects changed facts when the report keeps an old content hash", async () => {
    const { report, executive } = await validPair();
    report.srt_levels![0].events![0].fact = "Changed fact with old version";
    await expect(validateExecutiveNewsData(report, executive)).rejects.toThrow(/content hash mismatch/);
  });

  it("shows only source fact after a root-version rejection", async () => {
    const { report, executive } = await validPair();
    const event = report.srt_levels![0].events![0];
    event.description = "Synthetic fact Почему это важно: generated interpretation";
    event.fact = "Synthetic fact";
    event.content_version = await computeContentVersion(event, event.news_id!);
    report.content_version = await computeReportContentVersion([event]);
    executive.report_content_version = "report_deadbeefdeadbeefdead";
    await expect(validateExecutiveNewsData(report, executive)).rejects.toThrow(/root version mismatch/);
    const renderedFallback = executiveSafeDescription(event, { status: "unavailable", reason: "missing" }, true);
    expect(renderedFallback).toBe("Synthetic fact");
    expect(renderedFallback).not.toContain("generated interpretation");

    const missingFact = { ...event, fact: undefined };
    const titleOnlyFallback = executiveSafeDescription(missingFact, { status: "unavailable", reason: "missing" }, true);
    expect(titleOnlyFallback).toBe("Synthetic contract fixture");
    expect(titleOnlyFallback).not.toContain("generated interpretation");
  });

  it("rejects duplicate report IDs and invalid importance without throwing in the label UI", async () => {
    const { report, executive } = await validPair();
    const duplicate = structuredClone(report.srt_levels![0].events![0]);
    report.srt_levels![0].events!.push(duplicate);
    await expect(validateExecutiveNewsData(report, executive)).rejects.toThrow(/Duplicate report/);

    expect(importanceLabel({ level: "urgent", rationale: "bad" } as never, false)).toBe("Важность: не оценена");
    expect(importanceLabel({ level: "urgent", rationale: "bad" } as never, true)).toBe("Importance: unknown");
    expect(importanceLabel({ level: "high", rationale: "" }, false)).toBe("Важность: не оценена");
  });
});
