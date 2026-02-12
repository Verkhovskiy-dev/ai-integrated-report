/*
 * DESIGN: Intelligence Dashboard — Timeline
 * Vertical timeline of key events with type color coding
 * Mobile: simplified layout without vertical line
 */
import { KEY_EVENTS, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, SRT_LEVELS } from "@/data/reportData";

function getLevelColor(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.color || "#666";
}

function getLevelName(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.short || "";
}

export default function Timeline() {
  // Group events by date
  const grouped = KEY_EVENTS.reduce<Record<string, typeof KEY_EVENTS>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const dates = Object.keys(grouped);

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          Хронология событий
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          Ключевые события периода
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          Наиболее значимые события, зафиксированные в ежедневных отчётах.
        </p>
      </div>

      {/* Event type legend */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-5 sm:mb-8">
        {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1 sm:gap-1.5">
            <div
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
              style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
            />
            <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line — desktop only */}
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border/50 hidden sm:block" />

        <div className="space-y-4 sm:space-y-6">
          {dates.map((date) => (
            <div key={date} className="relative">
              <div className="flex items-start gap-2 sm:gap-4">
                {/* Date marker — desktop */}
                <div className="w-[72px] shrink-0 text-right hidden sm:block">
                  <span className="text-xs font-mono text-primary font-medium">{date}</span>
                </div>

                {/* Dot on timeline — desktop */}
                <div className="hidden sm:flex w-3 h-3 rounded-full bg-primary/30 border-2 border-primary shrink-0 mt-1.5 relative z-10" />

                {/* Events for this date */}
                <div className="flex-1 space-y-1.5 sm:space-y-2">
                  {/* Date — mobile */}
                  <div className="sm:hidden flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-primary/30 border-2 border-primary shrink-0" />
                    <span className="text-xs font-mono text-primary font-medium">{date}</span>
                  </div>

                  {grouped[date].map((event, i) => {
                    const typeColor = EVENT_TYPE_COLORS[event.type] || "#666";
                    return (
                      <div
                        key={i}
                        className="bg-card/40 border border-border/40 rounded-lg p-2.5 sm:p-3 hover:border-primary/20 transition-all duration-200"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                          <span
                            className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded"
                            style={{
                              color: typeColor,
                              backgroundColor: `${typeColor}15`,
                            }}
                          >
                            {EVENT_TYPE_LABELS[event.type]}
                          </span>
                          <span
                            className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded border border-border/30"
                            style={{ color: getLevelColor(event.level) }}
                          >
                            Ур.{event.level} {getLevelName(event.level)}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-foreground/90 leading-relaxed">
                          {event.event}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
