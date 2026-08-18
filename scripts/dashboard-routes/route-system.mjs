import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LEVEL_ROLES = {
  9: "Инвестиционный стратег",
  8: "Архитектор институциональных решений",
  7: "Аналитик знаний",
  6: "Архитектор AI-систем",
  5: "Владелец продуктового контура",
  4: "Инженер инфраструктуры",
  3: "Архитектор профессиональной позиции",
  2: "Аналитик размещения",
  1: "Аналитик ресурсных ограничений",
};

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonical(item)]));
}

export function stableRouteSourceId(surface, sourceName, discriminator = "") {
  const input = `${surface}|${discriminator}|${sourceName}`.normalize("NFKC").trim().toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const slug = sourceName.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 42) || "entry";
  return `${surface.replace(/^dashboard-/, "")}:${slug}-${(hash >>> 0).toString(36)}`;
}

export function sourceFingerprint(source) {
  return createHash("sha256").update(JSON.stringify(canonical({
    surface: source.surface,
    sourceName: source.sourceName,
    sourceText: source.sourceText,
    level: source.level,
    from: source.from,
    to: source.to,
  }))).digest("hex").slice(0, 20);
}

function sourcePriority(source) {
  const surfaceScore = {
    "dashboard-focus": 100,
    "dashboard-shift": 80,
    "dashboard-trend": 70,
    "dashboard-insight": 65,
    "dashboard-news": 50,
  }[source.surface] ?? 0;
  return surfaceScore + Number(source.level ?? 0);
}

export function discoverDashboardEntries(report) {
  const entries = [];
  const reportDate = report.date ?? report.reportDate ?? "";
  const levels = Array.isArray(report.srt_levels) ? report.srt_levels : [];
  const events = levels.flatMap((level) => (level.events ?? []).map((event) => ({
    surface: "dashboard-news",
    sourceName: event.title,
    sourceText: event.description || event.summary || event.title,
    level: Number(level.level),
    reportDate,
    sources: event.sources ?? [],
  }))).filter((entry) => entry.sourceName);

  events.forEach((entry) => entries.push(entry));

  const focusEvent = events[3] ?? events[0];
  if (focusEvent) {
    entries.push({
      ...focusEvent,
      surface: "dashboard-focus",
      sourceId: "daily-focus-action",
      sourceName: "Фокус действия",
      sourceText: focusEvent.sourceName,
    });
  }

  const trends = Array.isArray(report.trends) ? report.trends : [];
  trends.filter((trend) => trend?.name).forEach((trend) => entries.push({
    surface: "dashboard-trend",
    sourceName: trend.name,
    sourceText: trend.rationale || trend.description || trend.name,
    level: Number(trend.levels?.[0] ?? 6),
    reportDate,
    momentum: trend.momentum,
    sources: trend.sources ?? [],
  }));

  const shifts = Array.isArray(report.structural_shifts) ? report.structural_shifts : [];
  shifts.filter((shift) => shift?.title || (shift?.from && shift?.to)).forEach((shift, index) => entries.push({
    surface: "dashboard-shift",
    sourceName: shift.title || `Структурный сдвиг ${index + 1}`,
    sourceText: shift.through || shift.mechanism || `${shift.from} → ${shift.to}`,
    level: Number(shift.levels?.[0] ?? 8),
    reportDate,
    from: shift.from,
    to: shift.to,
    sources: shift.sources ?? [],
  }));

  const insights = Array.isArray(report.strategic_insights) ? report.strategic_insights : [];
  insights.filter((insight) => insight?.title).forEach((insight) => entries.push({
    surface: "dashboard-insight",
    sourceName: insight.title,
    sourceText: insight.summary || insight.description || insight.title,
    level: Number(insight.srtLevels?.[0] ?? insight.levels?.[0] ?? 8),
    reportDate,
    sources: insight.sources ?? [],
  }));

  return entries.map((entry) => {
    const discriminator = entry.surface === "dashboard-focus" ? "" : String(entry.level ?? "");
    const sourceId = entry.sourceId ?? stableRouteSourceId(entry.surface, entry.sourceName, discriminator);
    const normalized = { ...entry, sourceId };
    return { ...normalized, sourceFingerprint: sourceFingerprint(normalized), priority: sourcePriority(normalized) };
  }).sort((left, right) => right.priority - left.priority || left.sourceId.localeCompare(right.sourceId));
}

export function buildScenario(source, generatedAt = new Date().toISOString()) {
  const role = LEVEL_ROLES[source.level] ?? "Оператор продуктивного действия";
  const common = {
    surface: source.surface,
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    scenarioId: `${source.sourceId.replace(/[:]/g, "-")}-action`,
    version: 1,
    enabled: true,
    role,
    whyNow: source.sourceText || `Сигнал «${source.sourceName}» уже обнаружен; следующий прирост возникает только после проверки действием.`,
    position: role,
    object: source.sourceName,
    recipientRole: "Владелец затронутого процесса",
    starterInputs: ["Материал выбранной карточки", "Один процесс или решение, на которое влияет сигнал"],
    prerequisites: ["Доступ к исходным данным", "Возможность связаться с владельцем результата"],
    competencies: ["Интерпретация сигнала", "Постановка проверяемого действия", "Фиксация результата"],
    sourceFingerprint: source.sourceFingerprint,
    managedBy: "route-system",
    generatedAt,
  };

  if (source.surface === "dashboard-focus") return {
    ...common,
    scenarioId: "dashboard-decision-brief",
    role: "Лицо, принимающее решение",
    position: "Оператор стратегического действия",
    promise: "Превратить сигнал дня в решение и первый проверяемый шаг",
    artifact: "одностраничный decision brief с решением, адресатом и критерием результата",
    estimatedMinutes: 30,
    change: "Новость перестанет быть информацией и станет подготовленным манёвром ресурсов.",
    mission: "Сокращать время от значимого сигнала до первого действия из желаемой позиции.",
    successCriteria: ["Сформулировано одно решение", "Назван адресат результата", "Определён проверяемый шаг на ближайшие 24 часа"],
  };

  if (source.surface === "dashboard-trend") return {
    ...common,
    promise: `Проверить влияние тренда «${source.sourceName}» на один процесс`,
    artifact: "карта воздействия тренда и решение о коротком пилоте",
    estimatedMinutes: 45,
    change: "Тренд будет переведён из наблюдения в проверяемую гипотезу для конкретного процесса.",
    mission: "Отделять наблюдаемую динамику от воздействия, которое требует изменения процесса.",
    successCriteria: ["Назван затронутый процесс", "Сформулирована проверяемая гипотеза", "Назначен следующий шаг и его владелец"],
  };

  if (source.surface === "dashboard-shift") return {
    ...common,
    promise: `Спроектировать первый манёвр в направлении «${source.to || source.sourceName}»`,
    artifact: "карта перехода ОТ → К с первым действием, ресурсом и адресатом",
    estimatedMinutes: 60,
    change: "Структурный сдвиг станет основанием для конкретного манёвра ресурсов.",
    mission: "Сокращать время от понимания структурного перехода до изменения собственной позиции.",
    successCriteria: ["Зафиксирована исходная позиция", "Определён недостающий ресурс", "Первое действие принято владельцем результата"],
  };

  if (source.surface === "dashboard-insight") return {
    ...common,
    promise: `Превратить инсайт «${source.sourceName}» в решение`,
    artifact: "decision brief с решением, аргументом, адресатом и критерием результата",
    estimatedMinutes: 30,
    change: "Инсайт станет подготовленным решением, а не сохранённым наблюдением.",
    mission: "Преобразовывать аналитический вывод в решение с проверяемым эффектом.",
    successCriteria: ["Сформулировано одно решение", "Назван адресат", "Определён критерий эффекта"],
  };

  return {
    ...common,
    promise: `Превратить сигнал «${source.sourceName}» в решение и первый шаг`,
    artifact: "одностраничный action brief с решением, адресатом и действием на 24 часа",
    estimatedMinutes: 30,
    change: "Карточка перестанет быть прочитанной информацией и станет подготовленным действием.",
    mission: "Сокращать время от нового сигнала до первого проверяемого действия.",
    successCriteria: ["Сформулировано одно решение", "Назван адресат результата", "Определён шаг на ближайшие 24 часа"],
  };
}

export function validateScenarioRegistry(registry) {
  const errors = [];
  const ids = new Set();
  for (const [index, scenario] of (registry.scenarios ?? []).entries()) {
    const prefix = `scenarios[${index}]`;
    if (!scenario.surface || !scenario.sourceId || !scenario.scenarioId) errors.push(`${prefix}: отсутствует идентификатор`);
    if (ids.has(`${scenario.surface}:${scenario.sourceId}`)) errors.push(`${prefix}: дублируется источник ${scenario.sourceId}`);
    ids.add(`${scenario.surface}:${scenario.sourceId}`);
    if (!scenario.promise || !scenario.artifact || !scenario.mission) errors.push(`${prefix}: неполный продуктивный контракт`);
    if (!Number.isFinite(scenario.estimatedMinutes) || scenario.estimatedMinutes < 15 || scenario.estimatedMinutes > 480) errors.push(`${prefix}: время должно быть 15–480 минут`);
    for (const field of ["starterInputs", "prerequisites", "successCriteria", "competencies"]) {
      if (!Array.isArray(scenario[field]) || scenario[field].length < 2) errors.push(`${prefix}: ${field} должен содержать минимум 2 пункта`);
    }
    if (scenario.managedBy === "route-system" && !scenario.sourceFingerprint) errors.push(`${prefix}: отсутствует fingerprint источника`);
  }
  return errors;
}

export function createRoutePlan(report, existingRegistry = { scenarios: [] }, generatedAt = new Date().toISOString()) {
  const entries = discoverDashboardEntries(report);
  const existingByKey = new Map((existingRegistry.scenarios ?? []).map((scenario) => [`${scenario.surface}:${scenario.sourceId}`, scenario]));
  const jobs = entries.map((source) => {
    const existing = existingByKey.get(`${source.surface}:${source.sourceId}`);
    const state = !existing
      ? "new"
      : existing.managedBy === "manual" || existing.sourceFingerprint === source.sourceFingerprint
        ? "current"
        : "stale";
    return { state, source, scenario: state === "current" ? existing : buildScenario(source, generatedAt) };
  });
  return {
    schemaVersion: "1.0",
    generatedAt,
    reportDate: report.date ?? null,
    stats: {
      discovered: entries.length,
      new: jobs.filter((job) => job.state === "new").length,
      stale: jobs.filter((job) => job.state === "stale").length,
      current: jobs.filter((job) => job.state === "current").length,
    },
    jobs,
  };
}

export function compileRegistry(plan, existingRegistry = { scenarios: [] }) {
  const manual = (existingRegistry.scenarios ?? []).filter((scenario) => scenario.managedBy === "manual");
  const generated = plan.jobs.map((job) => job.scenario);
  const generatedKeys = new Set(generated.map((scenario) => `${scenario.surface}:${scenario.sourceId}`));
  const scenarios = [
    ...manual.filter((scenario) => !generatedKeys.has(`${scenario.surface}:${scenario.sourceId}`)),
    ...generated,
  ].sort((left, right) => left.surface.localeCompare(right.surface) || left.sourceId.localeCompare(right.sourceId));
  const contentChanged = JSON.stringify(canonical(existingRegistry.scenarios ?? [])) !== JSON.stringify(canonical(scenarios));
  const registry = {
    schemaVersion: "1.1",
    updatedAt: contentChanged || !existingRegistry.updatedAt ? plan.generatedAt : existingRegistry.updatedAt,
    scenarios,
  };
  const errors = validateScenarioRegistry(registry);
  if (errors.length) throw new Error(`Route QA failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return registry;
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function atomicWriteJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, filePath);
}

export async function runRouteSystem({ reportPath, registryPath, mode = "plan" }) {
  const baseReport = await readJson(reportPath);
  if (!baseReport) throw new Error(`Не найден отчёт: ${reportPath}`);
  const insightsRegistry = await readJson(path.join(path.dirname(reportPath), "insights.json"), null);
  const report = Array.isArray(insightsRegistry?.insights)
    ? { ...baseReport, strategic_insights: insightsRegistry.insights }
    : baseReport;
  const existing = await readJson(registryPath, { schemaVersion: "1.1", updatedAt: "", scenarios: [] });
  const generatedAt = new Date().toISOString();
  const plan = createRoutePlan(report, existing, generatedAt);
  const registry = compileRegistry(plan, existing);
  if (mode === "publish" || mode === "run") await atomicWriteJson(registryPath, registry);
  return { plan, registry, published: mode === "publish" || mode === "run" };
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  const [mode = "plan", reportArg = "data/latest-report.json", registryArg = "client/src/data/ekenScenarios.json"] = process.argv.slice(2);
  if (!["plan", "publish", "run"].includes(mode)) {
    console.error("Usage: node scripts/dashboard-routes/route-system.mjs <plan|publish|run> [report.json] [registry.json]");
    process.exit(1);
  }
  const result = await runRouteSystem({ reportPath: path.resolve(reportArg), registryPath: path.resolve(registryArg), mode });
  console.log(JSON.stringify({ ...result.plan.stats, reportDate: result.plan.reportDate, published: result.published, registry: path.resolve(registryArg) }, null, 2));
}
