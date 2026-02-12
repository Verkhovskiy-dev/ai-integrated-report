/*
 * DESIGN: Intelligence Dashboard — Structural Shifts
 * Cards showing FROM → TO transitions with level badges
 * Mobile-first responsive
 */
import { useState } from "react";
import { ArrowRight, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import { STRUCTURAL_SHIFTS, SRT_LEVELS } from "@/data/reportData";

function getLevelColor(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.color || "#666";
}

function getLevelName(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.short || "";
}

function getTrendBadge(trend: string) {
  if (trend === "accelerating") return { label: "Ускоряется", color: "text-red-400 bg-red-400/10 border-red-400/20" };
  if (trend === "emerging") return { label: "Формируется", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
  return { label: "Стабильно", color: "text-green-400 bg-green-400/10 border-green-400/20" };
}

export default function StructuralShifts() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          Структурные сдвиги
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          Ключевые трансформации периода
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          Устойчивые переходы «ОТ → К», зафиксированные в нескольких отчётах. Каждый сдвиг затрагивает несколько уровней СРТ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {STRUCTURAL_SHIFTS.map((shift) => {
          const isExpanded = expandedId === shift.id;
          const trendBadge = getTrendBadge(shift.trend);

          return (
            <div
              key={shift.id}
              className={`
                bg-card/60 backdrop-blur-sm border rounded-lg overflow-hidden transition-all duration-300
                ${isExpanded ? "border-primary/30 glow-cyan" : "border-border/50 hover:border-border"}
              `}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : shift.id)}
                className="w-full text-left p-3 sm:p-4 flex items-start justify-between gap-2 sm:gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
                    <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border ${trendBadge.color}`}>
                      {trendBadge.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">
                      Упоминаний: {shift.frequency}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground leading-snug">
                    {shift.title}
                  </h4>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                )}
              </button>

              {/* Transition Arrow */}
              <div className="px-3 sm:px-4 pb-2.5 sm:pb-3">
                {/* Mobile: stacked vertically */}
                <div className="sm:hidden space-y-1.5">
                  <div className="bg-muted/50 rounded px-2 py-1.5 border border-border/30">
                    <span className="text-[10px] text-muted-foreground">ОТ:</span>{" "}
                    <span className="text-[11px] text-foreground/80">{shift.from}</span>
                  </div>
                  <div className="flex justify-center">
                    <ArrowDown className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-primary/5 rounded px-2 py-1.5 border border-primary/20">
                    <span className="text-[10px] text-primary/70">К:</span>{" "}
                    <span className="text-[11px] text-foreground">{shift.to}</span>
                  </div>
                </div>
                {/* Desktop: side by side */}
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-muted/50 rounded px-2.5 py-1.5 border border-border/30">
                    <span className="text-muted-foreground">ОТ:</span>{" "}
                    <span className="text-foreground/80">{shift.from}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 bg-primary/5 rounded px-2.5 py-1.5 border border-primary/20">
                    <span className="text-primary/70">К:</span>{" "}
                    <span className="text-foreground">{shift.to}</span>
                  </div>
                </div>
              </div>

              {/* Level badges */}
              <div className="px-3 sm:px-4 pb-2.5 sm:pb-3 flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {shift.levels.map((lvl) => (
                  <span
                    key={lvl}
                    className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded border border-border/40"
                    style={{ color: getLevelColor(lvl), borderColor: `${getLevelColor(lvl)}33` }}
                  >
                    {lvl}·{getLevelName(lvl)}
                  </span>
                ))}
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-border/30 pt-2.5 sm:pt-3">
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    <span className="text-foreground/70 font-medium">Механизм:</span>{" "}
                    {shift.mechanism}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
