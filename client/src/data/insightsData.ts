// ============================================================
// Strategic Insights extracted from the analytical document
// 7 key structural insights from 14 AI Daily Reports
// ============================================================

export interface ProgramLink {
  name: string;
  url: string;
  shortName?: string;
}

export const SKOLKOVO_PROGRAMS: Record<string, ProgramLink> = {
  aiShift: {
    name: "«Переход в ИИ: трансформация бизнес-процессов»",
    shortName: "Переход в ИИ",
    url: "https://www.skolkovo.ru/programmes/cdto/",
  },
  intensiveAI: {
    name: "«Интенсив по генеративным алгоритмам и ИИ»",
    shortName: "Интенсив по ИИ",
    url: "https://www.skolkovo.ru/programmes/intensiv-po-generativnym-algoritmam-i-ii/",
  },
  intensiveAgents: {
    name: "«Онлайн-интенсив по разработке ИИ-продуктов»",
    shortName: "Интенсив по агентам",
    url: "https://www.skolkovo.ru/programmes/onlajn-intensiv-po-razrabotke-ii-produktov/",
  },
  dataDriven: {
    name: "«Переход в data-driven управление»",
    shortName: "Data-Driven",
    url: "https://www.skolkovo.ru/programmes/praktikum-po-postroeniyu-data-driven-sistemy-upravleniya/",
  },
  ubnd: {
    name: "«Управление бизнесом с помощью ИИ и данных»",
    shortName: "УБНД",
    url: "https://www.skolkovo.ru/programmes/upravlenie-biznesom-na-dannyh/",
  },
  aiMarketing: {
    name: "«ИИ в маркетинге»",
    shortName: "ИИ в маркетинге",
    url: "https://www.skolkovo.ru/programmes/ii-v-marketinge/",
  },
};

export interface StrategicInsight {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  summary: string;
  evidence: string[];
  nonObviousConclusion: string;
  educationImplication: string;
  /** Program keys from SKOLKOVO_PROGRAMS that are relevant to this insight */
  relevantPrograms: string[];
}

export const STRATEGIC_INSIGHTS: StrategicInsight[] = [
  {
    id: 1,
    title: "«Великое перемещение стоимости»",
    subtitle: "От софта к физической инфраструктуре",
    icon: "Building",
    accentColor: "#22d3ee",
    summary: "Самый масштабный структурный сдвиг периода — перетекание капитала и стратегической ценности из программного слоя в физическую инфраструктуру: дата-центры, чипы, память, охлаждение, энергетику.",
    evidence: [
      "$650 млрд совокупных капзатрат Amazon/Alphabet/Meta/Microsoft на 2026 (+60% г/г)",
      "Чиповая индустрия выходит на $1 трлн выручки",
      "Oracle привлекает $45–50 млрд для строительства облачных мощностей",
      "Samsung начинает коммерческие поставки HBM4",
      "Delta Electronics достигает $100 млрд капитализации, обгоняя Foxconn",
    ],
    nonObviousConclusion: "Параллельно с «бумом инфраструктуры» Bloomberg фиксирует «loan meltdown» для софтверных компаний — средний SaaS-слой становится «донором» для инфраструктурных игроков. Трансформация — это не «добавить AI к бизнесу», а перестройка всей цепочки стоимости.",
    educationImplication: "Модуль по инфраструктурной грамотности: compute, энергия, память и охлаждение — стратегические ресурсы, определяющие конкурентоспособность. Эти темы глубоко разбираются в программе СКОЛКОВО «Управление бизнесом с помощью ИИ и данных» и в программе «Переход в ИИ».",
    relevantPrograms: ["ubnd", "aiShift"],
  },
  {
    id: 2,
    title: "«Агентная революция»",
    subtitle: "Новый рынок управления и безопасности",
    icon: "Bot",
    accentColor: "#10b981",
    summary: "Переход от «модель отвечает на вопрос» к «агент действует автономно» — появление принципиально нового класса систем, требующих собственной инфраструктуры управления, безопасности и наблюдаемости.",
    evidence: [
      "OpenAI запускает Frontier — платформу для AI coworkers с guardrails",
      "Goodfire оценивается в $1.25 млрд за интерпретируемость моделей",
      "MIT Tech Review: prompt injection и agent goal hijack — ключевые угрозы",
      "CEO-гайд по управлению рисками агентных систем (MIT Tech Review)",
    ],
    nonObviousConclusion: "Возникает новая профессиональная вертикаль «Agent Ops» — аналог DevOps/MLOps для агентных систем: управление правами, политики доступа, аудит действий, мониторинг «целевого дрейфа».",
    educationImplication: "Модуль по «Agentic AI Governance»: архитектура безопасности, стандарты OWASP/NIST/SAIF, практики boundary-control. Практические навыки создания агентных систем — в «Онлайн-интенсиве по разработке ИИ-продуктов» СКОЛКОВО.",
    relevantPrograms: ["intensiveAgents", "intensiveAI"],
  },
  {
    id: 3,
    title: "Государство — тройной игрок",
    subtitle: "Регулятор, заказчик и поле битвы",
    icon: "Landmark",
    accentColor: "#f59e0b",
    summary: "Государство перестаёт быть «внешним наблюдателем» и становится тройным игроком: крупнейшим заказчиком GenAI, активным регулятором и ареной конфликтов.",
    evidence: [
      "DHS (США) использует Google Veo 3 и Adobe Firefly для публичных материалов",
      "Индия: 20-летние налоговые каникулы для дата-центров + $4.3 млрд на электронику",
      "Генпрокурор Мичигана добивается пересмотра энергоплана для ДЦ Oracle+OpenAI",
      "Сотрудники Google требуют прекращения контрактов с ICE/CBP",
    ],
    nonObviousConclusion: "Формируется «тройной замок» регулирования: государство-заказчик создаёт стандарты через закупки; государство-регулятор — через законы; сотрудники — через внутренний активизм. Compliance становится стратегической функцией.",
    educationImplication: "Модуль по «AI Governance и регуляторный ландшафт»: фискальные, экспортные и комплаенс-режимы как определяющие бизнес-модели. Стратегический контекст для руководителей — в программе «Переход в ИИ» СКОЛКОВО.",
    relevantPrograms: ["aiShift", "ubnd"],
  },
  {
    id: 4,
    title: "«Память агента» — новый фронтир",
    subtitle: "Данные, приватность и конкурентная борьба",
    icon: "Brain",
    accentColor: "#8b5cf6",
    summary: "Переход от разовых сессий к агентам с долгосрочной памятью создаёт принципиально новый класс данных — «оперативную память агента», склеивающую контексты из разных источников.",
    evidence: [
      "Google: Personal Intelligence для Gemini с доступом к Gmail/Photos/Search",
      "OpenAI: ChatGPT Health с доступом к медзаписям (230 млн health-запросов/нед.)",
      "OpenAI Prism: GPT-5.2 встроен в LaTeX-редактор с доступом к рукописям",
      "MIT Tech Review: «What AI remembers about you is privacy's next frontier»",
    ],
    nonObviousConclusion: "Возникает «конкуренция за контекст»: кто первым получит доступ к наибольшему объёму данных через «память агента», тот создаст непреодолимый lock-in. Выбор AI-платформы = решение «кому мы отдаём институциональную память».",
    educationImplication: "Модуль по «Data Governance в эпоху агентного AI»: сегментация памяти, provenance, контроль контекста, политики удаления. Практический подход к data-driven управлению — в программе «Управление бизнесом с помощью ИИ и данных».",
    relevantPrograms: ["ubnd", "dataDriven"],
  },
  {
    id: 5,
    title: "«Теневая экономика» AI",
    subtitle: "Регулирование платежами, а не законами",
    icon: "ShieldAlert",
    accentColor: "#ef4444",
    summary: "Параллельно легальному рынку формируется «теневая цепочка поставок» — маркетплейсы LoRA-инструкций, deepfake-контента. Регулирование происходит через платёжную инфраструктуру, обход — через криптовалюты.",
    evidence: [
      "Civitai (при поддержке a16z): 86% deepfake-запросов связаны с LoRA, 90% целей — женщины",
      "Платёжный процессор отключил Civitai → переход на gift cards и криптовалюту",
      "a16z финансирует AI super PAC и одновременно инвестирует в Civitai",
    ],
    nonObviousConclusion: "Visa/Mastercard/PSP становятся регуляторами быстрее государства. Возникают два параллельных контура: легальный (банковские платежи + комплаенс) и теневой (криптовалюта + обход).",
    educationImplication: "Понимание «платёжного комплаенса» как нового слоя корпоративного управления для компаний, работающих с GenAI. Маркетинговые риски и возможности AI разбираются в программе «ИИ в маркетинге» СКОЛКОВО.",
    relevantPrograms: ["aiMarketing", "aiShift"],
  },
  {
    id: 6,
    title: "Вертикальная интеграция 2.0",
    subtitle: "От конгломератов к «стекам полного цикла»",
    icon: "Layers",
    accentColor: "#f97316",
    summary: "Крупнейшие игроки строят вертикальные «стеки», объединяющие все уровни СРТ — от физической инфраструктуры до пользовательского интерфейса.",
    evidence: [
      "Musk: SpaceX + xAI + Tesla — от спутника до робота",
      "Amazon: AWS + $50 млрд в OpenAI + Kuiper + Ритейл",
      "OpenAI: Модели + Prism/Health + Frontier — «ОС для знания»",
      "Google: Gemini + Облако + Персональная память + Genie",
    ],
    nonObviousConclusion: "Компании «среднего слоя» под двойным давлением: сверху (платформы забирают маржу) и снизу (инфраструктура дорожает). Ожидается массовая консолидация «среднего слоя» в ближайшие 12–18 месяцев.",
    educationImplication: "Модуль по стратегическому позиционированию: анализ цепочки создания ценности, определение «узловых позиций». Системный подход к data-driven трансформации — в программе «Переход в data-driven управление» СКОЛКОВО.",
    relevantPrograms: ["dataDriven", "ubnd"],
  },
  {
    id: 7,
    title: "Образование — узкое место",
    subtitle: "Компетенции как главный ограничитель масштабирования",
    icon: "GraduationCap",
    accentColor: "#ec4899",
    summary: "Слияние Coursera+Udemy, рост Agent Ops, переход к boundary-based security указывают на критический дефицит компетенций — главный ограничитель масштабирования AI в организациях.",
    evidence: [
      "Слияние Coursera + Udemy — узловая позиция «массовой переподготовки»",
      "Рост «Agent Ops» как профессии — нет ни стандартов, ни программ подготовки",
      "Компании переходят к «иконному use case» с ROI и выводом в прод за ≤3 мес.",
      "Block, Ocado, Amazon сокращают тысячи сотрудников в пользу AI-компетенций",
    ],
    nonObviousConclusion: "Образовательные программы по цифровой трансформации в уникальной стратегической позиции: «поставщик компетенций» для организаций, которые не могут нанять специалистов на открытом рынке. Портфель программ СКОЛКОВО закрывает полный спектр — от стратегии до практики.",
    educationImplication: "Практико-ориентированный подход: не «что такое AI», а «как развернуть агентную систему с boundary-control за 3 месяца». Полный спектр программ СКОЛКОВО: от стратегического «Перехода в ИИ» до практического «Интенсива по генеративным алгоритмам и ИИ» и «Интенсива по разработке ИИ-продуктов».",
    relevantPrograms: ["aiShift", "intensiveAI", "intensiveAgents", "ubnd", "aiMarketing", "dataDriven"],
  },
];

export interface NodalPosition {
  id: number;
  name: string;
  controllers: string;
  stakes: string;
  trend: string;
  trendColor: string;
}

export const NODAL_POSITIONS: NodalPosition[] = [
  {
    id: 1,
    name: "Compute + Энергия + ДЦ",
    controllers: "Amazon / Google / Microsoft / Oracle + Nvidia",
    stakes: "Физическая основа всей AI-экономики",
    trend: "Консолидация, рост капзатрат",
    trendColor: "#22d3ee",
  },
  {
    id: 2,
    name: "Frontier-модели",
    controllers: "OpenAI / Anthropic / Google + DeepSeek / Qwen",
    stakes: "«Ядро интеллекта», но commoditization через open-weight",
    trend: "Биполяризация: закрытые vs open-weight",
    trendColor: "#10b981",
  },
  {
    id: 3,
    name: "Агентная платформа",
    controllers: "OpenAI (Frontier) / зарождающийся рынок",
    stakes: "Управление, безопасность, оркестрация агентов",
    trend: "Быстрый рост, формирование стандартов",
    trendColor: "#f59e0b",
  },
  {
    id: 4,
    name: "Пользовательский контекст",
    controllers: "Google (Gemini) / OpenAI (Health, Prism) / Apple",
    stakes: "Lock-in через доступ к данным и привычкам",
    trend: "Конкуренция за «первый контекст»",
    trendColor: "#8b5cf6",
  },
  {
    id: 5,
    name: "Регуляторный слой",
    controllers: "Государства + платёжные системы + активизм",
    stakes: "Допуск на рынки, условия работы",
    trend: "Фрагментация, рост сложности",
    trendColor: "#ef4444",
  },
];

export interface EducationRecommendation {
  category: string;
  items: string[];
  /** Program keys from SKOLKOVO_PROGRAMS relevant to this category */
  relevantPrograms: string[];
}

export const EDUCATION_RECOMMENDATIONS: EducationRecommendation[] = [
  {
    category: "Обновить содержание модулей",
    items: [
      "Блок по инфраструктурной грамотности (compute, энергия, память как стратегические ресурсы)",
      "Практический модуль по Agentic AI (развёртывание агентных систем с governance)",
      "Расширенный блок по Data Governance с акцентом на «память агента»",
    ],
    relevantPrograms: ["aiShift", "intensiveAgents", "ubnd"],
  },
  {
    category: "Изменить фокус проектных работ",
    items: [
      "От «пилотов с чатботами» к «иконным use case» с измеримым ROI (≤3 мес. до прода)",
      "Задания по анализу цепочки создания ценности и определению узловых позиций",
      "Кейсы по boundary-based security для агентных систем",
    ],
    relevantPrograms: ["intensiveAI", "intensiveAgents", "dataDriven"],
  },
  {
    category: "Привлечь экспертов из новых областей",
    items: [
      "Agent Ops / AI Security",
      "Инфраструктура вычислений (ДЦ, энергетика, охлаждение)",
      "Регуляторный ландшафт AI (практики compliance, не юристы-теоретики)",
    ],
    relevantPrograms: ["aiShift", "aiMarketing", "ubnd"],
  },
];
