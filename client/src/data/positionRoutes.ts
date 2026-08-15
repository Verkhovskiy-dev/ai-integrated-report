import { getPlaceIdsForPositionRoute } from "./ekenRouteRegistry";

export type PositionIntent = "expert" | "business" | "invest";

export interface SrtPlace {
  id: string;
  level: number;
  name: string;
  label: string;
  change: string;
  whyNow: string;
  window: string;
  productiveExit: string;
  evidence: string[];
}

const AI_CURATION_PLACE: SrtPlace = {
  id: "srt6-agent-governance-platforms",
  level: 6,
  name: "Платформы управления и аудита AI-агентов",
  label: "СРТ-6 · Платформы управления и аудита AI-агентов",
  change: "Автономным AI-агентам требуется контур мониторинга, ограничения и верификации действий в реальном времени.",
  whyNow: "Индустрия только начинает осознавать риски неуправляемых агентов, а стандарты надзора ещё не сформированы.",
  window: "Открыто",
  productiveExit: "Доказанный риск передан владельцу процесса и принят им в устранение.",
  evidence: [
    "Методология оценки рисков ИИ",
    "Юридическая экспертиза ответственности алгоритмов",
    "Доступ к высокорисковому индустриальному кейсу",
  ],
};

const AGENTIC_SOFTWARE_MIGRATION_PLACE: SrtPlace = {
  id: "srt6-ai-software-factories",
  level: 6,
  name: "AI-фабрики программного обеспечения",
  label: "СРТ-6 · AI-фабрики программного обеспечения",
  change: "AI берёт на себя архитектурную сложность создания программных продуктов, превращая разработку в управляемый производственный контур.",
  whyNow: "Связка LLM и генерации кода стала достаточно зрелой для коммерческого использования и ограниченных агентных пилотов.",
  window: "Открыто",
  productiveExit: "Ограниченный агентный пилот одобрен, а владелец результата назначен.",
  evidence: [
    "Карта действующего процесса",
    "Точка ручного подтверждения",
    "Доступ к execution traces",
  ],
};

const VERTICAL_FINANCE_AI_PLACE: SrtPlace = {
  id: "srt9-selective-ai-auditing",
  level: 9,
  name: "Селективный аудит и оценка ИИ-активов",
  label: "СРТ-9 · Селективный аудит и оценка ИИ-активов",
  change: "Инвесторы переходят от универсальных ставок на AI к проверке реальной выручки, маржинальности и устойчивости отдельных ИИ-бизнесов.",
  whyNow: "После стабилизации распродаж инвесторы ищут способы отделить подтверждённую экономику от хайпа и снизить риск решений.",
  window: "Открыто",
  productiveExit: "Проверенная инвестиционная гипотеза включена в аналитический пайплайн для ручной верификации.",
  evidence: [
    "Контрольный датасет",
    "Воспроизводимый backtest",
    "Доступ к первичным рыночным источникам",
  ],
};

const AGENT_MEMORY_LIFECYCLE_PLACE: SrtPlace = {
  id: "srt6-personal-agent-infrastructure",
  level: 6,
  name: "Инфраструктура персональных AI-агентов",
  label: "СРТ-6 · Инфраструктура персональных AI-агентов",
  change: "Персональным AI-агентам нужен надёжный слой памяти, приватности и длительной работы с данными пользователя.",
  whyNow: "Сегмент персональных ассистентов вошёл в фазу активной капитализации, но стандарты памяти и приватности ещё не закреплены.",
  window: "Открыто",
  productiveExit: "Проверяемая политика памяти принята в технический backlog владельца агентной платформы.",
  evidence: [
    "Тестовый автономный агент",
    "10 long-run traces",
    "Политика хранения и забывания",
  ],
};

export const SRT_PLACES: Record<string, SrtPlace> = {
  "3": AI_CURATION_PLACE,
  "srt6-agent-governance-platforms": AI_CURATION_PLACE,
  "srt6-ai-software-factories": AGENTIC_SOFTWARE_MIGRATION_PLACE,
  "srt9-selective-ai-auditing": VERTICAL_FINANCE_AI_PLACE,
  "srt6-personal-agent-infrastructure": AGENT_MEMORY_LIFECYCLE_PLACE,
};

export interface PositionRoute {
  id: string;
  sourcePlaceIds: string[];
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
  marketAnalysis?: {
    confidence: string;
    updatedAt: string;
    demandSignal: string;
    buyers: Array<{ title: string; need: string }>;
    geographies: Array<{ market: string; demand: string }>;
    compensation: Array<{ market: string; role: string; range: string }>;
    workModels: string[];
    sources: Array<{ label: string; url: string }>;
  };
}

export const POSITION_ROUTES: PositionRoute[] = [
  {
    id: "ai-agent-audit",
    sourcePlaceIds: getPlaceIdsForPositionRoute("ai-agent-audit"),
    level: 6,
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
    marketAnalysis: {
      confidence: "Средняя",
      updatedAt: "август 2026",
      demandSignal: "Функция уже выделяется в самостоятельные роли, но название и зона ответственности ещё не стандартизированы.",
      buyers: [
        { title: "Финансы и страхование", need: "Контроль моделей и агентов в решениях с финансовым и регуляторным риском." },
        { title: "Медицина и healthtech", need: "Human oversight, трассируемость выводов и независимая проверка безопасности." },
        { title: "Корпоративные AI-платформы", need: "Аудит разрешений, логов и границ автономности до масштабирования агентов." },
        { title: "Консалтинг и сертификация", need: "Проектные проверки, подготовка доказательств и внедрение AI governance." },
      ],
      geographies: [
        { market: "США", demand: "Крупнейший рынок найма; спрос сосредоточен в финансах, страховании, энергетике и enterprise AI." },
        { market: "ЕС", demand: "Регулируемые отрасли и поставщики high-risk AI; особенно Германия, Франция, Нидерланды и Ирландия." },
        { market: "Великобритания", demand: "Консалтинг, privacy/data governance, финтех и страхование; роли часто гибридные." },
      ],
      compensation: [
        { market: "США", role: "Core AI governance, mid-career", range: "$140–218 тыс. / год" },
        { market: "США", role: "AI auditor, mid-level", range: "$70–120 тыс. / год" },
        { market: "ЕС", role: "AI auditor, mid-level", range: "€50–90 тыс. / год" },
        { market: "Великобритания", role: "AI auditor, mid-level", range: "£32–54 тыс. / год" },
      ],
      workModels: ["Штатная функция AI governance", "Внутренний аудит / model risk", "Консалтинг по проекту", "Независимая оценка и сертификация"],
      sources: [
        { label: "AI Governance Salary Report 2026", url: "https://verifywise.ai/documents/ai-governance-salary-report-may-2026.pdf" },
        { label: "Barclay Simpson: AI Governance 2026", url: "https://www.barclaysimpson.com/salary-guides/2026-data-privacy-and-ai-governance-salary-guide/" },
        { label: "Avangrid: Sr Manager Data & AI Governance", url: "https://iberdrola.wd3.myworkdayjobs.com/en-US/Iberdrola/job/Sr-Manager---Data---AI-Governance_R-31470" },
      ],
    },
  },
  {
    id: "agentic-migration",
    sourcePlaceIds: getPlaceIdsForPositionRoute("agentic-migration"),
    level: 6,
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
    sourcePlaceIds: getPlaceIdsForPositionRoute("vertical-finance-ai"),
    level: 9,
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
    sourcePlaceIds: getPlaceIdsForPositionRoute("agent-memory"),
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

export function resolvePositionRoute(placeId: string, routeId?: string | null) {
  if (!SRT_PLACES[placeId]) return null;

  const matchingRoutes = POSITION_ROUTES.filter((route) => route.sourcePlaceIds.includes(placeId));
  if (routeId) return matchingRoutes.find((route) => route.id === routeId) ?? null;
  return matchingRoutes.length === 1 ? matchingRoutes[0] : null;
}

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
  selfAssessment?: {
    sourcePlace: string;
    readyCount: number;
    total: number;
    missing: string[];
  };
}

export function createPositionRouteId() {
  return globalThis.crypto?.randomUUID?.() ?? `route-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface EkenPayloadContext {
  routeId?: string;
  createdAt?: string;
  place?: SrtPlace;
}

export function buildEkenPayload(
  route: PositionRoute,
  intent: PositionIntent,
  selfAssessment?: EkenPositionRouteV1["selfAssessment"],
  context: EkenPayloadContext = {},
): EkenPositionRouteV1 {
  const place = context.place;
  return {
    schemaVersion: "1.0",
    routeId: context.routeId ?? createPositionRouteId(),
    createdAt: context.createdAt ?? new Date().toISOString(),
    locale: "ru",
    intent,
    place: place
      ? { id: place.id, name: place.name, level: place.level, whyNow: place.whyNow }
      : { id: route.id, name: route.title, level: route.level, whyNow: route.whyNow },
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
    ...(selfAssessment ? { selfAssessment } : {}),
  };
}

export function buildEkenUrl(payload: EkenPositionRouteV1) {
  return `https://app.ekenlab.com/integrations/verkhovskiy#route=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function buildBriefText(route: PositionRoute, intent: PositionIntent, place?: SrtPlace) {
  const intentLabels: Record<PositionIntent, string> = {
    expert: "Применить компетенцию",
    business: "Запустить продукт",
    invest: "Найти инвестиционную возможность",
  };

  return [
    "БРИФ ПОЗИЦИИ · VERKHOVSKIY.AI → EKEN",
    "",
    `Намерение: ${intentLabels[intent]}`,
    `Место: ${place?.label ?? `СРТ-${route.level} · ${route.title}`}`,
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
