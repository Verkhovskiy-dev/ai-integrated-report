/*
 * DESIGN: Intelligence Dashboard — Structural Shifts
 * Cards showing FROM → TO transitions with level badges
 * Now includes SKOLKOVO program links in mechanism section
 * Supports search and level filtering
 * Mobile-first responsive, i18n support
 */
import { useState, useMemo } from "react";
import { ArrowRight, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import { SRT_LEVELS } from "@/data/reportData";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useFilters } from "@/contexts/FilterContext";
import { useTranslation } from "@/contexts/I18nContext";
import { ProgramBadgeGroup } from "@/components/ProgramBadge";

function getLevelColor(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.color || "#666";
}

export default function StructuralShifts() {
  const { structuralShifts: STRUCTURAL_SHIFTS } = useLiveData();
  const { selectedLevels, searchQuery } = useFilters();
  const { t, locale } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isEn = locale === "en";

  function getLevelName(id: number): string {
    return t.filter.cptLevels[id]?.short || SRT_LEVELS.find((l) => l.id === id)?.short || "";
  }

  function getTrendBadge(trend: string) {
    const labels: Record<string, { label: string; color: string }> = {
      accelerating: {
        label: isEn ? "Accelerating" : "Ускоряется",
        color: "text-red-400 bg-red-400/10 border-red-400/20",
      },
      emerging: {
        label: isEn ? "Emerging" : "Формируется",
        color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      },
    };
    return labels[trend] || {
      label: isEn ? "Stable" : "Стабильно",
      color: "text-green-400 bg-green-400/10 border-green-400/20",
    };
  }

  const filteredShifts = useMemo(() => {
    return STRUCTURAL_SHIFTS.filter((shift) => {
      if (selectedLevels.length > 0) {
        const hasMatchingLevel = shift.levels.some((lvl) => selectedLevels.includes(lvl));
        if (!hasMatchingLevel) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const text = `${shift.title} ${shift.from} ${shift.to} ${shift.mechanism}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [STRUCTURAL_SHIFTS, selectedLevels, searchQuery]);

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          {t.shifts.sectionLabel}
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          {isEn ? "Key Transformations of the Period" : "Ключевые трансформации периода"}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          {isEn
            ? "Sustained FROM → TO transitions recorded in multiple reports. Each shift affects several DLS levels."
            : "Устойчивые переходы «ОТ → К», зафиксированные в нескольких отчётах. Каждый сдвиг затрагивает несколько уровней СРТ."}
          {filteredShifts.length !== STRUCTURAL_SHIFTS.length && (
            <span className="text-primary ml-1">
              {isEn
                ? `Showing ${filteredShifts.length} of ${STRUCTURAL_SHIFTS.length}`
                : `Показано ${filteredShifts.length} из ${STRUCTURAL_SHIFTS.length}`}
            </span>
          )}
        </p>
      </div>

      {filteredShifts.length === 0 ? (
        <div className="bg-card/40 border border-border/30 rounded-xl p-6 sm:p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {STRUCTURAL_SHIFTS.length === 0
              ? (isEn
                  ? "Structural shifts are formed after accumulating several reports. Data will appear automatically."
                  : "Структурные сдвиги формируются после накопления нескольких отчётов. Данные появятся автоматически.")
              : (isEn
                  ? "No shifts match the selected filters."
                  : "Нет сдвигов, соответствующих фильтрам.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filteredShifts.map((shift) => {
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
                        {isEn ? "Mentions:" : "Упоминаний:"} {shift.frequency}
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
                      <span className="text-[10px] text-muted-foreground">{isEn ? "FROM:" : "ОТ:"}</span>{" "}
                      <span className="text-[11px] text-foreground/80">{shift.from}</span>
                    </div>
                    <div className="flex justify-center">
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-primary/5 rounded px-2 py-1.5 border border-primary/20">
                      <span className="text-[10px] text-primary/70">{isEn ? "TO:" : "К:"}</span>{" "}
                      <span className="text-[11px] text-foreground">{shift.to}</span>
                    </div>
                  </div>
                  {/* Desktop: side by side */}
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-muted/50 rounded px-2.5 py-1.5 border border-border/30">
                      <span className="text-muted-foreground">{isEn ? "FROM:" : "ОТ:"}</span>{" "}
                      <span className="text-foreground/80">{shift.from}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 bg-primary/5 rounded px-2.5 py-1.5 border border-primary/20">
                      <span className="text-primary/70">{isEn ? "TO:" : "К:"}</span>{" "}
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
                      <span className="text-foreground/70 font-medium">{isEn ? "Mechanism:" : "Механизм:"}</span>{" "}
                      {shift.mechanism}
                    </p>
                    {/* Program links */}
                    {(shift as any).relevantPrograms && (shift as any).relevantPrograms.length > 0 && (
                      <ProgramBadgeGroup
                        programKeys={(shift as any).relevantPrograms}
                        compact={true}
                        label={isEn ? "Programs →" : "Программы →"}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
