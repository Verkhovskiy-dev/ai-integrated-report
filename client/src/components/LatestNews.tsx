/*
 * LatestNews: Full event list — shows events 4+ (first 3 are in HeroSummary).
 * Collapsible, shows 6 by default with "show all" toggle.
 */
import { useMemo, useState } from "react";
import { Newspaper, ArrowUpRight, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useFilters } from "@/contexts/FilterContext";

const LEVEL_NAMES: Record<number, string> = {
  9: "Капитал", 8: "Институты", 7: "Знания", 6: "Технологии",
  5: "Value Chain", 4: "Hardware", 3: "Профессии", 2: "География", 1: "Ресурсы",
};

const LEVEL_COLORS: Record<number, string> = {
  9: "#ef4444", 8: "#f97316", 7: "#f59e0b", 6: "#22d3ee",
  5: "#06b6d4", 4: "#0ea5e9", 3: "#10b981", 2: "#84cc16", 1: "#a3e635",
};

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

export default function LatestNews() {
  const { latestReport, isLive, reportDate } = useLiveData();
  const { selectedLevels, searchQuery } = useFilters();
  const [expanded, setExpanded] = useState(false);

  const newsItems = useMemo(() => {
    if (!latestReport?.srt_levels) return [];
    const items: { title: string; level: number; levelName: string; type: string }[] = [];

    for (const srtLevel of latestReport.srt_levels) {
      if (selectedLevels.length > 0 && !selectedLevels.includes(srtLevel.level)) continue;
      for (const event of srtLevel.events) {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!event.title.toLowerCase().includes(q) && !event.description.toLowerCase().includes(q)) continue;
        }
        items.push({
          title: event.title,
          level: srtLevel.level,
          levelName: LEVEL_NAMES[srtLevel.level] || `Ур.${srtLevel.level}`,
          type: guessType(event.title + " " + event.description),
        });
      }
    }
    return items;
  }, [latestReport, selectedLevels, searchQuery]);

  // Skip first 3 (shown in HeroSummary)
  const remainingItems = newsItems.slice(3);
  const INITIAL_SHOW = 6;
  const visibleItems = expanded ? remainingItems : remainingItems.slice(0, INITIAL_SHOW);

  if (!isLive || remainingItems.length === 0) return null;

  return (
    <section id="news" className="py-4 sm:py-6">
      <div className="container">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20">
              <Newspaper className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-heading font-bold text-foreground">
                Все события
              </h3>
              <p className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">
                {reportDate} · ещё {remainingItems.length} событий
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
          </div>
        </div>

        {/* News cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {visibleItems.map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg p-3 hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium"
                  style={{
                    color: LEVEL_COLORS[item.level],
                    backgroundColor: `${LEVEL_COLORS[item.level]}15`,
                    borderColor: `${LEVEL_COLORS[item.level]}30`,
                    borderWidth: 1,
                  }}
                >
                  {EVENT_TYPE_ICONS[item.type] || "📌"}
                  <span>Ур.{item.level} {item.levelName}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <ArrowUpRight className="absolute top-3 right-3 w-3 h-3 text-muted-foreground/0 group-hover:text-primary/60 transition-all" />
            </div>
          ))}
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
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">Свернуть</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                  Показать ещё {remainingItems.length - INITIAL_SHOW}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
