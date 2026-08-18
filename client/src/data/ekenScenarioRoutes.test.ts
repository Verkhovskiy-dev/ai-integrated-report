import { describe, expect, it } from "vitest";
import {
  buildDefaultDashboardScenario,
  buildScenarioEkenPayload,
  findDashboardScenario,
  stableRouteSourceId,
} from "./ekenScenarioRoutes";

describe("Dashboard → Eken route runtime", () => {
  it("keeps a stable source id across dashboard updates", () => {
    const first = stableRouteSourceId("dashboard-news", "AI-агенты входят в производство", "6");
    const second = stableRouteSourceId("dashboard-news", "AI-агенты входят в производство", "6");
    expect(first).toBe(second);
    expect(first).toMatch(/^news:/);
  });

  it("builds a productive contract for each supported surface", () => {
    for (const surface of ["dashboard-news", "dashboard-trend", "dashboard-shift", "dashboard-insight"] as const) {
      const scenario = buildDefaultDashboardScenario({ surface, sourceName: "Проверяемый сигнал", level: 6, to: "Новая позиция" });
      expect(scenario.promise).toBeTruthy();
      expect(scenario.artifact).toBeTruthy();
      expect(scenario.successCriteria.length).toBeGreaterThanOrEqual(3);
      expect(scenario.estimatedMinutes).toBeGreaterThanOrEqual(15);
    }
  });

  it("passes the selected card context into Eken without changing its route", () => {
    const source = {
      surface: "dashboard-trend" as const,
      sourceName: "Рост браузерных агентов",
      sourceText: "Моментум +34%",
      level: 6,
      reportDate: "2026-08-18",
    };
    const scenario = findDashboardScenario(null, source);
    const payload = buildScenarioEkenPayload(source, scenario);
    expect(payload.place.id).toBe(`dashboard:${scenario.sourceId}`);
    expect(payload.firstAction.object).toContain("Моментум +34%");
    expect(payload.firstAction.output).toBe(scenario.artifact);
    expect(payload.firstAction.acceptanceCriterion).toContain(scenario.successCriteria[0]);
  });
});
