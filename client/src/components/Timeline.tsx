/*
 * DESIGN: Intelligence Dashboard — Timeline
 * Vertical timeline of key events with severity color coding
 * Mobile: simplified layout without vertical line
 * i18n support
 *
 * CHANGES (Priority 1.2 + 1.3 + 1.5):
 * - Severity-based color coding: 1-3 grey, 4-6 yellow, 7-8 orange, 9 red
 * - Uses report date instead of render time
 * - Deduplication: events are shown once, sorted by level (highest first)
 */
import { useMemo } from "react";
import { EVENT_TYPE_COLORS, SRT_LEVELS } from "@/data/reportData";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useTranslation } from "@/contexts/I18nContext";

/* ── Severity color helpers ── */
function getSeverityColor(level: number): string {
  if (level >= 9) return "#ef4444";      // red
  if (level >= 7) return "#f97316";      // orange
  if (level >= 4) return "#eab308";      // yellow
  return "#6b7280";                       // grey
}

function getSeverityBorder(level: number): string {
  if (level >= 9) return "border-red-500/30";
  if (level >= 7) return "border-orange-500/25";
  if (level >= 4) return "border-yellow-500/20";
  return "border-border/40";
}

export default function Timeline() {
  const { keyEvents: KEY_EVENTS, reportDate } = useLiveData();
  const { t } = useTranslation();

  function getLevelName(id: number): string {
    return t.filter.cptLevels[id]?.short || SRT_LEVELS.find((l) => l.id === id)?.short || "";
  }

  // Deduplicate events by title (keep first occurrence) and sort by level desc
  const deduplicatedEvents = useMemo(() => {
    const seen = new Set<string>();
    const unique = KEY_EVENTS.filter((e) => {
      const key = e.event.trim().toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Sort by level descending (most important first)
    return [...unique].sort((a, b) => b.level - a.level);
  }, [KEY_EVENTS]);

  // Use report date for all events (single date grouping)
  const displayDate = reportDate || deduplicatedEvents[0]?.date || "";

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          {t.timeline.sectionLabel}
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          {t.timeline.title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          {t.timeline.description}
        </p>
      </div>

      {/* Severity legend */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-5 sm:mb-8">
        {[
          { label: t.timeline.eventTypes?.investment || "Critical (Lv.9)", color: "#ef4444", text: "Ур. 9" },
          { label: t.timeline.eventTypes?.regulation || "High (Lv.7-8)", color: "#f97316", text: "Ур. 7-8" },
          { label: t.timeline.eventTypes?.product || "Medium (Lv.4-6)", color: "#eab308", text: "Ур. 4-6" },
          { label: t.timeline.eventTypes?.social || "Low (Lv.1-3)", color: "#6b7280", text: "Ур. 1-3" },
        ].map((s) => (
          <div key={s.text} className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">{s.text}</span>
          </div>
        ))}
        <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/50 ml-2">
          {displayDate}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line — desktop only */}
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border/50 hidden sm:block" />

        <div className="space-y-1.5 sm:space-y-2">
          {/* Date header */}
          <div className="relative flex items-start gap-2 sm:gap-4 mb-3">
            <div className="w-[72px] shrink-0 text-right hidden sm:block">
              <span className="text-xs font-mono text-primary font-medium">{displayDate}</span>
            </div>
            <div className="hidden sm:flex w-3 h-3 rounded-full bg-primary/30 border-2 border-primary shrink-0 mt-1.5 relative z-10" />
            <div className="sm:hidden flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary/30 border-2 border-primary shrink-0" />
              <span className="text-xs font-mono text-primary font-medium">{displayDate}</span>
            </div>
          </div>

          {deduplicatedEvents.map((event, i) => {
            const sevColor = getSeverityColor(event.level);
            const sevBorder = getSeverityBorder(event.level);
            const typeColor = EVENT_TYPE_COLORS[event.type] || "#666";
            const typeLabel = t.timeline.eventTypes[event.type] || event.type;

            return (
              <div key={i} className="relative flex items-start gap-2 sm:gap-4">
                {/* Level number — desktop */}
                <div className="w-[72px] shrink-0 text-right hidden sm:block">
                  <span
                    className="text-[10px] font-mono font-medium"
                    style={{ color: sevColor }}
                  >
                    {t.timeline.levelPrefix}{event.level}
                  </span>
                </div>

                {/* Dot on timeline — desktop */}
                <div
                  className="hidden sm:flex w-2.5 h-2.5 rounded-full shrink-0 mt-2 relative z-10 border-2"
                  style={{
                    backgroundColor: `${sevColor}30`,
                    borderColor: sevColor,
                  }}
                />

                {/* Event card */}
                <div
                  className={`flex-1 bg-card/40 border rounded-lg p-2.5 sm:p-3 transition-all duration-200 hover:border-primary/20 ${sevBorder}`}
                  style={{
                    backgroundColor: event.level >= 7 ? `${sevColor}08` : undefined,
                  }}
                >
                  {/* Severity accent bar */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                    <span
                      className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded"
                      style={{
                        color: typeColor,
                        backgroundColor: `${typeColor}15`,
                      }}
                    >
                      {typeLabel}
                    </span>
                    <span
                      className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded border"
                      style={{
                        color: sevColor,
                        borderColor: `${sevColor}30`,
                        backgroundColor: `${sevColor}10`,
                      }}
                    >
                      {t.timeline.levelPrefix}{event.level} {getLevelName(event.level)}
                    </span>
                    {/* Mobile level indicator */}
                    <span className="sm:hidden text-[8px] font-mono text-muted-foreground/50">
                      {displayDate}
                    </span>
                  </div>
                  <p className={`text-[11px] sm:text-xs text-foreground/90 leading-relaxed ${
                    event.level >= 9 ? "font-semibold" : event.level >= 7 ? "font-medium" : ""
                  }`}>
                    {event.event}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
