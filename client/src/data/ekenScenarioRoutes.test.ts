import { describe, expect, it } from "vitest";
import {
  buildDefaultDashboardScenario,
  buildLearningBriefDraft,
  buildLocalLearningRoutePlan,
  buildLearningRoutePayload,
  buildScenarioEkenPayload,
  findDashboardScenario,
  learningOutcomeForIntent,
  retargetLearningBriefDraft,
  stableRouteSourceId,
  verkhovskiyHandoffV2Schema,
  type LearningRouteIntent,
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

  it("builds a v2 learning-production route from the three-field brief", () => {
    const source = {
      surface: "dashboard-insight" as const,
      sourceName: "Разбор входящей почты",
      sourceText: "20–30 писем в день требуют ручной сортировки",
      level: 5,
    };
    const scenario = findDashboardScenario(null, source);
    const draft = buildLearningBriefDraft(source, scenario);
    draft.objective = "Классифицировать письма и предлагать следующий шаг";
    draft.successCriterion = "8 из 10 писем классифицированы верно";

    const payload = buildLearningRoutePayload(source, scenario, draft);

    expect(payload.schemaVersion).toBe("2.0");
    expect(payload.scenarioId).toBe(scenario.scenarioId);
    expect(payload.source.sourceId).toBe(scenario.sourceId);
    expect(payload.brief.evidence.join(" ")).toContain("20–30 писем");
    expect(payload.brief.acceptanceCriterion).toContain("8 из 10");
    expect(payload.brief.expectedArtifact).toContain(scenario.artifact);
    expect(payload.routeId).toMatch(/^[A-Za-z0-9._:-]+$/);
    expect(payload.source.surface).toBe("insight");
    expect(payload.audience.viewMode).toBe("expert");
    expect(Date.parse(payload.expiresAt) - Date.parse(payload.createdAt)).toBe(30 * 60 * 1_000);
    expect(verkhovskiyHandoffV2Schema.safeParse(payload).success).toBe(true);
  });

  it("keeps an insight as a decision job instead of reframing it as an AI tool", () => {
    const source = {
      surface: "dashboard-insight" as const,
      sourceName: "Рост долгового финансирования AI-инфраструктуры",
      sourceText: "Стоимость капитала и риск финансирования меняются",
      level: 9,
    };
    const scenario = findDashboardScenario(null, source);
    const draft = buildLearningBriefDraft(source, scenario);
    const plan = buildLocalLearningRoutePlan(source, scenario, draft);
    const payload = buildLearningRoutePayload(source, scenario, draft);

    expect(draft.title).toMatch(/^Решение:/);
    expect(draft.objective).toContain("Подготовить одно решение");
    expect(draft.realInput).toBe("");
    expect(plan.intentLabel).toBe("Подготовить решение");
    expect(plan.steps.map((step) => step.title)).toEqual([
      "Уточнить контекст решения",
      "Сформулировать решение и адресата",
      "Зафиксировать критерий эффекта",
    ]);
    expect(payload.brief.expectedArtifact).toBe(scenario.artifact);
    expect(payload.brief.expectedArtifact).not.toContain("AI-сценарий");
  });

  it("rejects incomplete and expired V2 handoffs before redirect", () => {
    const source = { surface: "dashboard-news" as const, sourceName: "Проверяемый сигнал" };
    const scenario = findDashboardScenario(null, source);
    const draft = buildLearningBriefDraft(source, scenario);
    const payload = buildLearningRoutePayload(source, scenario, draft);

    expect(verkhovskiyHandoffV2Schema.safeParse({ ...payload, scenarioId: "" }).success).toBe(false);
    expect(verkhovskiyHandoffV2Schema.safeParse({ ...payload, expiresAt: payload.createdAt }).success).toBe(false);
  });

  it("changes the objective and productive outcome for every route intent", () => {
    const source = { surface: "dashboard-focus" as const, sourceName: "Разбор почты" };
    const scenario = findDashboardScenario(null, source);
    const initial = buildLearningBriefDraft(source, scenario);
    const intents: LearningRouteIntent[] = [
      "build_tool",
      "master_tool",
      "improve_tool",
      "choose_tool",
      "enter_position",
      "team_adoption",
    ];

    const routes = intents.map((intent) => {
      const draft = retargetLearningBriefDraft(initial, intent, scenario);
      return buildLearningRoutePayload(source, scenario, draft);
    });

    expect(new Set(routes.map((route) => route.brief.objective)).size).toBe(intents.length);
    expect(new Set(routes.map((route) => route.brief.expectedArtifact)).size).toBe(intents.length);
    intents.forEach((intent, index) => {
      expect(routes[index].brief.expectedArtifact).toBe(learningOutcomeForIntent(intent, scenario));
    });
  });

  it("creates a self-contained local route without an Eken handoff", () => {
    const source = { surface: "dashboard-focus" as const, sourceName: "Планирование отпуска" };
    const scenario = findDashboardScenario(null, source);
    const draft = buildLearningBriefDraft(source, scenario);
    draft.realInput = "Маршрут Москва — Стамбул, 7 дней, бюджет 180 000 ₽";
    draft.successCriterion = "План укладывается в бюджет и содержит проверяемые ссылки";

    const plan = buildLocalLearningRoutePlan(source, scenario, draft);

    expect(plan.steps).toHaveLength(3);
    expect(plan.text).toContain("МАРШРУТ ДЕЙСТВИЯ · VERKHOVSKIY.AI");
    expect(plan.text).toContain("Маршрут Москва — Стамбул");
    expect(plan.text).toContain("План укладывается в бюджет");
    expect(plan.text).not.toContain("Eken");
  });
});
