export type PositionIntent = "expert" | "business" | "invest";

export interface PositionRoute {
  id: string;
  level: number;
  title: string;
  description: string;
  window: string;
  whyNow: string;
  intents: PositionIntent[];
  position: string;
  resourceMatchPercent: number;
  mission: string;
  object: string;
  result: string;
  firstAction: string;
  recipientRole: string;
  output: string;
  acceptanceCriterion: string;
  resourceGap: {
    title: string;
    description: string;
    estimatedMinutes: number;
    artifact: string;
  };
  arsenal: {
    platforms: string[];
    competencies: string[];
    communicationVenues: string[];
    accesses: string[];
    norms: string[];
  };
  evidence: string[];
  timeToActionMinutes: number;
}

export const POSITION_ROUTES: PositionRoute[] = [
  {
    id: "ai-agent-audit",
    level: 3,
    title: "Аудит и кураторство AI-агентов",
    description: "Независимый контроль автономных систем в процессах с высокой ценой ошибки.",
    window: "Открыто",
    whyNow: "Компании уже запускают агентов, но ещё не собрали независимый контур контроля.",
    intents: ["expert", "business"],
    position: "Аудитор AI-агентов",
    resourceMatchPercent: 78,
    mission: "Проверить поведение, разрешения и риски работающего AI-агента и передать владельцу процесса доказанный вывод.",
    object: "AI-агент обработки клиентских обращений в n8n",
    result: "Один доказанный риск признан владельцем процесса и взят в устранение.",
    firstAction: "Проверить операции записи и три последних лога выполнения.",
    recipientRole: "Владелец клиентского процесса",
    output: "Заключение об одном доказанном риске",
    acceptanceCriterion: "Риск признан и изменение взято в работу",
    resourceGap: {
      title: "Технический чек-лист аудита AI-агента",
      description: "Позволяет доказать риск на конфигурации и логах, а не на предположении.",
      estimatedMinutes: 18,
      artifact: "Заполненный чек-лист и найденное нарушение",
    },
    arsenal: {
      platforms: ["n8n workflow"],
      competencies: ["аудит разрешений", "анализ execution logs", "AI risk"],
      communicationVenues: ["рабочая группа AI governance"],
      accesses: ["конфигурация workflow", "3 лога выполнения"],
      norms: ["NIST AI RMF", "EU AI Act"],
    },
    evidence: ["конфигурация workflow", "3 лога выполнения", "заключение об одном риске"],
    timeToActionMinutes: 90,
  },
  {
    id: "agentic-migration",
    level: 3,
    title: "Миграция процессов на AI-агентов",
    description: "Перестройка статического процесса в управляемый агентный контур.",
    window: "Сужается",
    whyNow: "Ранние интеграторы закрепляют доступ к корпоративным процессам и данным.",
    intents: ["business", "expert"],
    position: "Архитектор агентного процесса",
    resourceMatchPercent: 69,
    mission: "Пересобрать один рабочий процесс под AI-агента, сохранив границы решений и человеческое подтверждение.",
    object: "Процесс обработки входящих заявок",
    result: "Ограниченный пилот одобрен, владелец результата назначен.",
    firstAction: "Зафиксировать вход процесса, порог эскалации и точку ручного подтверждения.",
    recipientRole: "Владелец операционной функции",
    output: "Схема ограниченного агентного пилота",
    acceptanceCriterion: "Пилот одобрен и назначен владелец результата",
    resourceGap: {
      title: "Карта ответственности агентного процесса",
      description: "Фиксирует, что агент делает сам и где обязан запросить подтверждение.",
      estimatedMinutes: 25,
      artifact: "RACI агента и точка ручного подтверждения",
    },
    arsenal: {
      platforms: ["n8n", "LangGraph"],
      competencies: ["декомпозиция процесса", "agent orchestration", "human-in-the-loop"],
      communicationVenues: ["канал владельцев операций"],
      accesses: ["карта процесса", "5 execution traces"],
      norms: ["SOP процесса", "ISO 42001"],
    },
    evidence: ["карта текущего процесса", "точка human review", "схема пилота"],
    timeToActionMinutes: 180,
  },
  {
    id: "vertical-finance-ai",
    level: 5,
    title: "Вертикальные AI-агенты в финансах",
    description: "Специализированные агенты для инвестиционного анализа и проверки гипотез.",
    window: "Открыто",
    whyNow: "Институциональные команды тестируют узких агентов до фиксации стандартов рынка.",
    intents: ["invest", "business"],
    position: "Оператор финансового AI-агента",
    resourceMatchPercent: 72,
    mission: "Проверить инвестиционную гипотезу специализированным агентом и передать аналитику воспроизводимое заключение.",
    object: "Гипотеза по сектору AI infrastructure",
    result: "Гипотеза принята в аналитический пайплайн для ручной проверки.",
    firstAction: "Собрать контрольный датасет и определить период backtest без утечки будущих данных.",
    recipientRole: "Ведущий инвестиционный аналитик",
    output: "Воспроизводимая инвестиционная записка",
    acceptanceCriterion: "Гипотеза включена в следующий инвестиционный разбор",
    resourceGap: {
      title: "Контрольный датасет для backtest",
      description: "Отделяет сигнал агента от ошибки данных и смещения периода.",
      estimatedMinutes: 22,
      artifact: "Очищенный датасет и воспроизводимый backtest",
    },
    arsenal: {
      platforms: ["аналитический notebook", "FinAgent"],
      competencies: ["backtesting", "контроль look-ahead bias", "оценка риска"],
      communicationVenues: ["investment research workspace"],
      accesses: ["рыночные данные", "первичные источники"],
      norms: ["инвестиционный мандат"],
    },
    evidence: ["backtest", "первичные источники", "инвестиционная записка"],
    timeToActionMinutes: 120,
  },
  {
    id: "agent-memory",
    level: 6,
    title: "Жизненный цикл памяти AI-агентов",
    description: "Хранение, забывание и контроль контекста долго работающих агентов.",
    window: "Открыто",
    whyNow: "Стандарт ещё не сложился, а число долго работающих агентов быстро растёт.",
    intents: ["expert", "invest"],
    position: "Архитектор памяти агентов",
    resourceMatchPercent: 66,
    mission: "Задать проверяемую политику памяти и доказать её качество на длительном выполнении.",
    object: "AI-агент поддержки с memory layer",
    result: "Политика памяти принята в технический backlog владельца платформы.",
    firstAction: "Определить срок хранения, правило забывания и сценарий десяти длительных прогонов.",
    recipientRole: "Владелец агентной платформы",
    output: "Проверяемая политика памяти агента",
    acceptanceCriterion: "Политика принята в технический backlog",
    resourceGap: {
      title: "Протокол тестирования памяти",
      description: "Показывает, что агент хранит нужное, удаляет лишнее и не смешивает контексты.",
      estimatedMinutes: 30,
      artifact: "Retention policy и тест деградации памяти",
    },
    arsenal: {
      platforms: ["vector store", "memory middleware"],
      competencies: ["контекстные хранилища", "retention design", "long-run testing"],
      communicationVenues: ["команда agent infrastructure"],
      accesses: ["тестовый автономный агент", "10 long-run traces"],
      norms: ["политика хранения данных"],
    },
    evidence: ["10 long-run traces", "тест деградации", "политика хранения"],
    timeToActionMinutes: 240,
  },
];

export interface EkenPositionRouteV1 {
  schemaVersion: "1.0";
  routeId: string;
  createdAt: string;
  locale: "ru";
  intent: PositionIntent;
  place: { id: string; name: string; level: number; whyNow: string };
  position: { name: string; mission: string; resourceMatchPercent: number; desiredResult: string };
  firstAction: { title: string; object: string; recipientRole: string; output: string; acceptanceCriterion: string; estimatedMinutes: number };
  resourceGap: PositionRoute["resourceGap"];
  arsenal: PositionRoute["arsenal"];
}

function newRouteId() {
  return globalThis.crypto?.randomUUID?.() ?? `route-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildEkenPayload(route: PositionRoute, intent: PositionIntent): EkenPositionRouteV1 {
  return {
    schemaVersion: "1.0",
    routeId: newRouteId(),
    createdAt: new Date().toISOString(),
    locale: "ru",
    intent,
    place: { id: route.id, name: route.title, level: route.level, whyNow: route.whyNow },
    position: {
      name: route.position,
      mission: route.mission,
      resourceMatchPercent: route.resourceMatchPercent,
      desiredResult: route.result,
    },
    firstAction: {
      title: route.firstAction,
      object: route.object,
      recipientRole: route.recipientRole,
      output: route.output,
      acceptanceCriterion: route.acceptanceCriterion,
      estimatedMinutes: route.timeToActionMinutes,
    },
    resourceGap: route.resourceGap,
    arsenal: route.arsenal,
  };
}

export function buildEkenUrl(payload: EkenPositionRouteV1) {
  return `https://app.ekenlab.com/integrations/verkhovskiy#route=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function buildBriefText(route: PositionRoute, intent: PositionIntent) {
  const intentLabels: Record<PositionIntent, string> = {
    expert: "Применить компетенцию",
    business: "Запустить продукт",
    invest: "Найти инвестиционную возможность",
  };

  return [
    "БРИФ ПОЗИЦИИ · VERKHOVSKIY.AI → EKEN",
    "",
    `Намерение: ${intentLabels[intent]}`,
    `Место: СРТ-${route.level} · ${route.title}`,
    `Позиция: ${route.position}`,
    `Объект: ${route.object}`,
    "",
    `Миссия: ${route.mission}`,
    `Желаемый результат: ${route.result}`,
    `Первое действие: ${route.firstAction}`,
    `Время до первого действия: ${route.timeToActionMinutes} мин`,
    "",
    `Платформы: ${route.arsenal.platforms.join("; ")}`,
    `Компетенции: ${route.arsenal.competencies.join("; ")}`,
    `Доступы: ${route.arsenal.accesses.join("; ")}`,
    `Нормы: ${route.arsenal.norms.join("; ")}`,
    `Ресурсный разрыв: ${route.resourceGap.title} — ${route.resourceGap.artifact}`,
    `Доказательства результата: ${route.evidence.join("; ")}`,
    "",
    "Задача для Eken: собрать короткий учебно-производственный маршрут, который помогает выполнить первое действие и получить указанные доказательства результата.",
  ].join("\n");
}
