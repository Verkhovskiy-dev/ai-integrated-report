/*
 * English translation dictionary
 * All UI strings for the AI Strategic Intelligence Dashboard
 */
import type { ru } from "./ru";

export const en: typeof ru = {
  // ===== Header / Nav =====
  nav: {
    overview: "Overview",
    trends: "Trends",
    signals: "Signals",
    insights: "Insights",
    programs: "Programs",
    news: "News",
  },
  header: {
    title: "AI Strategic Intelligence",
    subtitle: "verkhovskiy.ai",
    pdfExport: "PDF",
    pdfExportTitle: "Export to PDF",
    pdfExportError: "PDF export failed. Please try again.",
  },

  // ===== Filter Bar =====
  filter: {
    searchPlaceholder: "Search events...",
    allLevels: "All levels",
    levelPrefix: "L",
    clearFilters: "Reset",
    cptLevels: {
      9: { name: "Monetary System", short: "Capital" },
      8: { name: "Institutions of Spontaneous Order", short: "Institutions" },
      7: { name: "Knowledge Production", short: "Knowledge" },
      6: { name: "Production Technologies", short: "Technologies" },
      5: { name: "Inter-firm Division of Labor", short: "Value Chain" },
      4: { name: "Hardware Technologies", short: "Hardware" },
      3: { name: "Socio-professional Structure", short: "Professions" },
      2: { name: "Spatial Organization", short: "Geography" },
      1: { name: "Natural Resources", short: "Resources" },
    } as Record<number, { name: string; short: string }>,
  },

  // ===== Metrics Bar (Hero) =====
  metrics: {
    sectionLabel: "Integrated Strategic Report",
    title: "AI Daily Reports",
    descLive: "Analysis based on the Division of Labor Structure (DLS) in AI, technology, and cybersecurity.",
    descLiveDate: "Report date:",
    descStatic: "Aggregated analysis of",
    descStaticReports: "14 daily reports",
    descStaticSuffix: "based on the Division of Labor Structure (DLS) in AI, technology, and cybersecurity.",
    descStaticPeriod: "Period:",
    descStaticDates: "January 30 — February 12, 2026",
    focusOfDay: "Focus of the day:",
    metricLabels: {
      "Отчётов": "Reports",
      "Уникальных событий": "Unique Events",
      "Структурных сдвигов": "Structural Shifts",
      "Слабых сигналов": "Weak Signals",
      "Компаний упомянуто": "Companies Mentioned",
      "Источников": "Sources",
      "Событий": "Events",
      "Сдвигов": "Shifts",
      "Сигналов": "Signals",
      "Связей": "Links",
      "Компаний": "Companies",
    } as Record<string, string>,
  },

  // ===== Hero Summary =====
  hero: {
    topEventsLabel: "Top Events of the Day",
    topEventsLive: "LIVE",
    readMore: "Read more",
    collapse: "Collapse",
    sourceLabel: "Sources",
    noEvents: "No event data available",
    levelPrefix: "L",
  },

  // ===== News Ticker =====
  ticker: {
    live: "LIVE",
    msk: "MSK",
    local: "LOCAL",
  },

  // ===== Latest News =====
  latestNews: {
    title: "All Events",
    moreEvents: "{count} more events",
    collapse: "Collapse",
    showMore: "Show {count} more",
    levelPrefix: "L",
  },

  // ===== Heatmap =====
  heatmap: {
    sectionLabel: "Activity Heatmap",
    title: "Intensity by DLS Levels",
    description: "Number of significant events per Division of Labor Structure level for each day of the reporting period.",
    legendUpper: "Superstructure (9-7)",
    legendMiddle: "Technologies (6-4)",
    legendLower: "Foundation (3-1)",
    intensityLabel: "Int.:",
    tooltipEvents: "Events:",
  },

  // ===== Theme Frequency =====
  themeFrequency: {
    sectionLabel: "Frequency Analysis",
    title: "Key Themes of the Period",
  },

  // ===== Top Companies =====
  topCompanies: {
    sectionLabel: "Key Players",
    title: "Top Companies by Mentions",
  },

  // ===== Timeline =====
  timeline: {
    sectionLabel: "Event Timeline",
    title: "Key Events of the Period",
    description: "The most significant events recorded in daily reports.",
    levelPrefix: "L",
    eventTypes: {
      investment: "Investment",
      product: "Product",
      regulation: "Regulation",
      geopolitics: "Geopolitics",
      government: "Government",
      milestone: "Milestone",
      social: "Social",
      partnership: "Partnership",
      market: "Market",
    } as Record<string, string>,
  },

  // ===== Trend Charts =====
  trends: {
    sectionLabel: "Trend Dynamics",
    title: "Structural Shift Momentum",
    description: "Visual dynamics of key trends over the reporting period. Intensity is calculated by DLS levels.",
    acceleratingTitle: "Gaining Momentum",
    acceleratingSub: "Accelerating / Emerging",
    deceleratingTitle: "Fading",
    deceleratingSub: "Decelerating / Freezing",
    trendsCount: "{count} trends",
    trendLabels: {
      accelerating: "Accelerating",
      emerging: "Emerging",
      decelerating: "Decelerating",
      freezing: "Freezing",
    } as Record<string, string>,
    mentions: "mentions",
    momentum: "Momentum:",
  },

  // ===== Structural Shifts =====
  shifts: {
    sectionLabel: "Structural Shifts",
    title: "Key Structural Shifts",
    description: "Fundamental changes in the AI industry structure identified during the reporting period.",
    fromLabel: "FROM:",
    toLabel: "TO:",
    mechanismLabel: "Mechanism:",
    frequencyLabel: "Mention frequency:",
    trendLabels: {
      accelerating: "Accelerating",
      emerging: "Emerging",
      decelerating: "Decelerating",
    } as Record<string, string>,
    noShifts: "No structural shift data for the selected filters.",
    programsLabel: "SKOLKOVO Programs:",
  },

  // ===== Weak Signals =====
  signals: {
    sectionLabel: "Weak Signals Radar",
    title: "Weak Signals",
    description: "Early indicators of potential changes that require monitoring.",
    urgencyHigh: "High",
    urgencyMedium: "Medium",
    urgencyLow: "Low",
    noSignals: "No weak signal data for the selected filters.",
    programsLabel: "SKOLKOVO Programs:",
  },

  // ===== Cross-Level Connections =====
  crossLevel: {
    sectionLabel: "Cross-Level Connections",
    title: "Cascading Effects Between DLS Levels",
    description: "Key cause-and-effect chains linking events across different levels.",
  },

  // ===== Strategic Insights =====
  insights: {
    sectionLabel: "Strategic Insights",
    title: "Analytical Conclusions",
    description: "Key strategic observations extracted from data analysis.",
    implication: "Implication:",
    noInsights: "No insight data for the selected filters.",
    programsLabel: "SKOLKOVO Programs:",
  },

  // ===== Nodal Positions =====
  nodal: {
    sectionLabel: "Summary Map",
    title: "5 Nodal Positions of the AI Economy 2026",
    description: "Key nodes where the main competition in the AI industry is concentrated.",
    controllers: "Controlled by:",
    stakes: "At stake:",
  },

  // ===== Education Recommendations =====
  education: {
    title: "Recommendations for Educational Programs",
    subtitle: "Based on identified insights",
  },

  // ===== SKOLKOVO Recommendations =====
  skolkovo: {
    sectionLabel: "SKOLKOVO Programs",
    title: "SKOLKOVO Program Recommendations",
    description: "Programs most relevant to identified trends and signals.",
    noPrograms: "No programs to display.",
    relevance: "Relevance:",
    progressionPath: "Development Path →",
    contentRecsTitle: "Program Content Recommendations",
  },

  // ===== Forecasts =====
  forecasts: {
    sectionLabel: "Forecasts",
    title: "Trend-Based Forecasts",
    description: "Automated forecasts based on event dynamics analysis by DLS levels.",
    noData: "Insufficient data for forecasts.",
    confidence: "Confidence:",
    levelNames: {
      9: "Capital", 8: "Institutions", 7: "Knowledge", 6: "Technologies",
      5: "Value Chain", 4: "Hardware", 3: "Professions", 2: "Geography", 1: "Resources",
    } as Record<number, string>,
    activityGrowth: "growth",
    activityDecline: "decline",
    activityLabel: "in activity",
    levelPrefix: "L",
    growthExpected: "Continued growth of events at the level is expected",
    declineExpected: "Activity at the level",
    declineSuffix: "is declining",
    stabilization: "Stabilization is possible.",
    reportsCount: "reports",
    trendLabel: "trend",
    crossLevelTitle: "Strengthening cross-level connections",
    crossLevelDesc: "The number of cross-level connections is growing, indicating systemic trend integration.",
    crossLevelBased: "connections in the latest report",
  },

  // ===== Week-over-Week =====
  weekOverWeek: {
    sectionLabel: "Week Comparison",
    title: "Week-over-Week",
    description: "Comparison of key metrics between week {prev} and week {current}.",
    noData: "Insufficient data for week comparison. At least 2 reports from different weeks are required.",
    totalEvents: "Total Events",
    avgPerDay: "Avg/Day",
    topLevelsWeek: "Top Levels (wk {week})",
    was: "Was:",
    weekLabel: "wk",
    weekPrefix: "Week",
    reportsCount: "reports",
    levelPrefix: "L",
    levelNames: {
      9: "Capital", 8: "Institutions", 7: "Knowledge", 6: "Technologies",
      5: "Value Chain", 4: "Hardware", 3: "Professions", 2: "Geography", 1: "Resources",
    } as Record<number, string>,
  },

  // ===== Programs Section =====
  programs: {
    sectionLabel: "SKOLKOVO Programs",
    title: "Educational Programs",
    description: "SKOLKOVO School of Management programs relevant to identified trends.",
  },

  // ===== Footer =====
  footer: {
    poweredBy: "Powered by AI Analytics",
    disclaimer: "Data is updated daily. Analytics are generated automatically.",
    copyright: "© {year} AI Strategic Intelligence Dashboard",
  },

  // ===== Common =====
  common: {
    loading: "Loading...",
    error: "Data loading error",
    noData: "No data",
    showAll: "Show all",
    collapse: "Collapse",
    levelPrefix: "L",
  },
};
