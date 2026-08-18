import assert from "node:assert/strict";
import { buildScenario, compileRegistry, createRoutePlan, discoverDashboardEntries, validateScenarioRegistry } from "./route-system.mjs";

const report = {
  date: "2026-08-18",
  srt_levels: [{ level: 6, events: [{ title: "Агенты выполняют браузерные задачи", description: "Сценарии становятся воспроизводимыми" }] }],
  trends: [{ name: "Браузерные агенты", momentum: 34, rationale: "Рост внедрений", levels: [6] }],
  structural_shifts: [{ title: "От чтения к действию", from: "Информация", to: "Артефакт", through: "Eken", levels: [6] }],
  strategic_insights: [{ title: "Первое действие важнее полноты", summary: "Сокращаем time-to-action", levels: [8] }],
};

const entries = discoverDashboardEntries(report);
assert.equal(entries.length, 5);
assert.equal(new Set(entries.map((entry) => entry.sourceId)).size, entries.length);

const plan = createRoutePlan(report, { scenarios: [] }, "2026-08-18T09:00:00.000Z");
assert.equal(plan.stats.new, 5);
const registry = compileRegistry(plan, { scenarios: [] });
assert.deepEqual(validateScenarioRegistry(registry), []);

const currentPlan = createRoutePlan(report, registry, "2026-08-18T10:00:00.000Z");
assert.equal(currentPlan.stats.current, 5);
assert.equal(currentPlan.stats.new, 0);
const unchangedRegistry = compileRegistry(currentPlan, registry);
assert.equal(unchangedRegistry.updatedAt, registry.updatedAt);

const changedReport = structuredClone(report);
changedReport.trends[0].rationale = "Рост внедрений и изменение требований";
const changedPlan = createRoutePlan(changedReport, registry, "2026-08-18T11:00:00.000Z");
assert.equal(changedPlan.stats.stale, 1);

const scenario = buildScenario(entries.find((entry) => entry.surface === "dashboard-trend"));
assert.equal(scenario.estimatedMinutes, 45);
assert.match(scenario.artifact, /карта воздействия/);

const manuallyCurated = { ...registry.scenarios[0], managedBy: "manual", promise: "Курируемый сценарий", sourceFingerprint: undefined };
const manualRegistry = { ...registry, scenarios: [manuallyCurated, ...registry.scenarios.slice(1)] };
const manualPlan = createRoutePlan(report, manualRegistry, "2026-08-18T12:00:00.000Z");
assert.equal(manualPlan.jobs.find((job) => job.source.sourceId === manuallyCurated.sourceId)?.scenario.promise, "Курируемый сценарий");

console.log("Dashboard route system tests passed");
