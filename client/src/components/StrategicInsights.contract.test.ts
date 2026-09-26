import { describe, expect, it } from "vitest";
import { matchesRole } from "./StrategicInsights";
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
