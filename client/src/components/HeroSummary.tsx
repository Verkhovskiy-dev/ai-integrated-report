/*
 * HeroSummary: The "above the fold" executive summary
 * Compact, high-density first screen that tells a complete story:
 * 1. Metrics strip — key numbers at a glance
 * 2. Top 3 events — most important news
 * 3. Momentum overview — horizontal bar chart of all trends
 * 4. Key insight of the day — one highlighted card
 * i18n support
 */
import { useMemo } from "react";
import {
  FileText, Zap, TrendingUp, Link, Lightbulb, ArrowRight,
  Activity, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useFilters } from "@/contexts/FilterContext";
import { useTranslation } from "@/contexts/I18nContext";

// ─── Helpers ────────────────────────────────────────────────────
const LEVEL_NAMES_RU: Record<number, string> = {
  9: "Капитал", 8: "Институты", 7: "Знания", 6: "Технологии",
  5: "Value Chain", 4: "Hardware", 3: "Профессии", 2: "География", 1: "Ресурсы",
};
const LEVEL_NAMES_EN: Record<number, string> = {
  9: "Capital", 8: "Institutions", 7: "Knowledge", 6: "Technology",
  5: "Value Chain", 4: "Hardware", 3: "Professions", 2: "Geography", 1: "Resources",
};
const LEVEL_COLORS: Record<number, string> = {
  9: "#ef4444", 8: "#f97316", 7: "#f59e0b", 6: "#22d3ee",
  5: "#06b6d4", 4: "#0ea5e9", 3: "#10b981", 2: "#84cc16", 1: "#a3e635",
};
const EVENT_ICONS: Record<string, string> = {
  investment: "💰", regulation: "⚖️", geopolitics: "🌐", government: "🏛️",
  milestone: "🏆", social: "👥", partnership: "🤝", market: "📊", product: "🚀",
};
function guessType(text: string): string {
  const t = text.toLowerCase();
  if (/инвестиц|funding|капитал|финанс|кредит/i.test(t)) return "investment";
  if (/регулир|закон|compliance/i.test(t)) return "regulation";
  if (/геополит|санкц|китай|сша/i.test(t)) return "geopolitics";
  if (/государств|правительств/i.test(t)) return "government";
  if (/рекорд|milestone|первый/i.test(t)) return "milestone";
  if (/партнёр|контракт|сделк/i.test(t)) return "partnership";
  if (/рынок|market|маржа/i.test(t)) return "market";
  return "product";
}

// ─── Metrics Strip ──────────────────────────────────────────────
function MetricsStrip({ metrics }: { metrics: { label: string; value: number; suffix: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-card/60 border border-border/40 rounded-lg"
        >
          <span className="text-lg sm:text-xl font-heading font-bold text-primary tabular-nums">
            {m.value}{m.suffix}
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Momentum Chart ─────────────────────────────────────────────
function MomentumChart({ data, isEn }: { data: { name: string; momentum: number; fill: string; fullName?: string; rationale?: string; dataPoints?: number }[]; isEn: boolean }) {
  return (
    <div className="w-full h-52 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)", fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-md px-3 py-2 shadow-xl max-w-xs">
                  <p className="text-xs font-heading font-semibold text-foreground">{d.fullName || d.name}</p>
                  <p className="text-xs font-mono" style={{ color: d.fill }}>
                    {isEn ? "Momentum" : "Моментум"}: {d.momentum > 0 ? "+" : ""}{d.momentum}
                  </p>
                  {d.rationale && (
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{d.rationale}</p>
                  )}
                  {d.dataPoints && (
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono">
                      {isEn ? `based on ${d.dataPoints} reports` : `на основе ${d.dataPoints} отчётов`}
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="momentum" radius={[0, 4, 4, 0]} barSize={14}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} fillOpacity={0.75} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function HeroSummary() {
  const {
    latestReport, isLive, reportDate, keyFocus,
    keyMetrics,
    strategicInsights,
  } = useLiveData();
  const { selectedLevels, searchQuery } = useFilters();
  const { t, locale } = useTranslation();
  const isEn = locale === "en";

  const LEVEL_NAMES = isEn ? LEVEL_NAMES_EN : LEVEL_NAMES_RU;
  const lvPrefix = isEn ? "Lv." : "Ур.";

  // ── Top 3 events ──
  const topEvents = useMemo(() => {
    if (!latestReport?.srt_levels) return [];
    const items: { title: string; level: number; levelName: string; type: string; description: string }[] = [];
    for (const srtLevel of latestReport.srt_levels) {
      if (selectedLevels.length > 0 && !selectedLevels.includes(srtLevel.level)) continue;
      for (const event of srtLevel.events) {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!event.title.toLowerCase().includes(q) && !event.description.toLowerCase().includes(q)) continue;
        }
        items.push({
          title: event.title,
          description: event.description,
          level: srtLevel.level,
          levelName: LEVEL_NAMES[srtLevel.level] || `${lvPrefix}${srtLevel.level}`,
          type: guessType(event.title + " " + event.description),
        });
      }
    }
    return items;
  }, [latestReport, selectedLevels, searchQuery, isEn]);

  const totalEvents = topEvents.length;

  // ── Momentum data (from momentum.json with averaging) ──
  const { momentumData: rawMomentum, momentumLive } = useLiveData();
  const momentumData = useMemo(() => {
    if (rawMomentum.length > 0) {
      const trendMap: Record<string, { totalMom: number; count: number; levels: number[]; category: string; rationale: string }> = {};
      for (const entry of rawMomentum) {
        for (const t of entry.trends) {
          const key = t.name;
          if (!trendMap[key]) {
            trendMap[key] = { totalMom: 0, count: 0, levels: t.levels, category: t.category, rationale: t.rationale };
          }
          trendMap[key].totalMom += t.momentum;
          trendMap[key].count += 1;
          trendMap[key].category = t.category;
          trendMap[key].rationale = t.rationale;
        }
      }

      const items = Object.entries(trendMap)
        .map(([name, data]) => {
          const avgMom = Math.round(data.totalMom / data.count);
          return {
            name: name.length > 22 ? name.slice(0, 20) + "…" : name,
            fullName: name,
            momentum: avgMom,
            fill: avgMom >= 0 ? "#10b981" : "#ef4444",
            category: data.category,
            rationale: data.rationale,
            levels: data.levels,
            dataPoints: data.count,
          };
        })
        .sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum))
        .slice(0, 10)
        .sort((a, b) => b.momentum - a.momentum);

      return items;
    }

    // Fallback: synthetic data
    const synth = isEn
      ? [
          { name: "Agentic Platforms", momentum: 32, fill: "#10b981" },
          { name: "Agent Security", momentum: 28, fill: "#10b981" },
          { name: "AI-CapEx / Infra", momentum: 22, fill: "#10b981" },
          { name: "Open-weight Models", momentum: 18, fill: "#10b981" },
          { name: "Closed API Models", momentum: -18, fill: "#ef4444" },
          { name: "Classic SaaS", momentum: -24, fill: "#ef4444" },
          { name: "Monolithic Cloud", momentum: -15, fill: "#ef4444" },
          { name: "Prompt Guardrails", momentum: -21, fill: "#ef4444" },
        ]
      : [
          { name: "Агентные платформы", momentum: 32, fill: "#10b981" },
          { name: "Безопасность агентов", momentum: 28, fill: "#10b981" },
          { name: "AI-CapEx / Инфра", momentum: 22, fill: "#10b981" },
          { name: "Open-weight модели", momentum: 18, fill: "#10b981" },
          { name: "Закрытые API-модели", momentum: -18, fill: "#ef4444" },
          { name: "Классический SaaS", momentum: -24, fill: "#ef4444" },
          { name: "Монолитные облака", momentum: -15, fill: "#ef4444" },
          { name: "Prompt guardrails", momentum: -21, fill: "#ef4444" },
        ];
    return synth;
  }, [rawMomentum, isEn]);

  // ── Key insight ──
  const keyInsight = strategicInsights[0];

  // ── Compact metrics ──
  const compactMetrics = useMemo(() => {
    const evtCount = keyMetrics.find((m) => m.label.toLowerCase().includes("событ"))?.value || totalEvents;
    const linkCount = keyMetrics.find((m) => m.label.toLowerCase().includes("связ"))?.value || 3;
    return [
      { label: isEn ? "events" : "событий", value: evtCount || totalEvents, suffix: "" },
      { label: isEn ? "insights" : "инсайтов", value: strategicInsights.length, suffix: "" },
      { label: isEn ? "trends" : "трендов", value: momentumData.length, suffix: "" },
      { label: isEn ? "links" : "связей", value: linkCount, suffix: "" },
    ];
  }, [keyMetrics, totalEvents, momentumData, strategicInsights, isEn]);

  if (!isLive && topEvents.length === 0) return null;

  return (
    <section id="hero-summary" className="pt-3 pb-4 sm:pt-5 sm:pb-6">
      <div className="container space-y-4 sm:space-y-5">

        {/* ── Row 1: Title + Metrics Strip ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg sm:text-2xl font-heading font-bold text-foreground">
                AI Strategic Intelligence
              </h2>
              <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                {reportDate}
                {keyFocus && <span className="text-primary/70 ml-2">· {keyFocus}</span>}
              </p>
            </div>
            {isLive && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
              </div>
            )}
          </div>
          <MetricsStrip metrics={compactMetrics} />
        </div>

        {/* ── Row 2: Two-column — Top Events + Momentum Chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Left: Top 3 Events */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary/60" />
              <h3 className="text-xs sm:text-sm font-heading font-semibold text-foreground">
                {isEn ? "Top Events" : "Главные события"}
              </h3>
              <span className="ml-auto text-[9px] font-mono text-muted-foreground">
                {totalEvents} {isEn ? "total" : "всего"}
              </span>
            </div>

            <div className="space-y-2">
              {topEvents.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2.5 bg-background/40 border border-border/20 rounded-lg group hover:border-primary/20 transition-colors"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono"
                        style={{
                          color: LEVEL_COLORS[item.level],
                          backgroundColor: `${LEVEL_COLORS[item.level]}15`,
                          borderColor: `${LEVEL_COLORS[item.level]}30`,
                          borderWidth: 1,
                        }}
                      >
                        {EVENT_ICONS[item.type] || "📌"} {lvPrefix}{item.level} {item.levelName}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground leading-snug line-clamp-2">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalEvents > 3 && (
              <a
                href="#news"
                className="flex items-center justify-center gap-1 mt-3 text-[10px] sm:text-xs font-mono text-primary/70 hover:text-primary transition-colors"
              >
                {isEn ? `${totalEvents - 3} more events` : `Ещё ${totalEvents - 3} событий`} <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Right: Momentum Chart */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary/60" />
              <h3 className="text-xs sm:text-sm font-heading font-semibold text-foreground">
                {isEn ? "Trend Momentum" : "Моментум трендов"}
              </h3>
              {momentumLive && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-[8px] font-mono text-emerald-400">AI</span>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-mono text-muted-foreground">{isEn ? "Growth" : "Рост"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[8px] font-mono text-muted-foreground">{isEn ? "Decline" : "Спад"}</span>
                </div>
              </div>
            </div>
            <MomentumChart data={momentumData} isEn={isEn} />
            <a
              href="#trends"
              className="flex items-center justify-center gap-1 mt-2 text-[10px] sm:text-xs font-mono text-primary/70 hover:text-primary transition-colors"
            >
              {isEn ? "Detailed dynamics" : "Подробная динамика"} <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* ── Row 3: Key Insight of the Day ── */}
        {keyInsight && (
          <div className="relative bg-card/40 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4 sm:p-5 overflow-hidden">
            {/* Accent glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${keyInsight.accentColor}15`,
                  borderColor: `${keyInsight.accentColor}30`,
                }}
              >
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: keyInsight.accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono text-primary/60 uppercase tracking-wider">
                    {isEn ? "Key Insight" : "Ключевой инсайт"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[8px] font-mono text-primary">
                    №{keyInsight.id}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-heading font-semibold text-foreground mb-1">
                  {keyInsight.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {keyInsight.summary}
                </p>
                <a
                  href="#insights"
                  className="inline-flex items-center gap-1 mt-2 text-[10px] sm:text-xs font-mono text-primary/70 hover:text-primary transition-colors"
                >
                  {isEn ? `All ${strategicInsights.length} insights` : `Все ${strategicInsights.length} инсайтов`} <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Scroll hint ── */}
        <div className="flex justify-center pt-1">
          <ChevronDown className="w-5 h-5 text-muted-foreground/30 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
