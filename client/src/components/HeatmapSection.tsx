/*
 * DESIGN: Intelligence Dashboard — Heatmap
 * Activity intensity by СРТ level and date
 * Mobile: scrollable horizontally with sticky labels
 */
import { useState } from "react";
import { HEATMAP_DATA, SRT_LEVELS } from "@/data/reportData";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function getHeatColor(value: number): string {
  if (value === 0) return "rgba(0,212,255,0.03)";
  if (value === 1) return "rgba(0,212,255,0.12)";
  if (value === 2) return "rgba(0,212,255,0.25)";
  if (value === 3) return "rgba(0,212,255,0.45)";
  return "rgba(0,212,255,0.7)";
}

function getGroupColor(group: string): string {
  if (group === "upper") return "#ef4444";
  if (group === "middle") return "#22d3ee";
  return "#10b981";
}

function getGroupLabel(group: string): string {
  if (group === "upper") return "Надстройка (9-7)";
  if (group === "middle") return "Технологии (6-4)";
  return "Базис (3-1)";
}

export default function HeatmapSection() {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; level: number } | null>(null);

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          Тепловая карта активности
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          Интенсивность по уровням СРТ
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          Количество значимых событий по каждому уровню Структуры Разделения Труда за каждый день отчётного периода.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        {["upper", "middle", "lower"].map((group) => (
          <div key={group} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
              style={{ backgroundColor: getGroupColor(group) }}
            />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{getGroupLabel(group)}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-auto sm:ml-4">
          <span className="text-[10px] text-muted-foreground mr-1">Инт.:</span>
          {[0, 1, 2, 3, 4].map((v) => (
            <div
              key={v}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm border border-border/30"
              style={{ backgroundColor: getHeatColor(v) }}
            />
          ))}
          <span className="text-[9px] sm:text-[10px] text-muted-foreground ml-1">0—4+</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[600px]">
          {/* Date headers */}
          <div className="flex">
            <div className="w-32 sm:w-48 shrink-0" />
            {HEATMAP_DATA.map((d) => (
              <div key={d.date} className="flex-1 text-center">
                <span className="text-[8px] sm:text-[10px] font-mono text-muted-foreground">
                  {d.date.replace("Jan ", "Я").replace("Feb ", "Ф")}
                </span>
              </div>
            ))}
          </div>

          {/* Level rows */}
          {SRT_LEVELS.map((level) => (
            <div key={level.id} className="flex items-center group">
              <div className="w-32 sm:w-48 shrink-0 flex items-center gap-1.5 sm:gap-2 py-0.5 sm:py-1 pr-2 sm:pr-3">
                <div
                  className="w-1 sm:w-1.5 h-5 sm:h-6 rounded-full shrink-0"
                  style={{ backgroundColor: getGroupColor(level.group) }}
                />
                <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  <span className="font-mono text-foreground/60 mr-0.5 sm:mr-1">{level.id}</span>
                  {level.short}
                </span>
              </div>
              {HEATMAP_DATA.map((d) => {
                const value = d.levels[level.id] || 0;
                const isHovered = hoveredCell?.date === d.date && hoveredCell?.level === level.id;
                return (
                  <Tooltip key={d.date}>
                    <TooltipTrigger asChild>
                      <div
                        className="flex-1 p-0.5"
                        onMouseEnter={() => setHoveredCell({ date: d.date, level: level.id })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className={`
                            w-full h-5 sm:h-7 rounded-sm transition-all duration-200 border
                            ${isHovered ? "border-primary/50 scale-110" : "border-transparent"}
                          `}
                          style={{ backgroundColor: getHeatColor(value) }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border-border text-popover-foreground">
                      <p className="font-mono text-xs">
                        {d.date} — Ур. {level.id} ({level.short})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Событий: <span className="text-primary font-medium">{value}</span>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
