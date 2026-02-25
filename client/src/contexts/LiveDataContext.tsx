/*
 * LiveDataContext: Fetches latest-report.json and archive data,
 * transforms them into the format expected by dashboard components,
 * and falls back to static data from reportData.ts if unavailable.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "./I18nContext";
import {
  HEATMAP_DATA as STATIC_HEATMAP,
  KEY_METRICS as STATIC_METRICS,
  STRUCTURAL_SHIFTS as STATIC_SHIFTS,
  WEAK_SIGNALS as STATIC_SIGNALS,
  CROSS_LEVEL_CONNECTIONS as STATIC_CONNECTIONS,
  THEME_FREQUENCY as STATIC_THEMES,
  KEY_EVENTS as STATIC_EVENTS,
  TOP_COMPANIES as STATIC_COMPANIES,
} from "@/data/reportData";
import { STRATEGIC_INSIGHTS as STATIC_INSIGHTS, type StrategicInsight } from "@/data/insightsData";

// === Types matching the JSON from n8n ===
interface ReportEvent {
  title: string;
  description: string;
  sources: string[];
}

interface SrtLevel {
  level: number;
  name: string;
  events: ReportEvent[];
  event_count: number;
}

interface CrossLevelLink {
  title: string;
  description: string;
  levels: number[];
  sources: string[];
}

interface StructuralShift {
  title: string;
  from: string;
  to: string;
  through: string;
  levels: number[];
  trend: string;
  sources: string[];
}

interface RadarSignal {
  title: string;
  description: string;
  level_group: string;
  level_range: string;
  sources: string[];
}

interface ReportMetrics {
  total_events: number;
  events_by_level: Record<string, number>;
  total_sources: number;
  structural_shifts_count: number;
  radar_signals_count: number;
  cross_level_links_count: number;
}

// === Known field names that should NEVER be trend names ===
const INVALID_TREND_NAMES = new Set([
  'Моментум', 'Обоснование', 'Уровни СРТ', 'Категория',
  'momentum', 'rationale', 'levels', 'category', 'name',
  'sources', 'Источники',
]);

/** Validate a single trend entry: must have a real name and numeric momentum */
function isValidTrend(t: any): t is ReportTrend {
  if (!t || typeof t !== 'object') return false;
  if (typeof t.name !== 'string' || t.name.trim().length === 0) return false;
  if (INVALID_TREND_NAMES.has(t.name.trim())) return false;
  if (typeof t.momentum !== 'number' || !isFinite(t.momentum)) return false;
  return true;
}

/**
 * Sanitize a trends field: ensure it's an array of valid trend objects.
 * Handles cases where trends is an object (single trend) instead of array,
 * or where field names leak in as trend entries.
 */
function sanitizeTrends(raw: any): ReportTrend[] {
  if (!raw) return [];
  let arr: any[];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === 'object' && raw.name && typeof raw.momentum === 'number') {
    // Single trend object instead of array — wrap it
    arr = [raw];
  } else if (typeof raw === 'object') {
    // Object whose keys might be trend objects — try to extract values
    arr = Object.values(raw);
  } else {
    return [];
  }
  return arr.filter(isValidTrend);
}

// === Momentum types ===
export interface MomentumTrend {
  name: string;
  momentum: number;
  rationale: string;
  levels: number[];
  category: string;
}

export interface MomentumEntry {
  date: string;
  generated_at: string;
  trends: MomentumTrend[];
}

// === Trend from report.trends[] ===
export interface ReportTrend {
  name: string;
  momentum: number;
  rationale: string;
  levels: number[];
  category: string;
}

// === Raw structural shift (from/to only, no title/trend) ===
export interface RawStructuralShift {
  from: string;
  to: string;
  levels: number[];
  sources: string[];
}

// === Transformed trend for TrendCharts ===
export interface TrendDynamic {
  id: number;
  name: string;
  momentum: number;
  rationale: string;
  levels: number[];
  category: string; // accelerating | emerging | decelerating
  // Matched structural shift context (for decelerating trends)
  shiftFrom?: string;
  shiftTo?: string;
}

export interface LiveReport {
  date: string;
  generated_at: string;
  key_focus: string;
  srt_levels: SrtLevel[];
  cross_level_links: CrossLevelLink[];
  structural_shifts: StructuralShift[];
  radar_signals: RadarSignal[];
  metrics: ReportMetrics;
  trends?: ReportTrend[];
}

// === Dashboard-compatible types ===
export interface DashboardData {
  isLive: boolean;
  loading: boolean;
  error: string | null;
  latestReport: LiveReport | null;
  archiveReports: LiveReport[];
  reportDate: string;
  keyFocus: string;

  // Transformed data for components
  heatmapData: typeof STATIC_HEATMAP;
  keyMetrics: typeof STATIC_METRICS;
  structuralShifts: typeof STATIC_SHIFTS;
  weakSignals: typeof STATIC_SIGNALS;
  crossLevelConnections: typeof STATIC_CONNECTIONS;
  themeFrequency: typeof STATIC_THEMES;
  keyEvents: typeof STATIC_EVENTS;
  topCompanies: typeof STATIC_COMPANIES;

  // Dynamic insights from insights.json
  strategicInsights: StrategicInsight[];
  insightsPeriod: string;
  insightsGeneratedAt: string;
  insightsLive: boolean;

  // Dynamic momentum data from momentum.json
  momentumData: MomentumEntry[];
  momentumLive: boolean;

  // Trend dynamics from report.trends[]
  trendDynamics: TrendDynamic[];
  trendDynamicsLive: boolean;
  // Raw structural shifts for context matching
  rawStructuralShifts: RawStructuralShift[];
}

const LiveDataContext = createContext<DashboardData | null>(null);

// Determine base path for fetching data
function getBasePath(): string {
  // In production (GitHub Pages), base is /ai-integrated-report/
  // In dev, base is /
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : base + "/";
}

// Transform live report into structural shifts format
function transformShifts(report: LiveReport) {
  return (report.structural_shifts || []).map((shift, idx) => ({
    id: idx + 1,
    title: shift.title,
    from: shift.from || "",
    to: shift.to || "",
    mechanism: shift.through || "",
    levels: shift.levels && shift.levels.length > 0 ? shift.levels : [5, 6],
    frequency: Math.max(1, Math.round((report.metrics?.total_events || 1) / Math.max(1, (report.structural_shifts || []).length))),
    trend: shift.trend as "accelerating" | "emerging" | "decelerating",
    relevantPrograms: [] as string[],
  }));
}

// Transform live report into weak signals format
function transformSignals(report: LiveReport) {
  const levelGroupToLevel: Record<string, number[]> = {
    upper: [9, 8, 7],
    middle: [6, 5, 4],
    lower: [3, 2, 1],
  };

  return (report.radar_signals || []).map((signal, idx) => {
    const groupLevels = levelGroupToLevel[signal.level_group] || [5];
    const level = groupLevels[idx % groupLevels.length] || groupLevels[0];
    return {
      id: idx + 1,
      title: signal.title,
      level,
      urgency: signal.level_group === "upper" ? "high" : "medium",
      description: signal.description,
    };
  });
}

// Transform live report into cross-level connections format
function transformConnections(report: LiveReport) {
  return (report.cross_level_links || []).map((link, idx) => {
    const levels = link.levels && link.levels.length > 0 ? link.levels : [5, 9];
    const from = levels[0] || 5;
    const to = levels[levels.length - 1] || 9;
    const through = levels.slice(1, -1);
    return {
      id: idx + 1,
      title: link.title,
      from,
      to,
      through,
      description: link.description,
    };
  });
}

// Build heatmap from archive + latest
function buildHeatmap(reports: LiveReport[], latest: LiveReport) {
  const allReports = [...reports.filter(r => r.date !== latest.date), latest]
    .sort((a, b) => a.date.localeCompare(b.date));

  // Use last 14 reports max
  const recentReports = allReports.slice(-14);

  if (recentReports.length === 0) return STATIC_HEATMAP;

  return recentReports.map((r) => {
    const d = new Date(r.date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateLabel = `${months[d.getMonth()]} ${d.getDate()}`;
    const levels: Record<number, number> = {};
    for (let lvl = 1; lvl <= 9; lvl++) {
      const srtLevel = r.srt_levels.find((l) => l.level === lvl);
      levels[lvl] = srtLevel?.event_count || 0;
    }
    return { date: dateLabel, levels };
  });
}

// Build key events from latest report
function buildKeyEvents(report: LiveReport) {
  const events: typeof STATIC_EVENTS = [];
  const d = new Date(report.date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateLabel = `${months[d.getMonth()]} ${d.getDate()}`;

  for (const srtLevel of report.srt_levels) {
    for (const event of srtLevel.events) {
      events.push({
        date: dateLabel,
        event: event.title,
        level: srtLevel.level,
        type: guessEventType(event.title, event.description),
      });
    }
  }
  return events.length > 0 ? events : STATIC_EVENTS;
}

function guessEventType(title: string, desc: string): string {
  const text = (title + " " + desc).toLowerCase();
  if (/инвестиц|funding|ipo|капитал|bond|долг|финанс/i.test(text)) return "investment";
  if (/регулир|закон|eu|act|gdpr|compliance/i.test(text)) return "regulation";
  if (/геополит|санкц|китай|сша|china|us/i.test(text)) return "geopolitics";
  if (/государств|правительств|dhs|gov/i.test(text)) return "government";
  if (/рекорд|milestone|$1t|первый|launch/i.test(text)) return "milestone";
  if (/протест|бойкот|social|общест/i.test(text)) return "social";
  if (/партнёр|контракт|сделк/i.test(text)) return "partnership";
  if (/рынок|market|маржа|цен/i.test(text)) return "market";
  return "product";
}

// Build theme frequency from events
function buildThemeFrequency(report: LiveReport, locale: string = 'ru') {
  const themeKeywordsRu: Record<string, string[]> = {
    "Безопасность агентов": ["безопасност", "security", "injection", "guardrail", "audit"],
    "AI-CapEx / Инфраструктура": ["capex", "инфраструктур", "дата-центр", "data center", "dc"],
    "Чипы и память (HBM)": ["чип", "chip", "hbm", "память", "memory", "полупроводник"],
    "Open-weight модели": ["open-weight", "open-source", "open source", "deepseek", "llama"],
    "Регулирование AI": ["регулир", "закон", "regulation", "compliance", "eu ai act"],
    "Геополитика (США-Китай)": ["геополит", "китай", "china", "сша", "us-china", "санкц"],
    "Агентные платформы": ["агент", "agent", "agentic", "mcp", "platform"],
    "Кибербезопасность": ["кибер", "cyber", "хакер", "hack", "malware", "phishing"],
    "Дата-центры / Энергия": ["энерг", "energy", "cooling", "power", "электр"],
    "Рынок труда AI": ["труд", "labor", "профессии", "jobs", "hiring", "layoff"],
  };
  const themeKeywordsEn: Record<string, string[]> = {
    "Agent Safety": ["safety", "security", "injection", "guardrail", "audit"],
    "AI-CapEx / Infrastructure": ["capex", "infrastructure", "data center", "dc", "compute"],
    "Chips & Memory (HBM)": ["chip", "hbm", "memory", "semiconductor", "gpu"],
    "Open-weight Models": ["open-weight", "open-source", "open source", "deepseek", "llama"],
    "AI Regulation": ["regulat", "law", "compliance", "eu ai act", "govern"],
    "Geopolitics (US-China)": ["geopolit", "china", "us-china", "sanction", "tariff"],
    "Agentic Platforms": ["agent", "agentic", "mcp", "platform", "tool"],
    "Cybersecurity": ["cyber", "hack", "malware", "phishing", "threat"],
    "Data Centers / Energy": ["energy", "cooling", "power", "electric", "data center"],
    "AI Labor Market": ["labor", "jobs", "hiring", "layoff", "workforce"],
  };
  const themeKeywords = locale === 'en' ? themeKeywordsEn : themeKeywordsRu;

  const colors = ["#ef4444", "#22d3ee", "#f59e0b", "#10b981", "#8b5cf6", "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#a855f7"];

  const allText = report.srt_levels
    .flatMap((l) => l.events.map((e) => e.title + " " + e.description))
    .join(" ")
    .toLowerCase();

  const results = Object.entries(themeKeywords).map(([theme, keywords], idx) => {
    const count = keywords.reduce((sum, kw) => {
      const regex = new RegExp(kw, "gi");
      const matches = allText.match(regex);
      return sum + (matches ? matches.length : 0);
    }, 0);
    return { theme, count: Math.max(count, 1), color: colors[idx % colors.length] };
  });

  results.sort((a, b) => b.count - a.count);
  return results.length > 0 ? results : STATIC_THEMES;
}

// Build top companies from events
function buildTopCompanies(report: LiveReport) {
  const companyPatterns: Record<string, { regex: RegExp; category: string }> = {
    Nvidia: { regex: /nvidia/gi, category: "Hardware" },
    OpenAI: { regex: /openai/gi, category: "Models" },
    "Google/Alphabet": { regex: /google|alphabet|deepmind/gi, category: "Platform" },
    "Amazon/AWS": { regex: /amazon|aws/gi, category: "Cloud" },
    Microsoft: { regex: /microsoft|azure/gi, category: "Cloud" },
    Apple: { regex: /apple/gi, category: "Devices" },
    Samsung: { regex: /samsung/gi, category: "Memory" },
    Anthropic: { regex: /anthropic|claude/gi, category: "Models" },
    Meta: { regex: /\bmeta\b|llama/gi, category: "Platform" },
    DeepSeek: { regex: /deepseek/gi, category: "Models" },
    "Mistral AI": { regex: /mistral/gi, category: "Models" },
    Cisco: { regex: /cisco/gi, category: "Infrastructure" },
  };

  const allText = report.srt_levels
    .flatMap((l) => l.events.map((e) => e.title + " " + e.description))
    .join(" ");

  const results = Object.entries(companyPatterns)
    .map(([name, { regex, category }]) => {
      const matches = allText.match(regex);
      return { name, mentions: matches ? matches.length : 0, trend: "stable" as const, category };
    })
    .filter((c) => c.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions);

  return results.length > 0 ? results : STATIC_COMPANIES;
}

// Build key metrics
function buildKeyMetrics(report: LiveReport, locale: string = 'ru') {
  const m = report.metrics || {} as ReportMetrics;
  // Compute from actual data when metrics object is empty
  const totalEvents = m.total_events || report.srt_levels.reduce((sum, l) => sum + (l.event_count || l.events.length), 0);
  const shiftsCount = m.structural_shifts_count || (report.structural_shifts || []).length;
  const signalsCount = m.radar_signals_count || (report.radar_signals || []).length;
  const linksCount = m.cross_level_links_count || (report.cross_level_links || []).length;
  const sourcesCount = m.total_sources || report.srt_levels.reduce((sum, l) => sum + l.events.reduce((s, e) => s + (e.sources || []).length, 0), 0);
  const isEn = locale === 'en';
  return [
    { label: isEn ? "Events" : "Событий", value: totalEvents, suffix: "", icon: "Zap" },
    { label: isEn ? "Structural Shifts" : "Структурных сдвигов", value: shiftsCount, suffix: "", icon: "TrendingUp" },
    { label: isEn ? "Weak Signals" : "Слабых сигналов", value: signalsCount, suffix: "", icon: "Radio" },
    { label: isEn ? "Cross-level Links" : "Межуровневых связей", value: linksCount, suffix: "", icon: "Network" },
    { label: isEn ? "Sources" : "Источников", value: sourcesCount, suffix: sourcesCount > 0 ? "+" : "", icon: "Link" },
    { label: isEn ? "Report Date" : "Дата отчёта", value: 0, suffix: report.date, icon: "FileText" },
  ];
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { locale } = useTranslation();
  const [state, setState] = useState<DashboardData>({
    isLive: false,
    loading: true,
    error: null,
    latestReport: null,
    archiveReports: [],
    reportDate: "",
    keyFocus: "",
    heatmapData: STATIC_HEATMAP,
    keyMetrics: STATIC_METRICS,
    structuralShifts: STATIC_SHIFTS,
    weakSignals: STATIC_SIGNALS,
    crossLevelConnections: STATIC_CONNECTIONS,
    themeFrequency: STATIC_THEMES,
    keyEvents: STATIC_EVENTS,
    topCompanies: STATIC_COMPANIES,
    strategicInsights: STATIC_INSIGHTS,
    insightsPeriod: "",
    insightsGeneratedAt: "",
    insightsLive: false,
    momentumData: [],
    momentumLive: false,
    trendDynamics: [],
    trendDynamicsLive: false,
    rawStructuralShifts: [],
  });

  useEffect(() => {
    async function fetchData() {
      const base = getBasePath();

      try {
        // Fetch latest report (use EN version if locale is EN)
        const reportFile = locale === 'en' ? 'latest-report.en.json' : 'latest-report.json';
        let latestResp = await fetch(`${base}data/${reportFile}`);
        // Fallback to RU version if EN not available
        if (!latestResp.ok && locale === 'en') {
          latestResp = await fetch(`${base}data/latest-report.json`);
        }
        if (!latestResp.ok) throw new Error(`HTTP ${latestResp.status}`);
        const latest: LiveReport = await latestResp.json();

        // Try to fetch archive manifest, then load all archive files
        let archiveReports: LiveReport[] = [];
        try {
          // First try manifest-based loading
          const manifestResp = await fetch(`${base}data/archive/manifest.json`);
          if (manifestResp.ok) {
            const manifest: string[] = await manifestResp.json();
            const archivePromises = manifest.map((filename) =>
              fetch(`${base}data/archive/${filename}`)
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            );
            const results = await Promise.all(archivePromises);
            archiveReports = results.filter((r): r is LiveReport => r !== null);
          } else {
            // Fallback: try fetching by date range
            const latestDate = new Date(latest.date);
            const archivePromises: Promise<LiveReport | null>[] = [];
            for (let i = 1; i <= 30; i++) {
              const d = new Date(latestDate);
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split("T")[0];
              archivePromises.push(
                fetch(`${base}data/archive/${dateStr}.json`)
                  .then((r) => (r.ok ? r.json() : null))
                  .catch(() => null)
              );
            }
            const results = await Promise.all(archivePromises);
            archiveReports = results.filter((r): r is LiveReport => r !== null);
          }
        } catch {
          // Archive not available, that's ok
        }

        // Fetch dynamic insights
        let dynamicInsights: StrategicInsight[] = STATIC_INSIGHTS;
        let insightsPeriod = "";
        let insightsGeneratedAt = "";
        let insightsLive = false;
        try {
          const insightsFile = locale === 'en' ? 'insights.en.json' : 'insights.json';
          let insightsResp = await fetch(`${base}data/${insightsFile}`);
          if (!insightsResp.ok && locale === 'en') {
            insightsResp = await fetch(`${base}data/insights.json`);
          }
          if (insightsResp.ok) {
            const insightsData = await insightsResp.json();
            if (insightsData.insights && Array.isArray(insightsData.insights) && insightsData.insights.length > 0) {
              dynamicInsights = insightsData.insights;
              insightsPeriod = insightsData.period || "";
              insightsGeneratedAt = insightsData.generated_at || "";
              insightsLive = true;
            }
          }
        } catch {
          // insights.json not available, use static fallback
        }

        // Fetch momentum data
        let momentumData: MomentumEntry[] = [];
        let momentumLive = false;
        try {
          const momResp = await fetch(`${base}data/momentum.json`);
          if (momResp.ok) {
            const momJson = await momResp.json();
            if (Array.isArray(momJson) && momJson.length > 0) {
              // Validate each momentum entry's trends array
              momentumData = momJson.map((entry: any) => ({
                ...entry,
                trends: sanitizeTrends(entry.trends),
              })).filter((entry: MomentumEntry) => entry.trends.length > 0);
              momentumLive = momentumData.length > 0;
            }
          }
        } catch {
          // momentum.json not available
        }
        // Fallback: if momentum.json is empty but report has momentum_trends, use those
        if (momentumData.length === 0 && (latest as any).momentum_trends) {
          const fallbackTrends = sanitizeTrends((latest as any).momentum_trends);
          if (fallbackTrends.length > 0) {
            momentumData = [{ date: latest.date, generated_at: latest.generated_at, trends: fallbackTrends }];
            momentumLive = true;
          }
        }

        // Build trendDynamics from report.momentum_trends[] (preferred) or .trends[] (fallback)
        // Always sanitize to filter out malformed entries (field names as trend names, etc.)
        const rawMomentumTrends = sanitizeTrends((latest as any).momentum_trends);
        const rawReportTrends = sanitizeTrends((latest as any).trends);
        // Prefer momentum_trends if it has valid entries; fall back to trends
        const rawTrends: ReportTrend[] = rawMomentumTrends.length > 0 ? rawMomentumTrends : rawReportTrends;

        // Collect structural shifts with from/to from latest + archives
        const allShiftSources = [
          ...(latest.structural_shifts || []),
          ...archiveReports.flatMap(r => (r as any).structural_shifts || []),
        ];
        const rawShifts: RawStructuralShift[] = allShiftSources
          .filter((s: any) => s.from && s.to)
          .map((s: any) => ({
            from: s.from || '',
            to: s.to || '',
            levels: s.levels || [],
            sources: s.sources || [],
          }));
        const trendDynamics: TrendDynamic[] = rawTrends.map((t, idx) => {
          const td: TrendDynamic = {
            id: idx + 1,
            name: t.name,
            momentum: t.momentum,
            rationale: t.rationale,
            levels: t.levels,
            category: t.category,
          };
          // Match structural shifts to decelerating trends
          if (t.category === 'decelerating') {
            // First try exact name match with shift.from
            let matched = rawShifts.find(s => s.from === t.name);
            if (!matched) {
              // Fallback: match by levels overlap (>=50% of trend levels)
              const tLevels = new Set(t.levels);
              matched = rawShifts.find(s => {
                const overlap = s.levels.filter(l => tLevels.has(l)).length;
                return overlap >= Math.ceil(t.levels.length * 0.5);
              });
            }
            if (matched) {
              td.shiftFrom = matched.from;
              td.shiftTo = matched.to;
            }
          }
          return td;
        });
        const trendDynamicsLive = trendDynamics.length > 0;

        // Transform data
        setState({
          isLive: true,
          loading: false,
          error: null,
          latestReport: latest,
          archiveReports,
          reportDate: latest.date,
          keyFocus: latest.key_focus,
          heatmapData: buildHeatmap(archiveReports, latest),
          keyMetrics: buildKeyMetrics(latest, locale),
          structuralShifts: (latest.structural_shifts || []).length > 0 ? transformShifts(latest) : STATIC_SHIFTS,
          weakSignals: (latest.radar_signals || []).length > 0 ? transformSignals(latest) : STATIC_SIGNALS,
          crossLevelConnections: transformConnections(latest),
          themeFrequency: buildThemeFrequency(latest, locale),
          keyEvents: buildKeyEvents(latest),
          topCompanies: buildTopCompanies(latest),
          strategicInsights: dynamicInsights,
          insightsPeriod,
          insightsGeneratedAt,
          insightsLive,
          momentumData,
          momentumLive,
          trendDynamics,
          trendDynamicsLive,
          rawStructuralShifts: rawShifts,
        });
      } catch (err) {
        console.warn("Live data unavailable, using static fallback:", err);
        setState((prev) => ({
          ...prev,
          isLive: false,
          loading: false,
          error: String(err),
        }));
      }
    }

    fetchData();
  }, [locale]);

  return <LiveDataContext.Provider value={state}>{children}</LiveDataContext.Provider>;
}

export function useLiveData(): DashboardData {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error("useLiveData must be used within LiveDataProvider");
  return ctx;
}
