/*
 * DESIGN: "Командный Пункт" — Trend Momentum Charts
 * Two-panel layout: Accelerating (green/cyan) vs Decelerating (red/amber)
 * Compact cards with momentum bars, level badges, rationale, and mini sparklines
 * Uses real data from report.trends[], momentum.json, and structural_shifts[]
 * Mobile-first responsive, i18n support
 */
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Snowflake,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
} from "lucide-react";
import { SRT_LEVELS } from "@/data/reportData";
import { useLiveData, type TrendDynamic, type MomentumEntry } from "@/contexts/LiveDataContext";
import { useFilters } from "@/contexts/FilterContext";
import { useTranslation } from "@/contexts/I18nContext";

/* ─── helpers ─── */

function getLevelColor(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.color || "#666";
}

/** Build per-trend historical momentum from momentum.json entries */
function buildMomentumHistory(
  trendName: string,
  momentumData: MomentumEntry[]
): { date: string; value: number }[] {
  const points: { date: string; value: number }[] = [];
  for (const entry of momentumData) {
    const match = entry.trends.find((t) => t.name === trendName);
    if (match) {
      points.push({ date: entry.date, value: match.momentum });
    }
  }
  return points;
}

/* ─── Custom tooltip for main chart ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-md px-3 py-2 shadow-xl">
      <p className="text-[10px] font-mono text-muted-foreground mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-heading text-foreground">
          <span style={{ color: p.stroke }} className="mr-1">●</span>
          {p.dataKey}: <span className="font-mono font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── TrendCard: compact card with momentum, rationale, shift context ─── */
function TrendCard({
  item,
  type,
  rank,
  isEn,
  getLevelShort,
  historyPoints,
  t,
}: {
  item: TrendDynamic;
  type: "accelerating" | "decelerating";
  rank: number;
  isEn: boolean;
  getLevelShort: (id: number) => string;
  historyPoints: { date: string; value: number }[];
  t: any;
}) {
  const [showRationale, setShowRationale] = useState(false);
  const isAccel = type === "accelerating";
  const accentColor = isAccel ? "#10b981" : "#ef4444";
  const accentBg = isAccel ? "bg-emerald-500" : "bg-red-500";
  const accentText = isAccel ? "text-emerald-400" : "text-red-400";
  const accentBorder = isAccel
    ? "border-emerald-500/15 hover:border-emerald-500/30"
    : "border-red-500/15 hover:border-red-500/30";

  // Momentum bar width (normalized to max ~100%)
  const barWidth = Math.min(Math.abs(item.momentum) * 1.2, 100);

  // Trend label from i18n
  const trendLabel =
    t.trends.trendLabels[item.category] ||
    (isEn ? item.category : item.category);

  return (
    <div
      className={`relative bg-card/50 backdrop-blur-sm border ${accentBorder} rounded-lg p-3 sm:p-3.5 transition-all duration-300 group overflow-hidden`}
    >
      {/* Rank indicator */}
      <div
        className={`absolute top-0 left-0 w-1 h-full ${accentBg} opacity-40 rounded-l-lg`}
      />

      {/* Top row: title + momentum badge */}
      <div className="flex items-start justify-between gap-2 mb-2 pl-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground leading-tight line-clamp-2">
            {item.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {/* Level badges */}
            {item.levels.slice(0, 4).map((lvl) => (
              <span
                key={lvl}
                className="text-[8px] font-mono px-1 py-0.5 rounded border border-border/40"
                style={{
                  color: getLevelColor(lvl),
                  borderColor: `${getLevelColor(lvl)}33`,
                }}
              >
                {lvl}·{getLevelShort(lvl)}
              </span>
            ))}
          </div>
        </div>
        <div
          className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded-md text-xs sm:text-sm font-mono font-bold ${accentText}`}
          style={{ backgroundColor: `${accentColor}15` }}
        >
          {isAccel ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          {item.momentum > 0 ? "+" : ""}
          {item.momentum}%
        </div>
      </div>

      {/* Momentum bar */}
      <div className="pl-2 mb-2">
        <div className="w-full h-2 bg-border/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${accentBg}`}
            style={{
              width: `${barWidth}%`,
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Mini sparkline or simple indicator for history */}
      {historyPoints.length > 2 ? (
        <div className="pl-2 mb-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={historyPoints}
              margin={{ top: 2, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`spark-grad-${item.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={accentColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={accentColor}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={accentColor}
                strokeWidth={1.5}
                fill={`url(#spark-grad-${item.id})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : historyPoints.length > 0 ? (
        <div className="pl-2 mb-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            {historyPoints.map((pt, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor, opacity: 0.5 + (i / historyPoints.length) * 0.5 }}
                />
                <span className="text-[9px] font-mono text-muted-foreground">
                  {pt.value > 0 ? "+" : ""}{pt.value}
                </span>
              </div>
            ))}
          </div>
          <span className="text-[8px] font-mono text-muted-foreground/50">
            {historyPoints.length} {t.trends.dataPoints}
          </span>
        </div>
      ) : null}

      {/* Bottom row: trend label + rationale toggle */}
      <div className="flex items-center justify-between pl-2">
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3 h-3 ${accentText} opacity-60`} />
          <span
            className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider ${accentText} opacity-80`}
          >
            {trendLabel}
          </span>
        </div>
        {item.rationale && (
          <button
            onClick={() => setShowRationale(!showRationale)}
            className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="w-3 h-3" />
            {showRationale ? t.trends.hideRationale : t.trends.showRationale}
            {showRationale ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Expandable rationale */}
      {showRationale && item.rationale && (
        <div className="mt-2 pl-2 pr-1 pt-2 border-t border-border/20">
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
            {item.rationale}
          </p>
        </div>
      )}

      {/* Structural shift context for decelerating trends */}
      {showRationale && item.shiftFrom && item.shiftTo && (
        <div className="mt-2 pl-2 pr-1 pt-2 border-t border-border/20">
          <div className="flex items-center gap-1 mb-1">
            <ArrowRight className="w-3 h-3 text-amber-400/70" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/70">
              {t.trends.structuralShift}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-start gap-1">
              <span className="text-[9px] font-mono text-red-400/60 shrink-0 mt-0.5">
                {t.trends.shiftFrom}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {item.shiftFrom}
              </span>
            </div>
            <div className="flex items-start gap-1">
              <span className="text-[9px] font-mono text-emerald-400/60 shrink-0 mt-0.5">
                {t.trends.shiftTo}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {item.shiftTo}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Overview bar chart showing all trends side by side ─── */
function MomentumOverview({
  accelItems,
  decelItems,
  isEn,
}: {
  accelItems: TrendDynamic[];
  decelItems: TrendDynamic[];
  isEn: boolean;
}) {
  const data = useMemo(() => {
    const all = [
      ...accelItems.map((item) => ({
        name:
          item.name.length > 22 ? item.name.slice(0, 20) + "…" : item.name,
        momentum: item.momentum,
        fill: "#10b981",
      })),
      ...decelItems.map((item) => ({
        name:
          item.name.length > 22 ? item.name.slice(0, 20) + "…" : item.name,
        momentum: item.momentum,
        fill: "#ef4444",
      })),
    ];
    return all.sort((a, b) => b.momentum - a.momentum);
  }, [accelItems, decelItems]);

  if (data.length === 0) return null;

  const chartHeight = Math.max(160, data.length * 28);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{
              fontSize: 9,
              fill: "rgba(255,255,255,0.3)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{
              fontSize: 8,
              fill: "rgba(255,255,255,0.5)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-md px-3 py-2 shadow-xl">
                  <p className="text-xs font-heading font-semibold text-foreground">
                    {d.name}
                  </p>
                  <p className="text-xs font-mono" style={{ color: d.fill }}>
                    {isEn ? "Momentum" : "Моментум"}:{" "}
                    {d.momentum > 0 ? "+" : ""}
                    {d.momentum}%
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="momentum" radius={[0, 4, 4, 0]} barSize={14}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Panel area chart: real historical momentum from momentum.json ─── */
function PanelChart({
  items,
  momentumData,
  type,
}: {
  items: TrendDynamic[];
  momentumData: MomentumEntry[];
  type: "accelerating" | "decelerating";
}) {
  const isAccel = type === "accelerating";

  const mergedData = useMemo(() => {
    if (items.length === 0 || momentumData.length === 0) return [];

    // Build date-keyed map of momentum values per trend
    const dates = momentumData.map((e) => e.date).sort();
    return dates.map((date) => {
      const entry = momentumData.find((e) => e.date === date);
      const point: Record<string, any> = { date };
      items.forEach((item) => {
        const match = entry?.trends.find((t) => t.name === item.name);
        point[item.name] = match?.momentum ?? null;
      });
      return point;
    });
  }, [items, momentumData]);

  const colors = isAccel
    ? ["#00d4ff", "#00ff88", "#22d3ee", "#10b981", "#06b6d4", "#34d399", "#a7f3d0", "#67e8f9"]
    : ["#ff6b6b", "#ffb800", "#f97316", "#ef4444", "#ec4899", "#fb923c", "#fca5a5", "#fbbf24"];

  // If fewer than 3 data points, show a simple indicator instead
  if (mergedData.length < 3) {
    return (
      <div className="w-full h-16 flex items-center justify-center">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {mergedData.map((pt, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-border/10"
            >
              <span className="text-[9px] font-mono text-muted-foreground">
                {pt.date}
              </span>
              <div className="flex gap-1">
                {items.slice(0, 3).map((item, j) => {
                  const val = pt[item.name];
                  if (val == null) return null;
                  return (
                    <span
                      key={j}
                      className="text-[9px] font-mono font-medium"
                      style={{ color: colors[j % colors.length] }}
                    >
                      {val > 0 ? "+" : ""}
                      {val}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-32 sm:h-40 lg:h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={mergedData}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <defs>
            {items.map((item, i) => (
              <linearGradient
                key={item.id}
                id={`panel-grad-${type}-${item.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={colors[i % colors.length]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={colors[i % colors.length]}
                  stopOpacity={0.02}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{
              fontSize: 9,
              fill: "rgba(255,255,255,0.35)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{
              fontSize: 9,
              fill: "rgba(255,255,255,0.25)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          {items.map((item, i) => (
            <Area
              key={item.id}
              type="monotone"
              dataKey={item.name}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              fill={`url(#panel-grad-${type}-${item.id})`}
              dot={false}
              connectNulls
              animationDuration={1500}
              animationBegin={i * 200}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Empty state component ─── */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground/60 font-mono">{message}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function TrendCharts() {
  const { trendDynamics, momentumData, trendDynamicsLive } = useLiveData();
  const { selectedLevels, searchQuery } = useFilters();
  const { t, locale } = useTranslation();
  const isEn = locale === "en";

  function getLevelShort(id: number): string {
    return (
      t.filter.cptLevels[id]?.short ||
      SRT_LEVELS.find((l) => l.id === id)?.short ||
      `Lv.${id}`
    );
  }

  // Filter and split trends into accelerating vs decelerating
  const { accelerating, decelerating } = useMemo(() => {
    const accel: TrendDynamic[] = [];
    const decel: TrendDynamic[] = [];

    trendDynamics
      .filter((td) => {
        if (selectedLevels.length > 0) {
          const hasLevel = td.levels.some((l) => selectedLevels.includes(l));
          if (!hasLevel) return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!td.name.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .forEach((td) => {
        if (
          td.category === "accelerating" ||
          td.category === "emerging"
        ) {
          accel.push(td);
        } else if (
          td.category === "decelerating" ||
          td.category === "freezing"
        ) {
          decel.push(td);
        }
      });

    accel.sort((a, b) => b.momentum - a.momentum);
    decel.sort((a, b) => a.momentum - b.momentum);

    return { accelerating: accel, decelerating: decel };
  }, [trendDynamics, selectedLevels, searchQuery]);

  // If no real data at all, show empty state
  if (!trendDynamicsLive) {
    return (
      <section id="trends" className="py-6 sm:py-10">
        <div className="container">
          <div className="mb-5 sm:mb-8">
            <p className="text-[10px] sm:text-xs font-mono text-primary/80 tracking-widest uppercase mb-1">
              {t.trends.sectionLabel}
            </p>
            <h3 className="text-lg sm:text-2xl font-heading font-bold text-foreground">
              {t.trends.title}
            </h3>
          </div>
          <EmptyState message={t.trends.noData} />
        </div>
      </section>
    );
  }

  return (
    <section id="trends" className="py-6 sm:py-10">
      <div className="container">
        {/* Section Header */}
        <div className="mb-5 sm:mb-8">
          <p className="text-[10px] sm:text-xs font-mono text-primary/80 tracking-widest uppercase mb-1">
            {t.trends.sectionLabel}
          </p>
          <h3 className="text-lg sm:text-2xl font-heading font-bold text-foreground">
            {t.trends.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            {t.trends.description}
          </p>
        </div>

        {/* Two-panel grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* ===== ACCELERATING PANEL ===== */}
          <div className="relative bg-card/40 backdrop-blur-sm border border-emerald-500/15 rounded-xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Flame className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-heading font-semibold text-emerald-300">
                    {t.trends.acceleratingTitle}
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-emerald-400/60 uppercase tracking-wider">
                    {t.trends.acceleratingSub}
                  </p>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15">
                  <span className="text-[10px] sm:text-xs font-mono font-medium text-emerald-400">
                    {accelerating.length}{" "}
                    {isEn ? "trends" : "трендов"}
                  </span>
                </div>
              </div>

              {/* Combined area chart from real momentum history */}
              <PanelChart
                items={accelerating}
                momentumData={momentumData}
                type="accelerating"
              />

              {/* Individual trend cards */}
              <div className="space-y-2 sm:space-y-2.5 mt-4">
                {accelerating.map((item, i) => (
                  <TrendCard
                    key={item.id}
                    item={item}
                    type="accelerating"
                    rank={i + 1}
                    isEn={isEn}
                    getLevelShort={getLevelShort}
                    historyPoints={buildMomentumHistory(
                      item.name,
                      momentumData
                    )}
                    t={t}
                  />
                ))}
                {accelerating.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 font-mono text-center py-4">
                    {isEn
                      ? "No accelerating trends match filters"
                      : "Нет ускоряющихся трендов по фильтрам"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ===== DECELERATING PANEL ===== */}
          <div className="relative bg-card/40 backdrop-blur-sm border border-red-500/15 rounded-xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent" />

            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Snowflake className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-heading font-semibold text-red-300">
                    {t.trends.deceleratingTitle}
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-red-400/60 uppercase tracking-wider">
                    {t.trends.deceleratingSub}
                  </p>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-red-500/10 border border-red-500/15">
                  <span className="text-[10px] sm:text-xs font-mono font-medium text-red-400">
                    {decelerating.length}{" "}
                    {isEn ? "trends" : "трендов"}
                  </span>
                </div>
              </div>

              {/* Combined area chart from real momentum history */}
              <PanelChart
                items={decelerating}
                momentumData={momentumData}
                type="decelerating"
              />

              {/* Individual trend cards */}
              <div className="space-y-2 sm:space-y-2.5 mt-4">
                {decelerating.map((item, i) => (
                  <TrendCard
                    key={item.id}
                    item={item}
                    type="decelerating"
                    rank={i + 1}
                    isEn={isEn}
                    getLevelShort={getLevelShort}
                    historyPoints={buildMomentumHistory(
                      item.name,
                      momentumData
                    )}
                    t={t}
                  />
                ))}
                {decelerating.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 font-mono text-center py-4">
                    {isEn
                      ? "No decelerating trends match filters"
                      : "Нет затухающих трендов по фильтрам"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
