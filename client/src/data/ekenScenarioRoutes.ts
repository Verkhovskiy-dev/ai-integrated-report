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
}

export interface EkenScenarioRegistry {
  schemaVersion: "1.0";
  updatedAt: string;
  scenarios: EkenProductiveScenario[];
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

export function buildDashboardFocusEkenPayload(
  actionText: string,
  reportDate: string,
  scenario: EkenProductiveScenario = DASHBOARD_FOCUS_FALLBACK,
) {
  return {
    schemaVersion: "1.0",
    routeId: newScenarioRouteId(scenario.scenarioId),
    createdAt: new Date().toISOString(),
    locale: "ru",
    intent: "business",
    place: {
      id: `dashboard:${scenario.sourceId}`,
      name: `Дашборд · ${scenario.sourceName}`,
      level: 8,
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
      object: `${actionText} (сводка ${reportDate})`,
      recipientRole: scenario.recipientRole,
      output: scenario.artifact,
      acceptanceCriterion: scenario.successCriteria.join("; "),
      estimatedMinutes: scenario.estimatedMinutes,
    },
    resourceGap: {
      title: "Decision brief по сигналу дня",
      description: scenario.change,
      estimatedMinutes: scenario.estimatedMinutes,
      artifact: scenario.artifact,
    },
    arsenal: {
      platforms: ["Verkhovskiy.ai", "EkenLab"],
      competencies: scenario.competencies,
      communicationVenues: ["Рабочий контур владельца решения"],
      accesses: scenario.prerequisites,
      norms: ["Одно решение", "Один адресат", "Один проверяемый шаг"],
    },
  };
}

export function buildEkenScenarioUrl(payload: ReturnType<typeof buildDashboardFocusEkenPayload>) {
  return `https://app.ekenlab.com/integrations/verkhovskiy#route=${encodeURIComponent(JSON.stringify(payload))}`;
}
