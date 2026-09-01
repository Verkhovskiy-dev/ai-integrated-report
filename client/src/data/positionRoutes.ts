import { getPlaceIdsForPositionRoute } from "./ekenRouteRegistry";
import { buildEkenFragmentUrl } from "./ekenIntegrationUrl";

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
  id: "srt6-structural-verification-services",
  level: 6,
  name: "Сервисы структурной верификации AI-агентов",
  label: "СРТ-6 · Сервисы структурной верификации AI-агентов",
  change: "Автономным системам требуется внешний алгоритмический контроль, который доказывает безопасность действий, а не только проверяет результат постфактум.",
  whyNow: "Банки и государственный сектор готовят агентов к эксплуатации, но традиционные песочницы не дают достаточных гарантий.",
  window: "Открыто",
  productiveExit: "Доказанный риск передан владельцу процесса и принят им в устранение.",
  evidence: [
    "Методология оценки рисков ИИ",
    "Юридическая экспертиза ответственности алгоритмов",
    "Доступ к высокорисковому индустриальному кейсу",
  ],
};

const AGENTIC_SOFTWARE_MIGRATION_PLACE: SrtPlace = {
  id: "srt3-ai-agent-orchestration",
  level: 3,
  name: "Оркестрация флотов ИИ-агентов",
  label: "СРТ-3 · Оркестрация флотов ИИ-агентов",
  change: "ИИ-агенты становятся единицами цифрового труда, поэтому компаниям нужен управляемый контур их координации, мониторинга и включения в процессы.",
  whyNow: "Переход от отдельных помощников к флотам агентов уже начался, а операционные стандарты ещё не закреплены.",
  window: "Открыто",
  productiveExit: "Ограниченный агентный пилот одобрен, а владелец результата назначен.",
  evidence: [
    "Карта действующего процесса",
    "Точка ручного подтверждения",
    "Доступ к execution traces",
  ],
};

const VERTICAL_FINANCE_AI_PLACE: SrtPlace = {
  id: "srt3-pro-retail-fintech",
  level: 3,
  name: "Профессиональный ИИ-инструментарий для розничных трейдеров",
  label: "СРТ-3 · Профессиональный ИИ-инструментарий для розничных трейдеров",
  change: "AI-ассистенты дают розничному инвестору доступ к аналитическим процедурам, которые раньше были доступны только институциональным командам.",
  whyNow: "Демократизация профессиональных инструментов уже идёт, но качество инвестиционных гипотез и контроль ошибок ещё не стандартизированы.",
  window: "Открыто",
  productiveExit: "Проверенная инвестиционная гипотеза включена в аналитический пайплайн для ручной верификации.",
  evidence: [
    "Контрольный датасет",
    "Воспроизводимый backtest",
    "Доступ к первичным рыночным источникам",
  ],
};

const AGENT_MEMORY_LIFECYCLE_PLACE: SrtPlace = {
  id: "srt6-sovereign-data-vaults",
  level: 6,
  name: "Суверенные платформы защиты обучающих данных",
  label: "СРТ-6 · Суверенные платформы защиты обучающих данных",
  change: "Контроль хранения, забывания и разделения контекстов становится обязательным условием работы агентов с чувствительными данными.",
  whyNow: "Требования к локализации и предотвращению утечек растут быстрее, чем формируются проверяемые политики памяти.",
  window: "Открыто",
  productiveExit: "Проверяемая политика памяти принята в технический backlog владельца агентной платформы.",
  evidence: [
    "Тестовый автономный агент",
    "10 long-run traces",
    "Политика хранения и забывания",
  ],
};

const AI_ARCHITECT_UPSKILLING_PLACE: SrtPlace = {
  id: "srt3-ai-native-engineering-edu",
  level: 3,
  name: "Переподготовка инженеров под AI-native разработку",
  label: "СРТ-3 · Переподготовка инженеров под AI-native разработку",
  change: "Ценность разработчика смещается от написания синтаксиса к проектированию систем и постановке задач агентам.",
  whyNow: "Традиционное ИТ-образование ещё не адаптировалось к появлению автономных кодеров.",
  window: "Открыто",
  productiveExit: "Карта агентного процесса принята владельцем и содержит явную точку human review.",
  evidence: ["Действующий рабочий процесс", "Пример входа и результата", "Владелец процесса"],
};

const AI_CODE_AUDIT_PLACE: SrtPlace = {
  id: "srt8-ai-verification-infra",
  level: 8,
  name: "Инфраструктура верификации и фактчекинга ИИ",
  label: "СРТ-8 · Инфраструктура верификации и фактчекинга ИИ",
  change: "Независимая проверка точности и безопасности AI-результатов становится инфраструктурным слоем, включая воспроизводимый аудит сгенерированного кода.",
  whyNow: "Крупные игроки сталкиваются с публичными ошибками ИИ, поэтому спрос смещается от доверия к доказуемой проверке.",
  window: "Открыто",
  productiveExit: "Один риск воспроизводится тестом, а исправление принято владельцем кода.",
  evidence: ["AI-сгенерированный модуль", "Тестовый контур", "Владелец кода"],
};

const AI_QA_COMPLIANCE_PLACE: SrtPlace = {
  id: "srt5-ai-data-qa-governance",
  level: 5,
  name: "Контроль качества и аудит данных для ИИ",
  label: "СРТ-5 · Контроль качества и аудит данных для ИИ",
  change: "Верификация, очистка и разметка данных выделяются в самостоятельный слой AI-стека.",
  whyNow: "Сложность моделей растёт быстрее внутренних QA-возможностей компаний, и специализированная функция качества становится критической.",
  window: "Открыто",
  productiveExit: "Рубрика качества и тест-кейсы приняты владельцем процесса.",
  evidence: ["10 реальных примеров", "Приемлемый эталон", "Критические ошибки"],
};

const DATA_GATEWAY_PLACE: SrtPlace = {
  id: "srt7-ip-royalty-clearinghouse",
  level: 7,
  name: "Платформы лицензирования данных для обучения AI",
  label: "СРТ-7 · Платформы лицензирования данных для обучения AI",
  change: "Правообладателям и разработчикам LLM нужны прозрачные контракты доступа, учёта использования и отзыва прав.",
  whyNow: "Судебные конфликты и закрытие прежних каналов данных ускоряют формирование легальных шлюзов и расчётных механизмов.",
  window: "Сужается",
  productiveExit: "Минимальный контракт использования данных согласован владельцем и потребителем.",
  evidence: ["Один набор данных", "AI-потребитель", "Условия доступа и отзыва"],
};

const AI_CONTENT_VERIFICATION_PLACE: SrtPlace = {
  id: "srt3-decentralized-ip-verification",
  level: 3,
  name: "Децентрализованные сети верификации авторства",
  label: "СРТ-3 · Децентрализованные сети верификации авторства",
  change: "Профессиональные сообщества создают собственные протоколы проверки происхождения контента и защиты от AI-мошенничества.",
  whyNow: "Государственное регулирование отстаёт, а авторам и платформам уже нужны доказательства происхождения и качества цифровых объектов.",
  window: "Открыто",
  productiveExit: "По 20 объектам принято доказательное решение: использовать, проверить или исключить.",
  evidence: ["20 единиц контента", "Первичные источники", "Критерии качества"],
};

const CONTENT_PROVENANCE_PLACE: SrtPlace = {
  id: "srt7-ai-labeling-compliance",
  level: 7,
  name: "Сервисы сертификации и маркировки AI-контента",
  label: "СРТ-7 · Сервисы сертификации и маркировки AI-контента",
  change: "Маркировка, водяные знаки и проверяемая цепочка происхождения становятся обязательным слоем цифровых медиа.",
  whyNow: "Регуляторные требования усиливаются, а медиа-платформам уже нужны независимые провайдеры C2PA и технической маркировки.",
  window: "Открыто",
  productiveExit: "Происхождение одного медиафайла проверяется после публикации.",
  evidence: ["Исходный медиафайл", "Точка публикации", "Протокол C2PA"],
};

export const SRT_PLACES: Record<string, SrtPlace> = {
  "3": AI_CURATION_PLACE,
  "srt6-structural-verification-services": AI_CURATION_PLACE,
  "srt3-ai-agent-orchestration": AGENTIC_SOFTWARE_MIGRATION_PLACE,
  "srt3-pro-retail-fintech": VERTICAL_FINANCE_AI_PLACE,
  "srt6-sovereign-data-vaults": AGENT_MEMORY_LIFECYCLE_PLACE,
  "srt3-ai-native-engineering-edu": AI_ARCHITECT_UPSKILLING_PLACE,
  "srt8-ai-verification-infra": AI_CODE_AUDIT_PLACE,
  "srt5-ai-data-qa-governance": AI_QA_COMPLIANCE_PLACE,
  "srt7-ip-royalty-clearinghouse": DATA_GATEWAY_PLACE,
  "srt3-decentralized-ip-verification": AI_CONTENT_VERIFICATION_PLACE,
  "srt7-ai-labeling-compliance": CONTENT_PROVENANCE_PLACE,
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
    sourcePlaceIds: getPlaceIdsForPositionRoute("vertical-finance-ai"),
    level: 3,
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
  {
    id: "system-ai-architect",
    sourcePlaceIds: getPlaceIdsForPositionRoute("system-ai-architect"),
    level: 3,
    title: "Проектирование систем с AI-агентами",
    description: "Переход от написания кода к проектированию управляемых систем и границ автономности.",
    window: "Открыто",
    whyNow: "Автономные кодеры ускоряют реализацию, но повышают цену ошибки архитектуры и неявной ответственности.",
    intents: ["expert", "business"],
    position: "Системный AI-архитектор",
    resourceMatchPercent: 64,
    mission: "Спроектировать один AI-процесс так, чтобы зона действий агента и точка решения человека были однозначны.",
    object: "Действующий процесс подготовки и согласования коммерческого предложения",
    result: "Карта агентного процесса принята владельцем и готова к ограниченному пилоту.",
    firstAction: "Разложить процесс на вход, решения агента, запрещённые действия и точку human review.",
    recipientRole: "Владелец коммерческого процесса",
    output: "Карта агентного процесса и точка human review",
    acceptanceCriterion: "Владелец подтверждает границы агента и разрешает контрольный прогон",
    resourceGap: {
      title: "Шаблон архитектуры агентного процесса",
      description: "Помогает связать задачи агента, данные, ограничения и человеческие решения в одной схеме.",
      estimatedMinutes: 25,
      artifact: "Схема процесса с границами автономности",
    },
    arsenal: {
      platforms: ["Miro или Excalidraw", "n8n или LangGraph"],
      competencies: ["системное проектирование", "декомпозиция процесса", "human-in-the-loop"],
      communicationVenues: ["архитектурный разбор с владельцем процесса"],
      accesses: ["описание текущего процесса", "пример входа и результата"],
      norms: ["однозначная ответственность", "минимально необходимая автономность"],
    },
    evidence: ["карта процесса", "точка human review", "решение владельца о пилоте"],
    timeToActionMinutes: 90,
  },
  {
    id: "ai-code-auditor",
    sourcePlaceIds: getPlaceIdsForPositionRoute("ai-code-auditor"),
    level: 8,
    title: "Аудит AI-генерируемого кода",
    description: "Воспроизводимая проверка безопасности и корректности кода, созданного AI-агентом.",
    window: "Открыто",
    whyNow: "Скорость генерации кода растёт быстрее способности команд вручную проверять риски.",
    intents: ["expert", "business"],
    position: "Аудитор AI-кода",
    resourceMatchPercent: 70,
    mission: "Найти и доказать один существенный риск AI-генерируемого модуля и передать исправление владельцу кода.",
    object: "Небольшой AI-сгенерированный модуль с доступом к данным или внешнему API",
    result: "Риск воспроизводится тестом, а исправление принято в backlog.",
    firstAction: "Запустить модуль в тестовом контуре и проверить входные данные, разрешения и негативный сценарий.",
    recipientRole: "Tech lead или владелец репозитория",
    output: "Отчёт о воспроизводимом риске и способе исправления",
    acceptanceCriterion: "Тест воспроизводит риск, issue создан и назначен владельцу",
    resourceGap: {
      title: "Мини-чек-лист проверки AI-кода",
      description: "Фиксирует входы, разрешения, зависимости, негативные сценарии и доказательство риска.",
      estimatedMinutes: 20,
      artifact: "Тест, issue и доказательство риска",
    },
    arsenal: {
      platforms: ["GitHub", "локальный test runner"],
      competencies: ["code review", "threat modeling", "написание негативных тестов"],
      communicationVenues: ["pull request или security review"],
      accesses: ["AI-сгенерированный модуль", "тестовый контур"],
      norms: ["воспроизводимость", "минимальное раскрытие уязвимости"],
    },
    evidence: ["падающий тест", "описание риска", "принятое исправление"],
    timeToActionMinutes: 75,
  },
  {
    id: "ai-qa-designer",
    sourcePlaceIds: getPlaceIdsForPositionRoute("ai-qa-designer"),
    level: 5,
    title: "Контур качества AI-результатов",
    description: "Рубрика и набор проверок, которые превращают субъективное качество в управляемый процесс.",
    window: "Открыто",
    whyNow: "Компании масштабируют AI-генерацию быстрее, чем стандартизируют критерии приёмки.",
    intents: ["business", "expert"],
    position: "Дизайнер AI-QA",
    resourceMatchPercent: 67,
    mission: "Собрать минимальную систему качества для одного AI-сценария на реальных примерах.",
    object: "AI-сценарий создания клиентского ответа или аналитической заметки",
    result: "Рубрика и 10 тест-кейсов приняты владельцем процесса и используются в пилоте.",
    firstAction: "Выбрать 10 реальных входов и определить три ошибки, которые нельзя пропустить.",
    recipientRole: "Владелец AI-сценария",
    output: "Рубрика качества и 10 тест-кейсов",
    acceptanceCriterion: "Критические ошибки покрыты, а критерии приёмки однозначны",
    resourceGap: {
      title: "Шаблон рубрики AI-QA",
      description: "Связывает реальный вход, ожидаемый результат, критическую ошибку и решение о приёмке.",
      estimatedMinutes: 20,
      artifact: "Таблица тестов и критериев приёмки",
    },
    arsenal: {
      platforms: ["Google Sheets", "eval runner"],
      competencies: ["дизайн тестов", "калибровка рубрик", "анализ ошибок LLM"],
      communicationVenues: ["QA-разбор с владельцем процесса"],
      accesses: ["10 реальных примеров входа", "эталон приемлемого результата"],
      norms: ["проверяемость", "покрытие критических ошибок"],
    },
    evidence: ["10 тест-кейсов", "рубрика", "решение владельца процесса"],
    timeToActionMinutes: 80,
  },
  {
    id: "ai-content-verification-analyst",
    sourcePlaceIds: getPlaceIdsForPositionRoute("ai-content-verification-analyst"),
    level: 3,
    title: "Верификация AI-контента",
    description: "Проверка происхождения, фактического качества и допустимости синтетического контента.",
    window: "Открыто",
    whyNow: "Корпоративные базы знаний и публичные платформы быстро загрязняются недоказанным AI-контентом.",
    intents: ["expert", "business"],
    position: "Аналитик верификации AI-контента",
    resourceMatchPercent: 73,
    mission: "Принять доказательное решение по 20 единицам контента и сформировать правило дальнейшей фильтрации.",
    object: "20 изображений, заметок или карточек из одной информационной базы",
    result: "Каждый объект получил решение и ссылку на доказательство, а правило фильтрации принято владельцем базы.",
    firstAction: "Выбрать 20 объектов и зафиксировать критерии происхождения, точности и допустимости.",
    recipientRole: "Владелец базы знаний или редактор",
    output: "Таблица provenance, качества и решения по 20 объектам",
    acceptanceCriterion: "Нет объектов без решения; сомнительные элементы снабжены доказательством риска",
    resourceGap: {
      title: "Протокол проверки AI-контента",
      description: "Разделяет происхождение, фактологию и редакционное решение вместо одного непрозрачного балла.",
      estimatedMinutes: 18,
      artifact: "Таблица проверки и правило фильтрации",
    },
    arsenal: {
      platforms: ["таблица проверки", "поиск по первичным источникам"],
      competencies: ["fact-checking", "provenance analysis", "редакционная оценка"],
      communicationVenues: ["редакционная или knowledge-ops команда"],
      accesses: ["20 единиц контента", "первичные источники"],
      norms: ["трассируемость решения", "разделение факта и оценки"],
    },
    evidence: ["таблица по 20 объектам", "ссылки на источники", "принятое правило фильтрации"],
    timeToActionMinutes: 60,
  },
  {
    id: "data-access-architect",
    sourcePlaceIds: getPlaceIdsForPositionRoute("data-access-architect"),
    level: 7,
    title: "Контракт доступа к данным для AI",
    description: "Управляемые права, учёт использования и условия отзыва данных между владельцем и AI-потребителем.",
    window: "Сужается",
    whyNow: "Старые соглашения по данным разрушаются, а владельцы контента закрывают неконтролируемый доступ.",
    intents: ["business", "invest"],
    position: "Архитектор доступа к данным",
    resourceMatchPercent: 61,
    mission: "Согласовать минимальный контракт использования одного набора данных одним AI-потребителем.",
    object: "Один набор контентных или операционных данных",
    result: "Владелец и потребитель согласовали права, измерение использования и отзыв доступа.",
    firstAction: "Описать разрешённое использование, единицу учёта и событие прекращения доступа.",
    recipientRole: "Владелец данных и владелец AI-продукта",
    output: "Data-use contract с правами, учётом и отзывом доступа",
    acceptanceCriterion: "Обе стороны подтверждают однозначность условий и способ измерения использования",
    resourceGap: {
      title: "Шаблон минимального data-use contract",
      description: "Фиксирует предмет данных, права, ограничения, учёт, оплату и прекращение доступа.",
      estimatedMinutes: 25,
      artifact: "Согласованный одностраничный контракт",
    },
    arsenal: {
      platforms: ["data catalog", "API gateway"],
      competencies: ["data governance", "лицензирование данных", "usage metering"],
      communicationVenues: ["переговоры владельца данных и AI-продукта"],
      accesses: ["описание набора данных", "сценарий использования"],
      norms: ["минимизация данных", "отзыв согласия", "измеримость использования"],
    },
    evidence: ["описание набора", "согласованный контракт", "событие учёта использования"],
    timeToActionMinutes: 90,
  },
  {
    id: "content-provenance-engineer",
    sourcePlaceIds: getPlaceIdsForPositionRoute("content-provenance-engineer"),
    level: 7,
    title: "Цепочка происхождения цифрового контента",
    description: "Проверяемая фиксация источника, изменений и публикации медиафайла.",
    window: "Открыто",
    whyNow: "Маркировка синтетического контента и доказательство происхождения становятся инфраструктурным стандартом.",
    intents: ["expert", "business"],
    position: "Инженер provenance-контента",
    resourceMatchPercent: 58,
    mission: "Собрать минимальную цепочку происхождения одного медиафайла и доказать её проверяемость после публикации.",
    object: "Один исходный медиафайл и одна точка публикации",
    result: "Источник и изменения файла проверяются независимым получателем после публикации.",
    firstAction: "Зафиксировать исходный файл, автора, преобразования и метаданные публикации.",
    recipientRole: "Редактор, платформа публикации или правообладатель",
    output: "Проверяемая provenance-цепочка от создания до публикации",
    acceptanceCriterion: "Получатель подтверждает источник и видит зафиксированные изменения",
    resourceGap: {
      title: "Мини-протокол C2PA/provenance",
      description: "Показывает, какие утверждения и подписи нужны на каждом переходе контента.",
      estimatedMinutes: 30,
      artifact: "Манифест происхождения и результат проверки",
    },
    arsenal: {
      platforms: ["C2PA toolchain", "система публикации"],
      competencies: ["content credentials", "цифровые подписи", "media pipeline"],
      communicationVenues: ["редакционная и платформенная команды"],
      accesses: ["исходный медиафайл", "точка публикации"],
      norms: ["C2PA", "трассируемость изменений"],
    },
    evidence: ["исходный файл", "подписанный манифест", "успешная проверка после публикации"],
    timeToActionMinutes: 120,
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
  scenarioId: string;
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
    scenarioId: route.id,
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
  // Eken's current PositionRouteV1 DTO does not accept dashboard-only fields.
  // Keep them on the Verkhovskiy side, while transferring the complete core
  // brief that Eken can import today.
  const { scenarioId: _scenarioId, selfAssessment: _selfAssessment, ...ekenRoute } = payload;
  return buildEkenFragmentUrl(ekenRoute);
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
