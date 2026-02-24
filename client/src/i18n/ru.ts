/*
 * Russian translation dictionary (default language)
 * All UI strings for the AI Strategic Intelligence Dashboard
 */
export const ru = {
  // ===== Header / Nav =====
  nav: {
    overview: "Обзор",
    trends: "Тренды",
    signals: "Сигналы",
    insights: "Инсайты",
    programs: "Программы",
    news: "Новости",
  },
  header: {
    title: "AI Strategic Intelligence",
    subtitle: "verkhovskiy.ai",
    pdfExport: "PDF",
    pdfExportTitle: "Экспорт в PDF",
    pdfExportError: "Ошибка экспорта PDF. Попробуйте ещё раз.",
  },

  // ===== Filter Bar =====
  filter: {
    searchPlaceholder: "Поиск по событиям...",
    allLevels: "Все уровни",
    levelPrefix: "Ур.",
    clearFilters: "Сбросить",
    cptLevels: {
      9: { name: "Денежная система", short: "Капитал" },
      8: { name: "Институты спонтанного порядка", short: "Институты" },
      7: { name: "Производство знаний", short: "Знания" },
      6: { name: "Технологии производства", short: "Технологии" },
      5: { name: "Разделение труда между фирмами", short: "Value Chain" },
      4: { name: "Железные технологии", short: "Hardware" },
      3: { name: "Социально-профессиональная структура", short: "Профессии" },
      2: { name: "Пространственная организация", short: "География" },
      1: { name: "Природные ресурсы", short: "Ресурсы" },
    } as Record<number, { name: string; short: string }>,
  },

  // ===== Metrics Bar (Hero) =====
  metrics: {
    sectionLabel: "Интегрированный стратегический отчёт",
    title: "AI Daily Reports",
    descLive: "Анализ по Структуре Разделения Труда (СРТ) в сфере AI, технологий и кибербезопасности.",
    descLiveDate: "Дата отчёта:",
    descStatic: "Агрегированный анализ",
    descStaticReports: "14 ежедневных отчётов",
    descStaticSuffix: "по Структуре Разделения Труда (СРТ) в сфере AI, технологий и кибербезопасности.",
    descStaticPeriod: "Период:",
    descStaticDates: "30 января — 12 февраля 2026",
    focusOfDay: "Фокус дня:",
    metricLabels: {
      "Отчётов": "Отчётов",
      "Уникальных событий": "Уникальных событий",
      "Структурных сдвигов": "Структурных сдвигов",
      "Слабых сигналов": "Слабых сигналов",
      "Компаний упомянуто": "Компаний упомянуто",
      "Источников": "Источников",
      "Событий": "Событий",
      "Сдвигов": "Сдвигов",
      "Сигналов": "Сигналов",
      "Связей": "Связей",
      "Компаний": "Компаний",
    } as Record<string, string>,
  },

  // ===== Hero Summary =====
  hero: {
    topEventsLabel: "Топ-события дня",
    topEventsLive: "LIVE",
    readMore: "Подробнее",
    collapse: "Свернуть",
    sourceLabel: "Источники",
    noEvents: "Нет данных о событиях",
    levelPrefix: "Ур.",
  },

  // ===== News Ticker =====
  ticker: {
    live: "LIVE",
    msk: "MSK",
    local: "LOCAL",
  },

  // ===== Latest News =====
  latestNews: {
    title: "Все события",
    moreEvents: "ещё {count} событий",
    collapse: "Свернуть",
    showMore: "Показать ещё {count}",
    levelPrefix: "Ур.",
  },

  // ===== Heatmap =====
  heatmap: {
    sectionLabel: "Тепловая карта активности",
    title: "Интенсивность по уровням СРТ",
    description: "Количество значимых событий по каждому уровню Структуры Разделения Труда за каждый день отчётного периода.",
    legendUpper: "Надстройка (9-7)",
    legendMiddle: "Технологии (6-4)",
    legendLower: "Базис (3-1)",
    intensityLabel: "Инт.:",
    tooltipEvents: "Событий:",
  },

  // ===== Theme Frequency =====
  themeFrequency: {
    sectionLabel: "Частотный анализ",
    title: "Ключевые темы периода",
  },

  // ===== Top Companies =====
  topCompanies: {
    sectionLabel: "Ключевые игроки",
    title: "Топ компаний по упоминаниям",
  },

  // ===== Timeline =====
  timeline: {
    sectionLabel: "Хронология событий",
    title: "Ключевые события периода",
    description: "Наиболее значимые события, зафиксированные в ежедневных отчётах.",
    levelPrefix: "Ур.",
    eventTypes: {
      investment: "Инвестиции",
      product: "Продукт",
      regulation: "Регулирование",
      geopolitics: "Геополитика",
      government: "Государство",
      milestone: "Веха",
      social: "Социальное",
      partnership: "Партнёрство",
      market: "Рынок",
    } as Record<string, string>,
  },

  // ===== Trend Charts =====
  trends: {
    sectionLabel: "Динамика трендов",
    title: "Моментум структурных сдвигов",
    description: "Визуальная динамика ключевых трендов за отчётный период. Интенсивность рассчитана по уровням СРТ.",
    acceleratingTitle: "Набирающие обороты",
    acceleratingSub: "Accelerating / Emerging",
    deceleratingTitle: "Затухающие",
    deceleratingSub: "Decelerating / Freezing",
    trendsCount: "{count} трендов",
    trendLabels: {
      accelerating: "Ускоряется",
      emerging: "Формируется",
      decelerating: "Замедляется",
      freezing: "Замораживается",
    } as Record<string, string>,
    mentions: "упом.",
    momentum: "Моментум:",
    rationale: "Обоснование",
    showRationale: "Подробнее",
    hideRationale: "Свернуть",
    structuralShift: "Структурный сдвиг",
    shiftFrom: "От:",
    shiftTo: "К:",
    noData: "Нет данных о трендах. Данные появятся после генерации отчёта.",
    dataPoints: "точ. данных",
  },

  // ===== Structural Shifts =====
  shifts: {
    sectionLabel: "Структурные сдвиги",
    title: "Ключевые структурные сдвиги",
    description: "Фундаментальные изменения в структуре AI-индустрии, выявленные за отчётный период.",
    fromLabel: "ОТ:",
    toLabel: "К:",
    mechanismLabel: "Механизм:",
    frequencyLabel: "Частота упоминаний:",
    trendLabels: {
      accelerating: "Ускоряется",
      emerging: "Формируется",
      decelerating: "Замедляется",
    } as Record<string, string>,
    noShifts: "Нет данных о структурных сдвигах для выбранных фильтров.",
    programsLabel: "Программы СКОЛКОВО:",
  },

  // ===== Weak Signals =====
  signals: {
    sectionLabel: "Радар слабых сигналов",
    title: "Слабые сигналы",
    description: "Ранние индикаторы потенциальных изменений, требующие мониторинга.",
    urgencyHigh: "Высокая",
    urgencyMedium: "Средняя",
    urgencyLow: "Низкая",
    noSignals: "Нет данных о слабых сигналах для выбранных фильтров.",
    programsLabel: "Программы СКОЛКОВО:",
  },

  // ===== Cross-Level Connections =====
  crossLevel: {
    sectionLabel: "Межуровневые связи",
    title: "Каскадные эффекты между уровнями СРТ",
    description: "Ключевые причинно-следственные цепочки, связывающие события на разных уровнях.",
  },

  // ===== Strategic Insights =====
  insights: {
    sectionLabel: "Стратегические инсайты",
    title: "Аналитические выводы",
    description: "Ключевые стратегические наблюдения, извлечённые из анализа данных.",
    implication: "Импликация:",
    noInsights: "Нет данных об инсайтах для выбранных фильтров.",
    programsLabel: "Программы СКОЛКОВО:",
  },

  // ===== Nodal Positions =====
  nodal: {
    sectionLabel: "Сводная карта",
    title: "5 узловых позиций AI-экономики 2026",
    description: "Ключевые узлы, за контроль которых идёт основная борьба в AI-индустрии.",
    controllers: "Кто контролирует:",
    stakes: "Что на кону:",
  },

  // ===== Education Recommendations =====
  education: {
    title: "Рекомендации для образовательных программ",
    subtitle: "На основании выявленных инсайтов",
  },

  // ===== SKOLKOVO Recommendations =====
  skolkovo: {
    sectionLabel: "Программы СКОЛКОВО",
    title: "Рекомендации программ СКОЛКОВО",
    description: "Программы, наиболее релевантные выявленным трендам и сигналам.",
    noPrograms: "Нет программ для отображения.",
    relevance: "Релевантность:",
    progressionPath: "Путь развития →",
    contentRecsTitle: "Рекомендации по содержанию программ",
  },

  // ===== Forecasts =====
  forecasts: {
    sectionLabel: "Прогнозы",
    title: "Прогнозы на основе трендов",
    description: "Автоматические прогнозы на основе анализа динамики событий по уровням СРТ.",
    noData: "Недостаточно данных для прогнозов.",
    confidence: "Уверенность:",
    levelNames: {
      9: "Капитал", 8: "Институты", 7: "Знания", 6: "Технологии",
      5: "Value Chain", 4: "Hardware", 3: "Профессии", 2: "География", 1: "Ресурсы",
    } as Record<number, string>,
    activityGrowth: "рост",
    activityDecline: "снижение",
    activityLabel: "активности",
    levelPrefix: "Ур.",
    growthExpected: "Ожидается продолжение роста событий на уровне",
    declineExpected: "Активность на уровне",
    declineSuffix: "снижается",
    stabilization: "Возможна стабилизация.",
    reportsCount: "отчётов",
    trendLabel: "тренд",
    crossLevelTitle: "Усиление межуровневых связей",
    crossLevelDesc: "Количество межуровневых связей растёт, что указывает на системную интеграцию трендов.",
    crossLevelBased: "связей в последнем отчёте",
  },

  // ===== Week-over-Week =====
  weekOverWeek: {
    sectionLabel: "Сравнение недель",
    title: "Week-over-Week",
    description: "Сравнение ключевых метрик между неделей {prev} и неделей {current}.",
    noData: "Недостаточно данных для сравнения недель. Нужно минимум 2 отчёта из разных недель.",
    totalEvents: "Всего событий",
    avgPerDay: "Среднее/день",
    topLevelsWeek: "Топ уровни (нед. {week})",
    was: "Было:",
    weekLabel: "нед.",
    weekPrefix: "Неделя",
    reportsCount: "отчётов",
    levelPrefix: "Ур.",
    levelNames: {
      9: "Капитал", 8: "Институты", 7: "Знания", 6: "Технологии",
      5: "Value Chain", 4: "Hardware", 3: "Профессии", 2: "География", 1: "Ресурсы",
    } as Record<number, string>,
  },

  // ===== Programs Section =====
  programs: {
    sectionLabel: "Программы СКОЛКОВО",
    title: "Образовательные программы",
    description: "Программы Школы управления СКОЛКОВО, релевантные выявленным трендам.",
  },

  // ===== Footer =====
  footer: {
    poweredBy: "Создано на основе AI-аналитики",
    disclaimer: "Данные обновляются ежедневно. Аналитика генерируется автоматически.",
    copyright: "© {year} AI Strategic Intelligence Dashboard",
  },

  // ===== Common =====
  common: {
    loading: "Загрузка...",
    error: "Ошибка загрузки данных",
    noData: "Нет данных",
    showAll: "Показать все",
    collapse: "Свернуть",
    levelPrefix: "Ур.",
  },
};
