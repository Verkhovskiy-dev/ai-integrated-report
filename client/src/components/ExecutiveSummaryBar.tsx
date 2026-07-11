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
    loading,
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

    // Top action — 4th event by importance (top-3 already shown in hero block below)
    const flatEvents = [...(latestReport.srt_levels || [])]
      .sort((a, b) => b.level - a.level)
      .flatMap((l) => l.events || []);
    const topEvent = flatEvents[3] || flatEvents[0];
    const actionText = topEvent ? topEvent.title : null;

    // Compact day counters (merged from the former hero title strip)
    const trendsCount = latestReport.trends?.length || 0;
    const linksCount = latestReport.cross_level_links?.length || 0;

    return { totalEvents, keyShift, mainInsight, actionText, trendsCount, linksCount };
  }, [latestReport, strategicInsights]);

  if (loading) {
    return (
      <section className="border-b border-border/40 bg-card/40">
        <div className="container py-3 sm:py-4">
          <div className="h-4 w-40 rounded bg-card/80 animate-pulse mb-3" />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-16 rounded-lg bg-card/70 border border-border/30 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!isLive || !summaryData) return null;

  const { totalEvents, keyShift, mainInsight, actionText, trendsCount, linksCount } = summaryData;
  const insightsCount = strategicInsights.length;
  const plural = (n: number, f: [string, string, string]) => {
    const m10 = n % 10, m100 = n % 100;
    return f[m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2];
  };
  const countersLine = insightsCount + trendsCount + linksCount > 0
    ? isEn
      ? `${insightsCount} insights \u00b7 ${trendsCount} trends \u00b7 ${linksCount} links`
      : `${insightsCount} ${plural(insightsCount, ["инсайт", "инсайта", "инсайтов"])} \u00b7 ${trendsCount} ${plural(trendsCount, ["тренд", "тренда", "трендов"])} \u00b7 ${linksCount} ${plural(linksCount, ["связь", "связи", "связей"])}`
    : null;

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
                {countersLine || (isEn ? "across 9 SRT levels" : "по 9 уровням СРТ")}
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
