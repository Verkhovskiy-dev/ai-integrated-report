export interface EkenProductiveScenario {
  surface: string;
  sourceId: string;
  sourceName: string;
  scenarioId: string;
  version: number;
  enabled: boolean;
  role: string;
  promise: string;
  artifact: string;
  estimatedMinutes: number;
  change: string;
  whyNow: string;
  position: string;
  mission: string;
  object: string;
  recipientRole: string;
  starterInputs: string[];
  prerequisites: string[];
  successCriteria: string[];
  competencies: string[];
  sourceFingerprint?: string;
  managedBy?: "manual" | "route-system";
  generatedAt?: string;
}

export interface EkenScenarioRegistry {
  schemaVersion: "1.0" | "1.1";
  updatedAt: string;
  scenarios: EkenProductiveScenario[];
}

export type DashboardRouteSurface =
  | "dashboard-focus"
  | "dashboard-news"
  | "dashboard-trend"
  | "dashboard-shift"
  | "dashboard-insight";

export interface DashboardRouteSource {
  surface: DashboardRouteSurface;
  sourceId?: string;
  sourceName: string;
  sourceText?: string;
  level?: number;
  reportDate?: string;
  from?: string;
  to?: string;
}

export const DASHBOARD_FOCUS_FALLBACK: EkenProductiveScenario = {
  surface: "dashboard-focus",
  sourceId: "daily-focus-action",
  sourceName: "Фокус действия",
  scenarioId: "dashboard-decision-brief",
  version: 1,
  enabled: true,
  role: "Лицо, принимающее решение",
  promise: "Превратить сигнал дня в решение и первый проверяемый шаг",
  artifact: "одностраничный decision brief с решением, адресатом и критерием результата",
  estimatedMinutes: 30,
  change: "Новость перестанет быть информацией и станет подготовленным манёвром ресурсов.",
  whyNow: "Ценность сигнала быстро снижается, если не определить решение, адресата и ближайшее действие.",
  position: "Оператор стратегического действия",
  mission: "Сокращать время от значимого сигнала до первого действия из желаемой позиции.",
  object: "Текущий фокус действия дашборда",
  recipientRole: "Владелец затронутого процесса",
  starterInputs: ["Сигнал или событие из сводки дня", "Желаемое изменение позиции"],
  prerequisites: ["Понимание, кто может принять результат", "30 минут на подготовку первого шага"],
  successCriteria: [
    "Сформулировано одно решение",
    "Назван адресат результата",
    "Определён проверяемый шаг на ближайшие 24 часа",
  ],
  competencies: ["Интерпретация сигнала", "Формулирование решения", "Проектирование первого действия"],
};

function newScenarioRouteId(scenarioId: string) {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `dashboard-${scenarioId}-${suffix}`;
}

export function stableRouteSourceId(surface: string, sourceName: string, discriminator = "") {
  const input = `${surface}|${discriminator}|${sourceName}`.normalize("NFKC").trim().toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const slug = sourceName
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "entry";
  return `${surface.replace(/^dashboard-/, "")}:${slug}-${(hash >>> 0).toString(36)}`;
}

const LEVEL_ROLES: Record<number, string> = {
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

export function buildDefaultDashboardScenario(source: DashboardRouteSource): EkenProductiveScenario {
  const sourceId = source.sourceId ?? stableRouteSourceId(source.surface, source.sourceName, String(source.level ?? ""));
  const role = LEVEL_ROLES[source.level ?? 0] ?? "Оператор продуктивного действия";
  const common = {
    surface: source.surface,
    sourceId,
    sourceName: source.sourceName,
    scenarioId: `${sourceId.replace(/[:]/g, "-")}-action`,
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
    managedBy: "route-system" as const,
  };

  if (source.surface === "dashboard-trend") {
    return {
      ...common,
      promise: `Проверить влияние тренда «${source.sourceName}» на один процесс`,
      artifact: "карта воздействия тренда и решение о коротком пилоте",
      estimatedMinutes: 45,
      change: "Тренд будет переведён из наблюдения в проверяемую гипотезу для конкретного процесса.",
      mission: "Отделять наблюдаемую динамику от воздействия, которое требует изменения процесса.",
      successCriteria: ["Назван затронутый процесс", "Сформулирована проверяемая гипотеза", "Назначен следующий шаг и его владелец"],
    };
  }

  if (source.surface === "dashboard-shift") {
    return {
      ...common,
      promise: `Спроектировать первый манёвр в направлении «${source.to || source.sourceName}»`,
      artifact: "карта перехода ОТ → К с первым действием, ресурсом и адресатом",
      estimatedMinutes: 60,
      change: "Структурный сдвиг станет основанием для конкретного манёвра ресурсов.",
      mission: "Сокращать время от понимания структурного перехода до изменения собственной позиции.",
      successCriteria: ["Зафиксирована исходная позиция", "Определён недостающий ресурс", "Первое действие принято владельцем результата"],
    };
  }

  if (source.surface === "dashboard-insight") {
    return {
      ...common,
      promise: `Превратить инсайт «${source.sourceName}» в решение`,
      artifact: "decision brief с решением, аргументом, адресатом и критерием результата",
      estimatedMinutes: 30,
      change: "Инсайт станет подготовленным решением, а не сохранённым наблюдением.",
      mission: "Преобразовывать аналитический вывод в решение с проверяемым эффектом.",
      successCriteria: ["Сформулировано одно решение", "Назван адресат", "Определён критерий эффекта"],
    };
  }

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

export function findDashboardScenario(
  registry: EkenScenarioRegistry | null | undefined,
  source: DashboardRouteSource,
) {
  const sourceId = source.sourceId ?? stableRouteSourceId(source.surface, source.sourceName, String(source.level ?? ""));
  return registry?.scenarios.find((item) => item.enabled && item.surface === source.surface && item.sourceId === sourceId)
    ?? buildDefaultDashboardScenario({ ...source, sourceId });
}

export function buildScenarioEkenPayload(source: DashboardRouteSource, scenario: EkenProductiveScenario) {
  const contextText = source.sourceText || source.sourceName;
  return {
    schemaVersion: "1.0",
    routeId: newScenarioRouteId(scenario.scenarioId),
    createdAt: new Date().toISOString(),
    locale: "ru",
    intent: "business",
    place: {
      id: `dashboard:${scenario.sourceId}`,
      name: `Дашборд · ${scenario.sourceName}`,
      level: source.level ?? 8,
      whyNow: scenario.whyNow,
    },
    position: {
      name: scenario.position,
      mission: scenario.mission,
      resourceMatchPercent: 60,
      desiredResult: scenario.artifact,
    },
    firstAction: {
      title: scenario.promise,
      object: source.reportDate ? `${contextText} (сводка ${source.reportDate})` : contextText,
      recipientRole: scenario.recipientRole,
      output: scenario.artifact,
      acceptanceCriterion: scenario.successCriteria.join("; "),
      estimatedMinutes: scenario.estimatedMinutes,
    },
    resourceGap: {
      title: scenario.artifact,
      description: scenario.change,
      estimatedMinutes: scenario.estimatedMinutes,
      artifact: scenario.artifact,
    },
    arsenal: {
      platforms: ["Verkhovskiy.ai", "EkenLab"],
      competencies: scenario.competencies,
      communicationVenues: ["Рабочий контур владельца решения"],
      accesses: scenario.prerequisites,
      norms: ["Один результат", "Один адресат", "Один проверяемый критерий"],
    },
    source: {
      surface: scenario.surface,
      sourceId: scenario.sourceId,
      sourceFingerprint: scenario.sourceFingerprint,
    },
  };
}

export function buildDashboardFocusEkenPayload(
  actionText: string,
  reportDate: string,
  scenario: EkenProductiveScenario = DASHBOARD_FOCUS_FALLBACK,
) {
  return buildScenarioEkenPayload({
    surface: "dashboard-focus",
    sourceId: scenario.sourceId,
    sourceName: scenario.sourceName,
    sourceText: actionText,
    reportDate,
    level: 8,
  }, scenario);
}

export function buildEkenScenarioUrl(payload: ReturnType<typeof buildDashboardFocusEkenPayload>) {
  return `https://app.ekenlab.com/integrations/verkhovskiy#route=${encodeURIComponent(JSON.stringify(payload))}`;
}
