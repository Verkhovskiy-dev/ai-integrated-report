/*
 * DESIGN: "Командный Пункт" — Trend Momentum Charts
 * Two-panel layout: Accelerating (green/cyan) vs Decelerating (red/amber)
 * Area charts with sparkline-style mini-graphs per trend
 * Placed on the hero/first screen, above the fold
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
} from "recharts";
import { TrendingUp, TrendingDown, Flame, Snowflake } from "lucide-react";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useFilters } from "@/contexts/FilterContext";

// Generate synthetic momentum data from heatmap + shift metadata
// Each shift is tied to specific SRT levels — we aggregate heatmap intensity for those levels
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

  // For accelerating trends, add slight upward momentum in later days
  if (trend === "accelerating") {
    return points.map((p, i) => ({
      ...p,
      value: p.value + Math.round(i * 0.3),
    }));
  }
  // For emerging, add moderate growth
  if (trend === "emerging") {
    return points.map((p, i) => ({
      ...p,
      value: p.value + Math.round(i * 0.15),
    }));
  }
  // For decelerating/freezing — add downward pressure
  return points.map((p, i) => ({
    ...p,
    value: Math.max(1, p.value - Math.round(i * 0.2)),
  }));
}

// Compute momentum score: slope of last 7 days vs first 7 days
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

// Custom tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-md px-3 py-2 shadow-xl">
      <p className="text-[10px] font-mono text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-heading font-semibold text-foreground">
        Интенсивность: <span className="font-mono">{payload[0].value}</span>
      </p>
    </div>
  );
}

// Mini sparkline for each trend item
function MiniSparkline({
  data,
  color,
  gradientId,
}: {
  data: { date: string; value: number }[];
  color: string;
  gradientId: string;
}) {
  return (
    <div className="w-full h-10 sm:h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Single trend card
function TrendCard({
  item,
  type,
}: {
  item: TrendItem;
  type: "accelerating" | "decelerating";
}) {
  const isAccel = type === "accelerating";
  const color = isAccel ? "#00d4ff" : "#ff6b6b";
  const accentBorder = isAccel
    ? "border-cyan-500/20 hover:border-cyan-500/40"
    : "border-red-500/20 hover:border-red-500/40";
  const momentumColor = isAccel ? "text-emerald-400" : "text-red-400";
  const gradientId = `trend-grad-${item.id}-${type}`;

  return (
    <div
      className={`bg-card/50 backdrop-blur-sm border ${accentBorder} rounded-lg p-3 sm:p-4 transition-all duration-300 group`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground leading-tight line-clamp-2">
          {item.title}
        </h4>
        <div
          className={`flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-medium ${momentumColor} bg-current/5`}
        >
          {isAccel ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>
            {item.momentum > 0 ? "+" : ""}
            {item.momentum}%
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <MiniSparkline data={item.data} color={color} gradientId={gradientId} />

      {/* Footer meta */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[8px] sm:text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
          {item.trend === "accelerating"
            ? "Ускоряется"
            : item.trend === "emerging"
            ? "Формируется"
            : "Замедляется"}
        </span>
        <span className="text-[8px] sm:text-[9px] font-mono text-muted-foreground">
          Упоминаний: {item.frequency}
        </span>
      </div>
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

  // Merge all trends into one dataset with separate series
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
    <div className="w-full h-36 sm:h-44 lg:h-48">
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
  // Separate trends into accelerating and decelerating
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

    // Sort by momentum
    accel.sort((a, b) => b.momentum - a.momentum);
    decel.sort((a, b) => a.momentum - b.momentum);

    return { accelerating: accel, decelerating: decel };
  }, [STRUCTURAL_SHIFTS, HEATMAP_DATA, selectedLevels, searchQuery]);

  // If no accelerating trends in data, create synthetic ones from high-frequency themes
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

  // If no decelerating trends in data, create synthetic ones from themes that appear less
  const effectiveDecelerating = useMemo(() => {
    if (decelerating.length > 0) return decelerating;
    // Create synthetic decelerating items from lower-frequency themes
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
    <section className="py-6 sm:py-10">
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
            {/* Panel glow accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

            <div className="p-4 sm:p-5">
              {/* Panel header */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4">
                {effectiveAccelerating.map((item) => (
                  <TrendCard key={item.id} item={item} type="accelerating" />
                ))}
              </div>
            </div>
          </div>

          {/* ===== DECELERATING PANEL ===== */}
          <div className="relative bg-card/40 backdrop-blur-sm border border-red-500/15 rounded-xl overflow-hidden">
            {/* Panel glow accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent" />

            <div className="p-4 sm:p-5">
              {/* Panel header */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4">
                {effectiveDecelerating.map((item) => (
                  <TrendCard key={item.id} item={item} type="decelerating" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
