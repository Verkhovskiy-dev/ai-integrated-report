/*
 * DESIGN: Intelligence Dashboard — Weak Signals
 * Grid of signal cards with urgency indicators
 * Now includes SKOLKOVO program links on relevant signals
 * Mobile: single column, radar hidden on small screens
 * i18n support
 */
import { useMemo } from "react";
import { SRT_LEVELS } from "@/data/reportData";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useFilters } from "@/contexts/FilterContext";
import { useTranslation } from "@/contexts/I18nContext";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { ProgramBadgeGroup } from "@/components/ProgramBadge";

const RADAR_BG = "https://private-us-east-1.manuscdn.com/sessionFile/v7uKuw67xnKHKY8cq65BNf/sandbox/TAGv8ZfRAyZfV9Lj7wYGNr-img-2_1770928026000_na1fn_cmFkYXItYmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvdjd1S3V3Njd4bktIS1k4Y3E2NUJOZi9zYW5kYm94L1RBR3Y4WmZSQXlaZlY5TGo3d1lHTnItaW1nLTJfMTc3MDkyODAyNjAwMF9uYTFmbl9jbUZrWVhJdFltYy5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=JzbVkgmDDlD6niekdkpPYW1T~wh-zLB0yRpsOSXaMJavyKyxipJo3-syc~xmMJ-Ipsvg51wwZ7mIYA58OpIZuMbOJSqQ7vsQHptay8010mSFEm3LFOVw1o7cAiVNHwAbT9ufh8~X5N8uqHro0Bwc0irb6ilF0wb2fXVdctzs8UM8C74krueKCQgpdQj1AAArv1pmUziDfdGxgDs1g~zjQIEQzZnwNSeeq-7MS2AUDW5lfeURKPHMJHiVuUgiuhbODZmB8tKzQppq7wu-TmF9XJS7pDoO90Qt~bzvmXqIR3ShobqkG9z1XlKPNNd4v-FseIaQUyJMtR5hRpqmDJ2L3Q__";

function getLevelColor(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.color || "#666";
}

export default function WeakSignalsRadar() {
  const { weakSignals: WEAK_SIGNALS } = useLiveData();
  const { selectedLevels, searchQuery } = useFilters();
  const { t, locale } = useTranslation();

  const isEn = locale === "en";

  function getLevelName(id: number): string {
    return t.filter.cptLevels[id]?.short || SRT_LEVELS.find((l) => l.id === id)?.short || "";
  }

  function getUrgencyConfig(urgency: string) {
    if (urgency === "high") return {
      icon: AlertTriangle,
      label: isEn ? "High" : "Высокая",
      color: "text-red-400",
      bg: "bg-red-400/10",
      border: "border-red-400/20",
      dot: "bg-red-400",
    };
    return {
      icon: AlertCircle,
      label: isEn ? "Medium" : "Средняя",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      dot: "bg-amber-400",
    };
  }

  const filteredSignals = useMemo(() => {
    return WEAK_SIGNALS.filter((s) => {
      if (selectedLevels.length > 0 && !selectedLevels.includes(s.level)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const text = `${s.title} ${s.description}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [WEAK_SIGNALS, selectedLevels, searchQuery]);

  const highCount = filteredSignals.filter((s) => s.urgency === "high").length;
  const mediumCount = filteredSignals.filter((s) => s.urgency === "medium").length;

  return (
    <div className="container">
      {/* Header + Summary for mobile — hidden on lg where left panel has its own header */}
      <div className="mb-5 sm:mb-0 lg:hidden">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          {t.signals.sectionLabel}
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          {isEn ? "Signals on Radar" : "Сигналы на радаре"}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-0">
          {isEn ? "Early indicators of future structural changes." : "Ранние индикаторы будущих структурных изменений."}
        </p>

        {/* Mobile summary stats */}
        <div className="flex gap-4 sm:hidden mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-muted-foreground">{isEn ? "High" : "Высокая"}: <span className="text-red-400 font-medium">{highCount}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-muted-foreground">{isEn ? "Medium" : "Средняя"}: <span className="text-amber-400 font-medium">{mediumCount}</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left: Radar image + summary — hidden on mobile */}
        <div className="hidden sm:block lg:col-span-4">
          <div className="sticky top-20">
            <div className="hidden lg:block">
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
                {t.signals.sectionLabel}
              </p>
              <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
                {isEn ? "Signals on Radar" : "Сигналы на радаре"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {isEn ? "Early indicators of future structural changes identified in reports." : "Ранние индикаторы будущих структурных изменений, зафиксированные в отчётах."}
              </p>
            </div>

            {/* Radar image */}
            <div className="relative w-full aspect-square max-w-[280px] mx-auto mb-6">
              <img
                src={RADAR_BG}
                alt="Radar"
                className="w-full h-full object-contain opacity-60"
              />
              {WEAK_SIGNALS.map((signal, i) => {
                const angle = (i / WEAK_SIGNALS.length) * Math.PI * 2 - Math.PI / 2;
                const radius = signal.urgency === "high" ? 30 : 38;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);
                const urgency = getUrgencyConfig(signal.urgency);
                return (
                  <div
                    key={signal.id}
                    className={`absolute w-2.5 h-2.5 rounded-full ${urgency.dot} pulse-signal`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                      animationDelay: `${i * 200}ms`,
                    }}
                  />
                );
              })}
            </div>

            {/* Summary stats */}
            <div className="flex gap-4 justify-center">
              <div className="text-center">
                <div className="text-2xl font-heading font-bold text-red-400">{highCount}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{isEn ? "High urgency" : "Высокая срочность"}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-heading font-bold text-amber-400">{mediumCount}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{isEn ? "Medium urgency" : "Средняя срочность"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Signal cards */}
        <div className="lg:col-span-8">
          {filteredSignals.length === 0 ? (
            <div className="bg-card/40 border border-border/30 rounded-xl p-6 sm:p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {WEAK_SIGNALS.length === 0
                  ? (isEn
                      ? "Weak signals are formed after accumulating several reports. Data will appear automatically."
                      : "Слабые сигналы формируются после накопления нескольких отчётов. Данные появятся автоматически.")
                  : (isEn
                      ? "No signals match the selected filters."
                      : "Нет сигналов, соответствующих фильтрам.")}
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {filteredSignals.map((signal) => {
              const urgency = getUrgencyConfig(signal.urgency);
              const UrgencyIcon = urgency.icon;
              const hasPrograms = (signal as any).relevantPrograms && (signal as any).relevantPrograms.length > 0;
              return (
                <div
                  key={signal.id}
                  className={`
                    bg-card/60 backdrop-blur-sm border rounded-lg p-3 sm:p-4 transition-all duration-300
                    hover:border-primary/20 ${urgency.border}
                  `}
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span
                      className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/40"
                      style={{ color: getLevelColor(signal.level), borderColor: `${getLevelColor(signal.level)}33` }}
                    >
                      {signal.level}·{getLevelName(signal.level)}
                    </span>
                    <div className={`flex items-center gap-1 ${urgency.color}`}>
                      <UrgencyIcon className="w-3 h-3" />
                      <span className="text-[9px] sm:text-[10px] font-mono">{urgency.label}</span>
                    </div>
                  </div>
                  <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground mb-1 sm:mb-1.5 leading-snug">
                    {signal.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    {signal.description}
                  </p>
                  {/* Program links */}
                  {hasPrograms && (
                    <ProgramBadgeGroup
                      programKeys={(signal as any).relevantPrograms}
                      compact={true}
                      label={isEn ? "Programs →" : "Программы →"}
                    />
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
