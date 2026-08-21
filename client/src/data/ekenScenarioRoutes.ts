import { z } from "zod";

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
  recommendedIntent?: LearningRouteIntent;
  instrumentKind?: LearningInstrumentKind;
  existingTool?: string;
  sourceFingerprint?: string;
  managedBy?: "manual" | "route-system";
  generatedAt?: string;
}

export type LearningRouteIntent =
  | "build_tool"
  | "master_tool"
  | "improve_tool"
  | "choose_tool"
  | "enter_position"
  | "team_adoption";

export type LearningInstrumentKind =
  | "agent"
  | "workflow"
  | "assistant"
  | "platform"
  | "method"
  | "position";

export interface LearningBriefDraft {
  intent: LearningRouteIntent;
  title: string;
  objective: string;
  realInput: string;
  successCriterion: string;
  constraints: string[];
  instrumentName: string;
  instrumentKind: LearningInstrumentKind;
  existingTool?: string;
}

export const verkhovskiyHandoffV2Schema = z.object({
  schemaVersion: z.literal("2.0"),
  routeId: z.string().min(1).max(160).regex(/^[A-Za-z0-9._:-]+$/),
  scenarioId: z.string().min(1).max(160),
  source: z.object({
    surface: z.enum(["hero", "event", "insight", "trend", "model", "position"]),
    sourceId: z.string().min(1).max(200),
    title: z.string().trim().min(1).max(500),
    url: z.string().url().max(2_000),
    reportDate: z.string().date(),
  }),
  audience: z.object({
    viewMode: z.enum(["expert", "executive"]),
    role: z.string().trim().min(1).max(200).optional(),
    locale: z.enum(["ru", "en"]),
  }),
  brief: z.object({
    objective: z.string().trim().min(1).max(4_000),
    expectedArtifact: z.string().trim().min(1).max(4_000),
    recipient: z.string().trim().min(1).max(500),
    acceptanceCriterion: z.string().trim().min(1).max(4_000),
    estimatedMinutes: z.number().int().positive().max(24 * 60),
    evidence: z.array(z.string().trim().min(1).max(2_000)).max(20),
  }),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
}).superRefine((payload, context) => {
  if (Date.parse(payload.expiresAt) <= Date.parse(payload.createdAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "expiresAt must be later than createdAt",
    });
  }
});

export type EkenLearningRouteV2 = z.infer<typeof verkhovskiyHandoffV2Schema>;

export interface LocalLearningRoutePlan {
  title: string;
  intentLabel: string;
  outcome: string;
  steps: Array<{ title: string; description: string }>;
  text: string;
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
  viewMode?: "expert" | "executive";
  audienceRole?: string;
  locale?: "ru" | "en";
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
  const safeScenarioId = scenarioId
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "scenario";
  return `dashboard-${safeScenarioId}-${suffix}`;
}

export const LEARNING_INTENT_COPY: Record<LearningRouteIntent, { label: string; hint: string }> = {
  build_tool: { label: "Создать инструмент", hint: "Собрать рабочий AI-сценарий под повторяемую задачу" },
  master_tool: { label: "Освоить инструмент", hint: "Научиться пользоваться им на полезном результате" },
  improve_tool: { label: "Улучшить инструмент", hint: "Найти слабое место и доказать прирост качества" },
  choose_tool: { label: "Выбрать инструмент", hint: "Сравнить варианты на одном реальном примере" },
  enter_position: { label: "Освоить позицию", hint: "Выполнить первое доказанное действие из позиции" },
  team_adoption: { label: "Встроить в команду", hint: "Запустить инструмент в процессе с владельцем и контролем" },
};

function intentObjective(intent: LearningRouteIntent, scenario: EkenProductiveScenario) {
  const action = scenario.promise.toLowerCase();
  switch (intent) {
    case "master_tool":
      return `Освоить AI-инструмент через реальный результат: ${action}`;
    case "improve_tool":
      return `Улучшить существующий AI-инструмент и доказать прирост на задаче: ${action}`;
    case "choose_tool":
      return `Сравнить AI-инструменты на одном реальном примере и выбрать подходящий для задачи: ${action}`;
    case "enter_position":
      return `Выполнить первое доказанное действие из позиции «${scenario.position}»: ${action}`;
    case "team_adoption":
      return `Встроить AI-инструмент в командный процесс с владельцем и контролем: ${action}`;
    default:
      return `Создать AI-инструмент, который помогает: ${action}`;
  }
}

export function learningOutcomeForIntent(intent: LearningRouteIntent, scenario: EkenProductiveScenario) {
  switch (intent) {
    case "master_tool":
      return `рабочий результат, созданный выбранным инструментом, и повторяемый сценарий его использования: ${scenario.artifact}`;
    case "improve_tool":
      return `улучшенная версия инструмента и сравнение «до / после» на реальном примере: ${scenario.artifact}`;
    case "choose_tool":
      return `сравнение вариантов, обоснованный выбор и минимальный прототип: ${scenario.artifact}`;
    case "enter_position":
      return `первое принятое действие из позиции и доказательство результата: ${scenario.artifact}`;
    case "team_adoption":
      return `рабочий командный процесс с владельцем, ручным контролем и проверенным результатом: ${scenario.artifact}`;
    default:
      return `рабочий AI-сценарий и проверенный результат: ${scenario.artifact}`;
  }
}

export function buildLearningBriefDraft(
  source: DashboardRouteSource,
  scenario: EkenProductiveScenario,
): LearningBriefDraft {
  const input = source.sourceText?.trim() || `Карточка «${source.sourceName}» и один реальный пример из моего процесса`;
  const isInsightDecision = source.surface === "dashboard-insight";
  return {
    intent: scenario.recommendedIntent ?? "build_tool",
    title: isInsightDecision ? `Решение: ${scenario.sourceName}` : `Создать инструмент: ${scenario.sourceName}`,
    objective: isInsightDecision
      ? `Подготовить одно решение по инсайту «${scenario.sourceName}» и определить, кому его передать`
      : intentObjective(scenario.recommendedIntent ?? "build_tool", scenario),
    realInput: isInsightDecision ? "" : input,
    successCriterion: scenario.successCriteria.join("; "),
    constraints: ["Первый рабочий результат на реальном примере", "Ручное подтверждение перед внешним действием"],
    instrumentName: isInsightDecision ? `Decision brief · ${scenario.sourceName}` : `AI-инструмент · ${scenario.sourceName}`,
    instrumentKind: isInsightDecision ? "method" : scenario.instrumentKind ?? "workflow",
    existingTool: scenario.existingTool,
  };
}

export function buildExecutiveRoleTrackDraft(
  source: DashboardRouteSource,
  scenario: EkenProductiveScenario,
  role: "CEO" | "CTO" | "CDO",
  recommendation: string,
): LearningBriefDraft {
  const objective = recommendation.trim();
  if (!objective) throw new Error(`Executive recommendation for ${role} is required`);
  const draft = buildLearningBriefDraft(source, scenario);
  return {
    ...draft,
    title: `Трек ${role}: ${scenario.sourceName}`,
    objective,
    realInput: objective,
    successCriterion: `Сформулирован первый шаг для ${role}; определён ожидаемый результат и критерий приёмки`,
    instrumentName: `Decision track · ${role} · ${scenario.sourceName}`,
  };
}

export function retargetLearningBriefDraft(
  draft: LearningBriefDraft,
  intent: LearningRouteIntent,
  scenario: EkenProductiveScenario,
): LearningBriefDraft {
  const kindByIntent: Partial<Record<LearningRouteIntent, LearningInstrumentKind>> = {
    master_tool: "platform",
    choose_tool: "platform",
    enter_position: "position",
    team_adoption: "workflow",
  };
  return {
    ...draft,
    intent,
    objective: intentObjective(intent, scenario),
    instrumentKind: kindByIntent[intent] ?? scenario.instrumentKind ?? "workflow",
  };
}

export function buildLocalLearningRoutePlan(
  source: DashboardRouteSource,
  scenario: EkenProductiveScenario,
  draft: LearningBriefDraft,
): LocalLearningRoutePlan {
  const isInsightDecision = source.surface === "dashboard-insight";
  const outcome = isInsightDecision ? scenario.artifact : learningOutcomeForIntent(draft.intent, scenario);
  const steps = isInsightDecision ? [
    {
      title: "Уточнить контекст решения",
      description: draft.realInput,
    },
    {
      title: "Сформулировать решение и адресата",
      description: draft.objective,
    },
    {
      title: "Зафиксировать критерий эффекта",
      description: draft.successCriterion,
    },
  ] : [
    {
      title: "Подготовить реальный вход",
      description: draft.realInput,
    },
    {
      title: "Собрать минимальную рабочую версию",
      description: draft.objective,
    },
    {
      title: "Проверить и зафиксировать результат",
      description: draft.successCriterion,
    },
  ];
  const intentLabel = isInsightDecision ? "Подготовить решение" : LEARNING_INTENT_COPY[draft.intent].label;
  const text = [
    "МАРШРУТ ДЕЙСТВИЯ · VERKHOVSKIY.AI",
    "",
    `Сценарий: ${intentLabel}`,
    `Точка входа: ${source.sourceName}`,
    `Цель: ${draft.objective}`,
    `Ожидаемый результат: ${outcome}`,
    `Оценка времени: ${scenario.estimatedMinutes} мин`,
    "",
    ...steps.flatMap((step, index) => [
      `ШАГ ${index + 1}. ${step.title}`,
      step.description,
      "",
    ]),
    `Ограничения: ${draft.constraints.join("; ")}`,
  ].join("\n");

  return {
    title: draft.title,
    intentLabel,
    outcome,
    steps,
    text,
  };
}

export function buildLearningRoutePayload(
  source: DashboardRouteSource,
  scenario: EkenProductiveScenario,
  draft: LearningBriefDraft,
): EkenLearningRouteV2 {
  const sourceId = source.sourceId ?? scenario.sourceId;
  const createdAt = new Date();
  const surfaceMap: Record<DashboardRouteSurface, EkenLearningRouteV2["source"]["surface"]> = {
    "dashboard-focus": "hero",
    "dashboard-news": "event",
    "dashboard-trend": "trend",
    "dashboard-shift": "position",
    "dashboard-insight": "insight",
  };
  const payload = {
    schemaVersion: "2.0",
    routeId: newScenarioRouteId(scenario.scenarioId),
    scenarioId: scenario.scenarioId,
    source: {
      surface: surfaceMap[source.surface],
      sourceId,
      title: scenario.sourceName,
      url: typeof window === "undefined" ? "https://verkhovskiy.ai/" : window.location.href,
      reportDate: source.reportDate ?? createdAt.toISOString().slice(0, 10),
    },
    audience: {
      viewMode: source.viewMode ?? "expert",
      role: source.audienceRole ?? scenario.role,
      locale: source.locale ?? "ru",
    },
    brief: {
      objective: draft.objective,
      expectedArtifact: source.surface === "dashboard-insight"
        ? scenario.artifact
        : learningOutcomeForIntent(draft.intent, scenario),
      recipient: scenario.recipientRole,
      acceptanceCriterion: draft.successCriterion,
      estimatedMinutes: scenario.estimatedMinutes,
      evidence: [source.sourceText, draft.realInput, scenario.whyNow].filter((item): item is string => Boolean(item?.trim())),
    },
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 30 * 60 * 1_000).toISOString(),
  };
  return verkhovskiyHandoffV2Schema.parse(payload);
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
