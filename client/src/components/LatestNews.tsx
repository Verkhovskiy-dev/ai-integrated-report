/*
 * LatestNews: Full event list — shows events 4+ (first 3 are in HeroSummary).
 * Collapsible, shows 6 by default with "show all" toggle.
 * Each card is expandable to show full description and source links.
 * i18n support + Executive mode support
 *
 * CHANGES (Priority 1.2 + 1.5):
 * - Severity-based color coding: 1-3 grey, 4-6 yellow, 7-8 orange, 9 red
 * - Visual hierarchy: higher-level events get more prominent styling
 * - Skips first 3 events (already shown in HeroSummary) to remove duplication
 */
import { useMemo, useState } from "react";
import { Newspaper, Zap, ChevronDown, ChevronUp, ExternalLink, ArrowRight } from "lucide-react";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useFilters } from "@/contexts/FilterContext";
import { useTranslation } from "@/contexts/I18nContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useExecutiveData } from "@/contexts/ExecutiveDataContext";
import { ExecutiveEventCardLocalized } from "@/components/ExecutiveEventCard";
import { ShareButton } from "@/components/ShareableBlock";
import { buildShareId } from "@/lib/share";
import NewsReactions from "@/components/NewsReactions";
import InlineNewsCard from "@/components/InlineNewsCard";
import { buildNewsIdentity } from "@shared/newsIdentity";
import { executiveSafeDescription, importanceLabel } from "@/data/newsContract";

/* SRT is a taxonomy. Colour communicates its level, never importance. */
function getSrtColor(level: number): string {
  const colours = ["#64748b", "#0ea5e9", "#14b8a6", "#8b5cf6", "#f59e0b", "#f97316", "#ec4899", "#a855f7", "#e11d48"];
  return colours[Math.max(0, Math.min(8, level - 1))];
}

const EVENT_TYPE_ICONS: Record<string, string> = {
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

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

interface NewsItem {
  title: string;
  description: string;
  level: number;
  levelName: string;
  type: string;
  sources: string[];
  fact?: string;
  why_important?: string;
  news_id?: string;
  content_version?: string;
  importance?: { level: "critical" | "high" | "medium" | "low"; rationale: string } | null;
}

export default function LatestNews() {
  const { latestReport, isLive, reportDate } = useLiveData();
  const { selectedLevels, searchQuery } = useFilters();
  const { t, locale } = useTranslation();
  const { isExecutive } = useViewMode();
  const { getEventExplanation, loading: executiveLoading } = useExecutiveData();
  const isEn = locale === "en";
  const [expanded, setExpanded] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const LEVEL_NAMES: Record<number, string> = isEn
    ? { 9: "Capital", 8: "Institutions", 7: "Knowledge", 6: "Technology", 5: "Value Chain", 4: "Hardware", 3: "Professions", 2: "Geography", 1: "Resources" }
    : { 9: "Капитал", 8: "Институты", 7: "Знания", 6: "Технологии", 5: "Value Chain", 4: "Hardware", 3: "Профессии", 2: "География", 1: "Ресурсы" };

  const lvPrefix = isEn ? "Lv." : "Ур.";

  const newsItems = useMemo(() => {
    if (!latestReport?.srt_levels) return [];
    const items: NewsItem[] = [];

    for (const srtLevel of latestReport.srt_levels) {
      if (selectedLevels.length > 0 && !selectedLevels.includes(srtLevel.level)) continue;
      for (const event of srtLevel.events) {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!event.title.toLowerCase().includes(q) && !event.description.toLowerCase().includes(q)) continue;
        }
        items.push({
          title: event.title,
          description: event.description || "",
          level: srtLevel.level,
          levelName: LEVEL_NAMES[srtLevel.level] || `${lvPrefix}${srtLevel.level}`,
          type: guessType(event.title + " " + event.description),
          sources: (event as any).sources || [],
          fact: event.fact,
          why_important: event.why_important,
          news_id: event.news_id,
          content_version: event.content_version,
          importance: event.importance,
        });
      }
    }
    return items;
  }, [latestReport, selectedLevels, searchQuery, isEn]);

  // Skip first 3 events (already shown in HeroSummary) to avoid duplication
  const remainingItems = newsItems.slice(3);
  const INITIAL_SHOW = 6;
  const visibleItems = expanded ? remainingItems : remainingItems.slice(0, INITIAL_SHOW);

  if (!isLive || remainingItems.length === 0) return null;

  const toggleCard = (newsId: string) => {
    setExpandedCard(expandedCard === newsId ? null : newsId);
  };

  return (
    <section id="news" className={`py-4 sm:py-6${isExecutive ? " inline-news-section" : ""}`}>
      <div className="container">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20">
              <Newspaper className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-heading font-bold text-foreground">
                {isEn ? "All Events" : "Все события"}
              </h3>
              <p className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">
                {reportDate} · {isEn ? `${newsItems.length} events` : `${newsItems.length} событий`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExecutive && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-400">
                {isEn ? "Executive View" : "Для руководителя"}
              </span>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
            </div>
          </div>
        </div>

        {/* News cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {visibleItems.map((item, idx) => {
            const identity = buildNewsIdentity(item);
            const isCardExpanded = expandedCard === identity.newsId;
            const hasDetails = item.description && item.description !== item.title;
            const hasSources = item.sources.length > 0;
            const executive = isExecutive ? getEventExplanation(item) : undefined;
            const explanation = executive?.status === "available" ? executive.explanation : undefined;
            const displayDescription = executiveSafeDescription(item, executive, isExecutive);
            const isExpandable = hasDetails || hasSources || !!explanation || isExecutive;
            const srtColor = getSrtColor(item.level);
            const itemId = buildShareId("news", item.title);

            if (isExecutive && executive) {
              // Stable news identity keeps reaction state across fresh report renders.
              // https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key
              return <InlineNewsCard key={item.news_id || identity.newsId} item={item} executive={executive} loading={executiveLoading} isEn={isEn} accentColor={srtColor} />;
            }

            return (
              <div
                key={`${identity.newsId}:${identity.contentVersion}`}
                id={itemId}
                className={`group relative bg-card/50 backdrop-blur-sm border rounded-lg overflow-hidden transition-all duration-200 ${
                  isCardExpanded
                    ? "border-primary/30 shadow-lg shadow-primary/5"
                    : "border-border/40 hover:border-primary/20"
                }`}
                style={{ backgroundColor: "rgba(15, 23, 42, 0.18)" }}
              >
                <ShareButton id={itemId} title={item.title} text={displayDescription} compact className="absolute right-2 top-2" />
                {/* SRT taxonomy accent bar */}
                <div
                  className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                  style={{ backgroundColor: srtColor }}
                />

                {/* Card header — clickable */}
                <button
                  onClick={() => isExpandable && toggleCard(identity.newsId)}
                  className={`w-full text-left p-3 pl-4 pr-12 ${isExpandable ? "cursor-pointer" : "cursor-default"}`}
                  aria-expanded={isExpandable ? isCardExpanded : undefined}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium"
                        style={{
                          color: srtColor,
                          backgroundColor: `${srtColor}15`,
                          borderColor: `${srtColor}30`,
                          borderWidth: 1,
                        }}
                      >
                        {EVENT_TYPE_ICONS[item.type] || "📌"}
                        <span>{lvPrefix}{item.level} {item.levelName}</span>
                      </span>
                      <span className="text-[7px] font-mono px-1 py-0.5 rounded text-muted-foreground bg-muted/40">
                        {importanceLabel(item.importance, isEn)}
                      </span>
                    </div>
                    {isExpandable && (
                      isCardExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      )
                    )}
                  </div>
                  <p className={`text-xs sm:text-sm text-foreground leading-snug ${
                    isCardExpanded ? "" : "line-clamp-3"
                  } ${isExpandable && !isCardExpanded ? "group-hover:text-primary" : ""} transition-colors ${
                    item.level >= 9 ? "font-semibold" : item.level >= 7 ? "font-medium" : ""
                  }`}>
                    {item.title}
                  </p>
                </button>

                {/* Expanded content */}
                {isCardExpanded && (
                  <div className="px-3 pb-3 border-t border-border/20 pt-2 space-y-2 ml-1">
                    {/* Executive explanation (shown in executive mode) */}
                    {isExecutive && explanation && (
                      <ExecutiveEventCardLocalized
                        explanation={explanation}
                        accentColor={srtColor}
                        isEn={isEn}
                      />
                    )}

                    {isExecutive && executive?.status === "unavailable" && (
                      <p role="status" className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        {isEn ? "Executive explanation is unavailable for this exact report version." : "Пояснение для руководителя недоступно для этой версии новости."}
                      </p>
                    )}

                    {/* On rejection, show only the raw source fact, never generated interpretation. */}
                    {(!isExecutive || !explanation) && Boolean(displayDescription) && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        {displayDescription}
                      </p>
                    )}

                    {/* Source links */}
                    {hasSources && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30 border border-border/30 text-[10px] text-primary/80 hover:text-primary hover:border-primary/30 transition-all"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {extractDomain(src)}
                          </a>
                        ))}
                      </div>
                    )}

                    <a
                      href="#insights"
                      className="inline-flex items-center gap-1 pt-1 text-[10px] font-medium text-primary/80 hover:text-primary"
                    >
                      {isEn ? "See implications and decisions" : "Перейти к выводам и решениям"}
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <NewsReactions
                  title={item.title}
                  description={item.description}
                  sources={item.sources}
                  isEn={isEn}
                />
              </div>
            );
          })}
        </div>

        {/* Expand/Collapse toggle */}
        {remainingItems.length > INITIAL_SHOW && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center gap-1.5 mx-auto mt-3 px-4 py-2 rounded-lg bg-card/50 border border-border/40 hover:border-primary/30 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                  {isEn ? "Collapse" : "Свернуть"}
                </span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                  {isEn ? `Show ${remainingItems.length - INITIAL_SHOW} more` : `Показать ещё ${remainingItems.length - INITIAL_SHOW}`}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
