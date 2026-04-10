/*
 * ExecutiveSummaryBar: Above-the-fold executive summary
 * Shows: total events count, key structural shift, main insight, one action
 * Designed to fit on the first screen without scrolling.
 * i18n support
 */
import { useMemo } from "react";
import { BarChart3, TrendingUp, Lightbulb, Zap, ArrowRight } from "lucide-react";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useTranslation } from "@/contexts/I18nContext";

export default function ExecutiveSummaryBar() {
  const {
    latestReport,
    isLive,
    reportDate,
    strategicInsights,
  } = useLiveData();
  const { locale } = useTranslation();
  const isEn = locale === "en";

  const summaryData = useMemo(() => {
    if (!latestReport) return null;

    // Total events count
    const totalEvents = latestReport.srt_levels?.reduce(
      (sum, lvl) => sum + (lvl.events?.length || 0),
      0
    ) || 0;

    // Key structural shift (first one)
    const shifts = (latestReport as any).structural_shifts || [];
    const keyShift = shifts[0]
      ? {
          title: shifts[0].title?.replace(/[*"]/g, "").trim() || "",
          from: shifts[0].from || "",
          to: shifts[0].to || "",
        }
      : null;

    // Main insight (first strategic insight)
    const mainInsight = strategicInsights[0] || null;

    // Top action — derived from the highest-level event (level 9)
    const topLevel = latestReport.srt_levels?.find((l) => l.level === 9);
    const topEvent = topLevel?.events?.[0];
    const actionText = topEvent
      ? topEvent.title
      : null;

    return { totalEvents, keyShift, mainInsight, actionText };
  }, [latestReport, strategicInsights]);

  if (!isLive || !summaryData) return null;

  const { totalEvents, keyShift, mainInsight, actionText } = summaryData;

  return (
    <section className="border-b border-border/40 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-sm">
      <div className="container py-3 sm:py-4">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs sm:text-sm font-heading font-bold text-foreground uppercase tracking-wider">
            {isEn ? "Executive Summary" : "Сводка дня"}
          </h2>
          <span className="text-[9px] font-mono text-muted-foreground">{reportDate}</span>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">

          {/* 1. Events count */}
          <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-lg bg-background/40 border border-border/30">
            <div className="w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                {isEn ? "Events" : "Событий"}
              </p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-primary tabular-nums leading-none">
                {totalEvents}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {isEn ? "across 9 SRT levels" : "по 9 уровням СРТ"}
              </p>
            </div>
          </div>

          {/* 2. Key shift */}
          <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-lg bg-background/40 border border-border/30">
            <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                {isEn ? "Key Shift" : "Ключевой сдвиг"}
              </p>
              {keyShift ? (
                <p className="text-[11px] sm:text-xs text-foreground leading-snug line-clamp-2 font-medium">
                  {keyShift.title || `${keyShift.from} → ${keyShift.to}`}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  {isEn ? "No shifts detected" : "Сдвигов не обнаружено"}
                </p>
              )}
            </div>
          </div>

          {/* 3. Main insight */}
          <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-lg bg-background/40 border border-border/30">
            <div className="w-8 h-8 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                {isEn ? "Key Insight" : "Главный инсайт"}
              </p>
              {mainInsight ? (
                <p className="text-[11px] sm:text-xs text-foreground leading-snug line-clamp-2 font-medium">
                  {mainInsight.title}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">—</p>
              )}
            </div>
          </div>

          {/* 4. Action */}
          <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-lg bg-background/40 border border-emerald-500/20">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                {isEn ? "Focus Action" : "Фокус действия"}
              </p>
              {actionText ? (
                <p className="text-[11px] sm:text-xs text-foreground leading-snug line-clamp-2 font-medium">
                  {actionText}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">—</p>
              )}
              <a
                href="#insights"
                className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-mono text-primary/70 hover:text-primary transition-colors"
              >
                {isEn ? "Details" : "Подробнее"} <ArrowRight className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
