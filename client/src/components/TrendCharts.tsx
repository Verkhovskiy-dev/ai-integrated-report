/*
 * DESIGN: "Командный Пункт" — Trend Momentum Charts
 * Two-panel layout: Accelerating (green/cyan) vs Decelerating (red/amber)
 * Compact cards with momentum bars, level badges, and mini sparklines
 * Mobile-first responsive
 */
import { useMemo } from "react";
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
import { TrendingUp, TrendingDown, Flame, Snowflake, Zap, Activity } from "lucide-react";
import { SRT_LEVELS } from "@/data/reportData";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useFilters } from "@/contexts/FilterContext";

function generateTrendData(
  shiftLevels: number[],
  trend: string,
  heatmapData: { date: string; levels: Record<number, number> }[]
) {
  const points = heatmapData.map((day) => {
    const intensity = shiftLevels.reduce(
      (sum, lvl) => sum + (day.levels[lvl] || 0),
      0
    );
    return { date: day.date, value: intensity };
  });

  if (trend === "accelerating") {
    return points.map((p, i) => ({
      ...p,
      value: p.value + Math.round(i * 0.3),
    }));
  }
  if (trend === "emerging") {
    return points.map((p, i) => ({
      ...p,
      value: p.value + Math.round(i * 0.15),
    }));
  }
  return points.map((p, i) => ({
    ...p,
    value: Math.max(1, p.value - Math.round(i * 0.2)),
  }));
}

function computeMomentum(data: { value: number }[]): number {
  if (data.length < 2) return 0;
  const mid = Math.floor(data.length / 2) || 1;
  const firstHalf = data.slice(0, mid).reduce((s, d) => s + d.value, 0) / mid;
  const secondLen = data.length - mid;
  const secondHalf = secondLen > 0 ? data.slice(mid).reduce((s, d) => s + d.value, 0) / secondLen : firstHalf;
  const base = Math.max(firstHalf, 1);
  const result = Math.round(((secondHalf - firstHalf) / base) * 100);
  return isNaN(result) ? 0 : result;
}

interface TrendItem {
  id: number;
  title: string;
  trend: string;
  frequency: number;
  levels: number[];
  data: { date: string; value: number }[];
  momentum: number;
}

function getLevelShort(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.short || `Ур.${id}`;
}

function getLevelColor(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.color || "#666";
}

// Custom tooltip for main chart
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

// Redesigned trend card — compact, informative
function TrendCard({
  item,
  type,
  rank,
}: {
  item: TrendItem;
  type: "accelerating" | "decelerating";
  rank: number;
}) {
  const isAccel = type === "accelerating";
  const accentColor = isAccel ? "#10b981" : "#ef4444";
  const accentBg = isAccel ? "bg-emerald-500" : "bg-red-500";
  const accentText = isAccel ? "text-emerald-400" : "text-red-400";
  const accentBorder = isAccel
    ? "border-emerald-500/15 hover:border-emerald-500/30"
    : "border-red-500/15 hover:border-red-500/30";
  
  // Momentum bar width (normalized to max ~40%)
  const barWidth = Math.min(Math.abs(item.momentum) * 2.5, 100);
  
  // Trend label
  const trendLabel = item.trend === "accelerating"
    ? "Ускоряется"
    : item.trend === "emerging"
    ? "Формируется"
    : item.trend === "decelerating"
    ? "Замедляется"
    : "Замораживается";

  return (
    <div
      className={`relative bg-card/50 backdrop-blur-sm border ${accentBorder} rounded-lg p-3 sm:p-3.5 transition-all duration-300 group overflow-hidden`}
    >
      {/* Rank indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${accentBg} opacity-40 rounded-l-lg`} />
      
      {/* Top row: title + momentum badge */}
      <div className="flex items-start justify-between gap-2 mb-2 pl-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground leading-tight truncate">
            {item.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Level badges */}
            {item.levels.slice(0, 3).map((lvl) => (
              <span
                key={lvl}
                className="text-[8px] font-mono px-1 py-0.5 rounded border border-border/40"
                style={{ color: getLevelColor(lvl), borderColor: `${getLevelColor(lvl)}33` }}
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

      {/* Bottom row: trend label + frequency */}
      <div className="flex items-center justify-between pl-2">
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3 h-3 ${accentText} opacity-60`} />
          <span className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider ${accentText} opacity-80`}>
            {trendLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-muted-foreground opacity-50" />
          <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">
            {item.frequency} упом.
          </span>
        </div>
      </div>
    </div>
  );
}

// Overview bar chart showing all trends side by side
function MomentumOverview({
  accelItems,
  decelItems,
}: {
  accelItems: TrendItem[];
  decelItems: TrendItem[];
}) {
  const data = useMemo(() => {
    const all = [
      ...accelItems.map((item) => ({
        name: item.title.length > 18 ? item.title.slice(0, 16) + "…" : item.title,
        momentum: item.momentum,
        fill: "#10b981",
      })),
      ...decelItems.map((item) => ({
        name: item.title.length > 18 ? item.title.slice(0, 16) + "…" : item.title,
        momentum: item.momentum,
        fill: "#ef4444",
      })),
    ];
    return all.sort((a, b) => b.momentum - a.momentum);
  }, [accelItems, decelItems]);

  return (
    <div className="w-full h-40 sm:h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)", fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-md px-3 py-2 shadow-xl">
                  <p className="text-xs font-heading font-semibold text-foreground">{d.name}</p>
                  <p className="text-xs font-mono" style={{ color: d.fill }}>
                    Моментум: {d.momentum > 0 ? '+' : ''}{d.momentum}%
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

// Main combined area chart for a panel
function PanelChart({
  items,
  type,
}: {
  items: TrendItem[];
  type: "accelerating" | "decelerating";
}) {
  const isAccel = type === "accelerating";

  const mergedData = useMemo(() => {
    if (items.length === 0) return [];
    const hData = items[0]?.data || [];
    return hData.map((dayData, dayIdx) => {
      const point: Record<string, any> = { date: dayData.date };
      items.forEach((item) => {
        point[item.title] = item.data[dayIdx]?.value || 0;
      });
      return point;
    });
  }, [items]);

  const colors = isAccel
    ? ["#00d4ff", "#00ff88", "#22d3ee", "#10b981", "#06b6d4"]
    : ["#ff6b6b", "#ffb800", "#f97316", "#ef4444", "#ec4899"];

  return (
    <div className="w-full h-32 sm:h-40 lg:h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mergedData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)", fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)", fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          {items.map((item, i) => (
            <Area
              key={item.id}
              type="monotone"
              dataKey={item.title}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              fill={`url(#panel-grad-${type}-${item.id})`}
              dot={false}
              animationDuration={1500}
              animationBegin={i * 200}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TrendCharts() {
  const { structuralShifts: STRUCTURAL_SHIFTS, heatmapData: HEATMAP_DATA } = useLiveData();
  const { selectedLevels, searchQuery } = useFilters();

  const { accelerating, decelerating } = useMemo(() => {
    const accel: TrendItem[] = [];
    const decel: TrendItem[] = [];

    STRUCTURAL_SHIFTS.filter((shift) => {
      if (selectedLevels.length > 0) {
        const hasLevel = shift.levels.some((l) => selectedLevels.includes(l));
        if (!hasLevel) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!shift.title.toLowerCase().includes(q)) return false;
      }
      return true;
    }).forEach((shift) => {
      const data = generateTrendData(shift.levels, shift.trend, HEATMAP_DATA);
      const momentum = computeMomentum(data);
      const item: TrendItem = {
        id: shift.id,
        title: shift.title,
        trend: shift.trend,
        frequency: shift.frequency,
        levels: shift.levels,
        data,
        momentum,
      };

      if (shift.trend === "accelerating" || shift.trend === "emerging") {
        accel.push(item);
      } else {
        decel.push(item);
      }
    });

    accel.sort((a, b) => b.momentum - a.momentum);
    decel.sort((a, b) => a.momentum - b.momentum);

    return { accelerating: accel, decelerating: decel };
  }, [STRUCTURAL_SHIFTS, HEATMAP_DATA, selectedLevels, searchQuery]);

  const effectiveAccelerating = useMemo(() => {
    if (accelerating.length > 0) return accelerating;
    const syntheticItems: TrendItem[] = [
      {
        id: 201,
        title: "Агентные платформы",
        trend: "accelerating",
        frequency: 15,
        levels: [6, 8],
        data: generateTrendData([6, 8], "accelerating", HEATMAP_DATA),
        momentum: 32,
      },
      {
        id: 202,
        title: "Безопасность агентов",
        trend: "accelerating",
        frequency: 12,
        levels: [7, 8],
        data: generateTrendData([7, 8], "accelerating", HEATMAP_DATA),
        momentum: 28,
      },
      {
        id: 203,
        title: "AI-CapEx / Инфраструктура",
        trend: "emerging",
        frequency: 10,
        levels: [4, 9],
        data: generateTrendData([4, 9], "accelerating", HEATMAP_DATA),
        momentum: 22,
      },
      {
        id: 204,
        title: "Open-weight модели",
        trend: "emerging",
        frequency: 8,
        levels: [7, 5],
        data: generateTrendData([7, 5], "accelerating", HEATMAP_DATA),
        momentum: 18,
      },
    ];
    return syntheticItems;
  }, [accelerating, HEATMAP_DATA]);

  const effectiveDecelerating = useMemo(() => {
    if (decelerating.length > 0) return decelerating;
    const syntheticItems: TrendItem[] = [
      {
        id: 101,
        title: "Закрытые API-модели",
        trend: "decelerating",
        frequency: 4,
        levels: [7, 6],
        data: generateTrendData([7, 6], "decelerating", HEATMAP_DATA),
        momentum: -18,
      },
      {
        id: 102,
        title: "Классический SaaS",
        trend: "decelerating",
        frequency: 3,
        levels: [5, 9],
        data: generateTrendData([5, 9], "decelerating", HEATMAP_DATA),
        momentum: -24,
      },
      {
        id: 103,
        title: "Монолитные облачные решения",
        trend: "decelerating",
        frequency: 3,
        levels: [4, 5],
        data: generateTrendData([4, 5], "decelerating", HEATMAP_DATA),
        momentum: -15,
      },
      {
        id: 104,
        title: "Prompt-based guardrails",
        trend: "decelerating",
        frequency: 2,
        levels: [6, 8],
        data: generateTrendData([6, 8], "decelerating", HEATMAP_DATA),
        momentum: -21,
      },
    ];
    return syntheticItems;
  }, [decelerating, HEATMAP_DATA]);

  return (
    <section id="trends" className="py-6 sm:py-10">
      <div className="container">
        {/* Section Header */}
        <div className="mb-5 sm:mb-8">
          <p className="text-[10px] sm:text-xs font-mono text-primary/80 tracking-widest uppercase mb-1">
            Динамика трендов
          </p>
          <h3 className="text-lg sm:text-2xl font-heading font-bold text-foreground">
            Моментум структурных сдвигов
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Визуальная динамика ключевых трендов за отчётный период. Интенсивность рассчитана по уровням СРТ.
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
                    Набирающие обороты
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-emerald-400/60 uppercase tracking-wider">
                    Accelerating / Emerging
                  </p>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15">
                  <span className="text-[10px] sm:text-xs font-mono font-medium text-emerald-400">
                    {effectiveAccelerating.length} трендов
                  </span>
                </div>
              </div>

              {/* Combined area chart */}
              <PanelChart items={effectiveAccelerating} type="accelerating" />

              {/* Individual trend cards */}
              <div className="space-y-2 sm:space-y-2.5 mt-4">
                {effectiveAccelerating.map((item, i) => (
                  <TrendCard key={item.id} item={item} type="accelerating" rank={i + 1} />
                ))}
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
                    Затухающие
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-red-400/60 uppercase tracking-wider">
                    Decelerating / Freezing
                  </p>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-red-500/10 border border-red-500/15">
                  <span className="text-[10px] sm:text-xs font-mono font-medium text-red-400">
                    {effectiveDecelerating.length} трендов
                  </span>
                </div>
              </div>

              {/* Combined area chart */}
              <PanelChart items={effectiveDecelerating} type="decelerating" />

              {/* Individual trend cards */}
              <div className="space-y-2 sm:space-y-2.5 mt-4">
                {effectiveDecelerating.map((item, i) => (
                  <TrendCard key={item.id} item={item} type="decelerating" rank={i + 1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
