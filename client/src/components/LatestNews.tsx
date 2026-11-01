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
import { useMemo, useState, useEffect } from "react";
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
import { getPlacesMap, type Place } from "@/data/placesData";
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
  related_levels?: number[];
  srt_significance?: string;
  watch_next?: string | string[];
  place_id?: string | null;
  place_confidence?: number;
  place_reason?: string;
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
  const [placesMap, setPlacesMap] = useState<Map<string, Place>>(new Map());

  // Load places data once
  useEffect(() => {
    getPlacesMap().then(setPlacesMap);
  }, []);

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
          related_levels: (event as any).related_levels,
          srt_significance: (event as any).srt_significance,
          watch_next: (event as any).watch_next,
          place_id: (event as any).place_id,
          place_confidence: (event as any).place_confidence,
          place_reason: (event as any).place_reason,
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
            const srtColor = getSrtColor(item.level);
            const executive = isExecutive ? getEventExplanation(item) : undefined;

            // Always use InlineNewsCard for all visitors
            return <InlineNewsCard key={item.news_id || identity.newsId} item={item} executive={executive} loading={executiveLoading} isEn={isEn} accentColor={srtColor} placesMap={placesMap} />;
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
