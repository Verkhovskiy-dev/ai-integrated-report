import { afterEach, describe, expect, it, vi } from "vitest";
import { insightFreshness, matchesRole } from "./StrategicInsights";
import type { StrategicInsight } from "@/data/insightsData";

function insight(overrides: Partial<StrategicInsight>): StrategicInsight {
  return {
    id: 99,
    insightKey: "unmapped-payload-card",
    title: "Payload card",
    subtitle: "Contract fixture",
    icon: "Bot",
    accentColor: "#000000",
    summary: "A fixture.",
    evidence: [],
    nonObviousConclusion: "A conclusion.",
    educationImplication: "An implication.",
    relevantPrograms: [],
    ...overrides,
  };
}

describe("insight role filtering", () => {
  it("keeps an explicit payload role for an unknown insight key", () => {
    const payloadCard = insight({
      roleRecommendations: { hr: { relevance: 1, action: "Review staffing." } },
    });

    expect(matchesRole(payloadCard, "hr")).toBe(true);
    expect(matchesRole(payloadCard, "cto")).toBe(false);
  });

  it("does not infer a role for an unknown card without a payload assignment", () => {
    const unmappedCard = insight({ roleRecommendations: undefined });

    expect(matchesRole(unmappedCard, "hr")).toBe(false);
    expect(matchesRole(unmappedCard, "cto")).toBe(false);
  });
});

describe("insight freshness fixtures", () => {
  afterEach(() => vi.useRealTimers());

  it("distinguishes fresh, archived, period-only, and invalid packages", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-26T00:00:00.000Z"));

    expect(insightFreshness("2026-09-25T00:00:00.000Z", "")).toBe("fresh");
    expect(insightFreshness("2026-09-01T19:38:59.260Z", "")).toBe("archived");
    expect(insightFreshness("", "2026-09-10 — 2026-09-25")).toBe("fresh");
    expect(insightFreshness("not-a-date", "not-a-period")).toBe("unknown");
  });
});
