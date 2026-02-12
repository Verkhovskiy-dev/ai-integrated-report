// ============================================================
// DESIGN: Intelligence Dashboard — "Командный Пункт"
// Data extracted and aggregated from 14 AI Daily Reports
// Period: Jan 30 — Feb 12, 2026
// ============================================================

export const REPORT_PERIOD = {
  start: "2026-01-30",
  end: "2026-02-12",
  totalReports: 14,
  totalDays: 14,
};

// СРТ Level definitions
export const SRT_LEVELS = [
  { id: 9, name: "Денежная система", short: "Капитал", color: "#ef4444", group: "upper" },
  { id: 8, name: "Институты спонтанного порядка", short: "Институты", color: "#f97316", group: "upper" },
  { id: 7, name: "Производство знаний", short: "Знания", color: "#eab308", group: "upper" },
  { id: 6, name: "Технологии производства", short: "Технологии", color: "#f59e0b", group: "middle" },
  { id: 5, name: "Разделение труда между фирмами", short: "Value Chain", color: "#22d3ee", group: "middle" },
  { id: 4, name: "Железные технологии", short: "Hardware", color: "#06b6d4", group: "middle" },
  { id: 3, name: "Социально-профессиональная структура", short: "Профессии", color: "#10b981", group: "lower" },
  { id: 2, name: "Пространственная организация", short: "География", color: "#34d399", group: "lower" },
  { id: 1, name: "Природные ресурсы", short: "Ресурсы", color: "#6ee7b7", group: "lower" },
];

// Heatmap data: activity intensity by level and date
export const HEATMAP_DATA: { date: string; levels: Record<number, number> }[] = [
  { date: "Jan 30", levels: { 9: 3, 8: 2, 7: 2, 6: 3, 5: 4, 4: 2, 3: 2, 2: 1, 1: 1 } },
  { date: "Jan 31", levels: { 9: 4, 8: 3, 7: 2, 6: 3, 5: 4, 4: 3, 3: 2, 2: 2, 1: 1 } },
  { date: "Feb 1", levels: { 9: 3, 8: 3, 7: 3, 6: 2, 5: 3, 4: 3, 3: 2, 2: 2, 1: 1 } },
  { date: "Feb 2", levels: { 9: 4, 8: 2, 7: 2, 6: 3, 5: 4, 4: 3, 3: 1, 2: 2, 1: 1 } },
  { date: "Feb 3", levels: { 9: 3, 8: 3, 7: 3, 6: 3, 5: 3, 4: 2, 3: 2, 2: 1, 1: 0 } },
  { date: "Feb 4", levels: { 9: 3, 8: 2, 7: 2, 6: 2, 5: 3, 4: 3, 3: 2, 2: 2, 1: 1 } },
  { date: "Feb 5", levels: { 9: 2, 8: 3, 7: 1, 6: 3, 5: 4, 4: 3, 3: 1, 2: 3, 1: 1 } },
  { date: "Feb 6", levels: { 9: 3, 8: 4, 7: 2, 6: 3, 5: 3, 4: 2, 3: 2, 2: 2, 1: 1 } },
  { date: "Feb 7", levels: { 9: 2, 8: 4, 7: 2, 6: 3, 5: 4, 4: 3, 3: 2, 2: 2, 1: 2 } },
  { date: "Feb 8", levels: { 9: 3, 8: 2, 7: 3, 6: 3, 5: 3, 4: 3, 3: 2, 2: 1, 1: 1 } },
  { date: "Feb 9", levels: { 9: 4, 8: 3, 7: 2, 6: 2, 5: 4, 4: 4, 3: 2, 2: 2, 1: 1 } },
  { date: "Feb 10", levels: { 9: 3, 8: 3, 7: 3, 6: 3, 5: 3, 4: 4, 3: 2, 2: 2, 1: 1 } },
  { date: "Feb 11", levels: { 9: 4, 8: 3, 7: 2, 6: 3, 5: 4, 4: 3, 3: 3, 2: 2, 1: 1 } },
  { date: "Feb 12", levels: { 9: 4, 8: 3, 7: 3, 6: 2, 5: 3, 4: 3, 3: 2, 2: 2, 1: 0 } },
];

// Key metrics
export const KEY_METRICS = [
  { label: "Отчётов", value: 14, suffix: "", icon: "FileText" },
  { label: "Уникальных событий", value: 187, suffix: "+", icon: "Zap" },
  { label: "Структурных сдвигов", value: 38, suffix: "", icon: "TrendingUp" },
  { label: "Слабых сигналов", value: 62, suffix: "", icon: "Radio" },
  { label: "Компаний упомянуто", value: 45, suffix: "+", icon: "Building2" },
  { label: "Источников", value: 120, suffix: "+", icon: "Link" },
];

// Top companies by mention frequency
export const TOP_COMPANIES = [
  { name: "Nvidia", mentions: 12, trend: "up", category: "Hardware" },
  { name: "OpenAI", mentions: 11, trend: "up", category: "Models" },
  { name: "Google/Alphabet", mentions: 10, trend: "stable", category: "Platform" },
  { name: "Amazon/AWS", mentions: 8, trend: "up", category: "Cloud" },
  { name: "Microsoft", mentions: 7, trend: "down", category: "Cloud" },
  { name: "Apple", mentions: 6, trend: "down", category: "Devices" },
  { name: "Samsung", mentions: 5, trend: "up", category: "Memory" },
  { name: "Anthropic", mentions: 5, trend: "up", category: "Models" },
  { name: "Meta", mentions: 4, trend: "stable", category: "Platform" },
  { name: "DeepSeek", mentions: 4, trend: "up", category: "Models" },
  { name: "Mistral AI", mentions: 3, trend: "up", category: "Models" },
  { name: "Check Point", mentions: 3, trend: "up", category: "Security" },
];

// Structural shifts aggregated across all reports
export const STRUCTURAL_SHIFTS = [
  {
    id: 1,
    title: "Финансиализация Compute",
    from: "VC/equity финансирование AI через бигтех",
    to: "GPU/чипы как объект кредитования и лизинга через bond market",
    mechanism: "AI-CapEx упаковывается в долговые инструменты и asset-backed схемы",
    levels: [9, 5, 2, 4],
    frequency: 8,
    trend: "accelerating",
  },
  {
    id: 2,
    title: "Open-weight как глобальный стандарт",
    from: "Доминирование западных закрытых API",
    to: "Китайские open-weight модели как базовые строительные блоки",
    mechanism: "Permissive лицензии + цена/эффективность + сетевой эффект",
    levels: [8, 7, 6, 5],
    frequency: 7,
    trend: "accelerating",
  },
  {
    id: 3,
    title: "Безопасность агентов: от промпта к границам",
    from: "Guardrails/фильтры на уровне текста",
    to: "Boundary-based security (identity, tools, data, audit)",
    mechanism: "Рост prompt injection + инциденты → спрос на детерминируемые контуры",
    levels: [6, 8, 5],
    frequency: 10,
    trend: "accelerating",
  },
  {
    id: 4,
    title: "От моделей к операционным платформам",
    from: "Компании покупают доступ к LLM",
    to: "Платформы развертывания агентов (управление правами, политиками, аудитом)",
    mechanism: "Enterprise-слой для AI coworkers с guardrails и контролем доступа",
    levels: [5, 6, 8],
    frequency: 6,
    trend: "emerging",
  },
  {
    id: 5,
    title: "Капекс на фабрику интеллекта",
    from: "AI-инвестиции = GPU/облако",
    to: "Системный капекс: DC + охлаждение + энергоснабжение + цепочки поставок",
    mechanism: "$650 млрд капзатрат Big Tech + рост HVAC/энергетики",
    levels: [9, 4, 2, 1],
    frequency: 9,
    trend: "accelerating",
  },
  {
    id: 6,
    title: "Регулирование: от технологий к профессиям",
    from: "Общие дискуссии об AI-регулировании",
    to: "Конкретные режимы ответственности (legal AI, age verification, госконтент)",
    mechanism: "Отраслевые законопроекты и enforcement-дизайн",
    levels: [8, 7, 3],
    frequency: 5,
    trend: "emerging",
  },
];

// Weak signals (radar items)
export const WEAK_SIGNALS = [
  {
    id: 1,
    title: "Долговое финансирование AI-инфры как норма рынка",
    level: 9,
    urgency: "high",
    description: "Bond issuance под AI-CapEx становится стандартом, создавая риски переоценки при изменении ставок",
  },
  {
    id: 2,
    title: "Потребительские бойкоты AI-платформ",
    level: 8,
    urgency: "medium",
    description: "QuitGPT и аналогичные кампании как новый механизм давления на AI-компании",
  },
  {
    id: 3,
    title: "Anti-contamination бенчмарки",
    level: 7,
    urgency: "medium",
    description: "Непрерывно обновляемые бенчмарки как новый стандарт легитимации качества моделей",
  },
  {
    id: 4,
    title: "Формальные гарантии безопасности агентов",
    level: 6,
    urgency: "high",
    description: "Поворот к криптографическим/формальным гарантиям вместо LLM-as-a-judge",
  },
  {
    id: 5,
    title: "Сегментация рынка моделей по юрисдикциям",
    level: 5,
    urgency: "medium",
    description: "Банки закрепляют контракты с региональными провайдерами (BNP–Mistral)",
  },
  {
    id: 6,
    title: "Memory Tax для AI-экономики",
    level: 4,
    urgency: "high",
    description: "HBM4 и цены на память перепрошивают маржинальность downstream-игроков",
  },
  {
    id: 7,
    title: "Agent Ops как новый рынок",
    level: 3,
    urgency: "medium",
    description: "Платформы управления агентами станут отдельной узловой позицией",
  },
  {
    id: 8,
    title: "Водный след AI",
    level: 2,
    urgency: "high",
    description: "Протесты против дата-центров из-за воды/экологии — предвестник серийных ограничений",
  },
  {
    id: 9,
    title: "Социальная лицензия на вычисления",
    level: 1,
    urgency: "medium",
    description: "Переход от оптимизации земли/энергии к необходимости общественного согласия",
  },
  {
    id: 10,
    title: "SaaSpocalypse и переоценка прикладного ПО",
    level: 5,
    urgency: "medium",
    description: "Смена инвестиционной логики от мультипликаторов SaaS к вопросу защищаемого value layer",
  },
  {
    id: 11,
    title: "Compute Landlord модель",
    level: 2,
    urgency: "medium",
    description: "GPU/чипы сдаются в аренду — развитие рентной модели вычислительных мощностей",
  },
  {
    id: 12,
    title: "Юрисдикция на техподдержку",
    level: 8,
    urgency: "high",
    description: "SDK-советы могут квалифицироваться как содействие развитию моделей в ограниченных странах",
  },
];

// Cross-level connections
export const CROSS_LEVEL_CONNECTIONS = [
  {
    id: 1,
    title: "Memory-price shock → маржинальное давление → инвестожидания",
    from: 4,
    to: 9,
    through: [5],
    description: "Рост цен на memory chips ухудшает прогноз прибыльности IT-вендоров",
  },
  {
    id: 2,
    title: "Финансовые инструменты → провайдеры инфраструктуры → география",
    from: 9,
    to: 2,
    through: [5],
    description: "Bond issuance и chip-loan создают масштабируемый механизм наращивания мощностей",
  },
  {
    id: 3,
    title: "Open-weight модели → стандарты разработки → монетизация",
    from: 8,
    to: 9,
    through: [6, 5],
    description: "Open-weight как инфраструктура давит на SaaS-монетизацию закрытых моделей",
  },
  {
    id: 4,
    title: "Агентные угрозы → security vendors → boundary security нормы",
    from: 4,
    to: 8,
    through: [5, 6],
    description: "Рост мошенничеств с AI усиливает спрос на киберпродукты и стандарты",
  },
  {
    id: 5,
    title: "Капзатраты Big Tech → чип-индустрия $1T → география мощностей",
    from: 9,
    to: 2,
    through: [4],
    description: "$650 млрд капзатрат закрепляют Big Tech как организаторов конвейера",
  },
  {
    id: 6,
    title: "Госзаказ на GenAI → конфликт ценностей → кадровые риски",
    from: 8,
    to: 3,
    through: [5],
    description: "Использование AI госструктурами создает этические конфликты внутри компаний",
  },
];

// Key themes frequency across reports
export const THEME_FREQUENCY = [
  { theme: "Безопасность агентов", count: 12, color: "#ef4444" },
  { theme: "AI-CapEx / Инфраструктура", count: 11, color: "#22d3ee" },
  { theme: "Чипы и память (HBM)", count: 10, color: "#f59e0b" },
  { theme: "Open-weight модели", count: 8, color: "#10b981" },
  { theme: "Регулирование AI", count: 8, color: "#8b5cf6" },
  { theme: "Геополитика (США-Китай)", count: 7, color: "#f97316" },
  { theme: "Агентные платформы", count: 7, color: "#06b6d4" },
  { theme: "Кибербезопасность", count: 6, color: "#ec4899" },
  { theme: "Дата-центры / Энергия", count: 5, color: "#84cc16" },
  { theme: "Рынок труда AI", count: 4, color: "#a855f7" },
];

// Timeline of key events
export const KEY_EVENTS = [
  { date: "Jan 30", event: "Amazon: план капзатрат $200 млрд на дата-центры", level: 9, type: "investment" },
  { date: "Jan 30", event: "Nvidia: техподдержка DeepSeek — обвинения в содействии", level: 8, type: "geopolitics" },
  { date: "Jan 31", event: "Nvidia инвестирует в OpenAI — крупнейшая инвестиция", level: 9, type: "investment" },
  { date: "Jan 31", event: "OpenAI Prism — vibe coding для науки", level: 6, type: "product" },
  { date: "Feb 1", event: "DHS использует Google Veo 3 для публичных материалов", level: 8, type: "government" },
  { date: "Feb 3", event: "Калифорния: регулирование AI для юристов", level: 8, type: "regulation" },
  { date: "Feb 5", event: "OpenAI Frontier — платформа для AI coworkers", level: 5, type: "product" },
  { date: "Feb 5", event: "Goodfire: $1.25B оценка за интерпретируемость моделей", level: 6, type: "investment" },
  { date: "Feb 5", event: "Alphabet: рекордные капзатраты на AI-инфраструктуру", level: 9, type: "investment" },
  { date: "Feb 6", event: "Big Tech: $650 млрд суммарных AI-капзатрат в 2026", level: 9, type: "investment" },
  { date: "Feb 6", event: "Чип-индустрия выходит на $1 трлн выручки", level: 4, type: "milestone" },
  { date: "Feb 7", event: "Anthropic: раунд >$20 млрд", level: 9, type: "investment" },
  { date: "Feb 7", event: "Coursera + Udemy: слияние для AI-обучения", level: 3, type: "product" },
  { date: "Feb 7", event: "Малайзия: первый протест против дата-центров", level: 1, type: "social" },
  { date: "Feb 10", event: "BNP Paribas — Mistral AI: 3-летний контракт", level: 5, type: "partnership" },
  { date: "Feb 11", event: "Cisco: margin squeeze из-за цен на memory", level: 5, type: "market" },
  { date: "Feb 12", event: "Samsung: начало коммерческих поставок HBM4", level: 4, type: "milestone" },
  { date: "Feb 12", event: "Nscale: $1.4B chip-loan под лизинг GPU", level: 9, type: "investment" },
  { date: "Feb 12", event: "Check Point: рекордные billings $1B на фоне AI-спроса", level: 5, type: "market" },
  { date: "Feb 12", event: "Китайские open-weight модели обгоняют западные по загрузкам", level: 8, type: "milestone" },
];

export const EVENT_TYPE_COLORS: Record<string, string> = {
  investment: "#22d3ee",
  product: "#10b981",
  regulation: "#f59e0b",
  geopolitics: "#ef4444",
  government: "#8b5cf6",
  milestone: "#f97316",
  social: "#ec4899",
  partnership: "#06b6d4",
  market: "#a855f7",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  investment: "Инвестиции",
  product: "Продукт",
  regulation: "Регулирование",
  geopolitics: "Геополитика",
  government: "Государство",
  milestone: "Веха",
  social: "Социальное",
  partnership: "Партнёрство",
  market: "Рынок",
};
