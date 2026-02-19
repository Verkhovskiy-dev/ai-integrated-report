/*
 * FilterBar: Search + intuitive SRT level filter
 * Always-visible toggle buttons with full level names, color coding,
 * event counts, and explanatory tooltip. Mobile-friendly.
 */
import { Search, X, Info, Layers } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useState, useMemo } from "react";

const LEVELS = [
  { level: 9, name: "Капитал",     short: "Капитал",  color: "#ef4444", desc: "Финансы, инвестиции, VC, IPO" },
  { level: 8, name: "Институты",   short: "Институты", color: "#f97316", desc: "Государство, регулирование, геополитика" },
  { level: 7, name: "Знания",      short: "Знания",    color: "#f59e0b", desc: "Образование, исследования, компетенции" },
  { level: 6, name: "Технологии",  short: "Техно",     color: "#22d3ee", desc: "Модели, платформы, AI-сервисы" },
  { level: 5, name: "Value Chain", short: "V.Chain",   color: "#06b6d4", desc: "Цепочки создания стоимости, SaaS" },
  { level: 4, name: "Hardware",    short: "HW",        color: "#0ea5e9", desc: "Чипы, GPU, дата-центры, память" },
  { level: 3, name: "Профессии",   short: "Проф.",     color: "#10b981", desc: "Рынок труда, навыки, автоматизация" },
  { level: 2, name: "География",   short: "Гео",       color: "#84cc16", desc: "Региональные хабы, локализация" },
  { level: 1, name: "Ресурсы",     short: "Ресурсы",   color: "#a3e635", desc: "Энергия, вода, редкие металлы" },
];

export default function FilterBar() {
  const { searchQuery, setSearchQuery, selectedLevels, toggleLevel, clearLevels, hasActiveFilters } = useFilters();
  const { latestReport } = useLiveData();
  const [showInfo, setShowInfo] = useState(false);
  const [showLevels, setShowLevels] = useState(false);

  // Count events per level from the latest report
  const levelCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    if (latestReport?.srt_levels) {
      for (const srt of latestReport.srt_levels) {
        counts[srt.level] = srt.event_count || srt.events?.length || 0;
      }
    }
    return counts;
  }, [latestReport]);

  const totalSelected = selectedLevels.length;
  const totalEvents = Object.values(levelCounts).reduce((s, c) => s + c, 0);

  return (
    <div className="sticky top-12 sm:top-14 z-30 bg-background/90 backdrop-blur-lg border-b border-border/30">
      {/* Main bar: search + level toggle */}
      <div className="container flex items-center gap-2 py-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по трендам и событиям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-muted/30 border border-border/40 rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Level filter toggle */}
        <button
          onClick={() => setShowLevels(!showLevels)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-all ${
            showLevels || totalSelected > 0
              ? "bg-primary/15 border-primary/30 text-primary"
              : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Уровни СРТ</span>
          <span className="sm:hidden">СРТ</span>
          {totalSelected > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 text-[9px] bg-primary/20 rounded-full font-mono">{totalSelected}/9</span>
          )}
        </button>

        {/* Info button */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          title="Что такое уровни СРТ?"
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchQuery(""); clearLevels(); }}
            className="text-[10px] text-muted-foreground hover:text-foreground underline whitespace-nowrap"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Info tooltip about SRT */}
      {showInfo && (
        <div className="container pb-3">
          <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground mb-1">
                  Структура Разделения Труда (СРТ)
                </h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  СРТ — это 9-уровневая модель анализа AI-индустрии. Каждый уровень описывает отдельный слой экосистемы:
                  от физических ресурсов (уровень 1) до финансового капитала (уровень 9).
                  Фильтр позволяет сфокусироваться на интересующих уровнях — все секции дашборда будут показывать
                  только события и тренды выбранных уровней.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="text-[10px] text-primary hover:underline mt-1"
            >
              Понятно, закрыть
            </button>
          </div>
        </div>
      )}

      {/* Level buttons panel */}
      {showLevels && (
        <div className="container pb-3">
          <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-lg p-2.5 sm:p-3">
            {/* Header with quick actions */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                {totalSelected === 0
                  ? `Все уровни · ${totalEvents} событий`
                  : `Выбрано ${totalSelected} из 9`}
              </span>
              <div className="flex gap-2">
                {totalSelected > 0 && (
                  <button
                    onClick={clearLevels}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline"
                  >
                    Показать все
                  </button>
                )}
              </div>
            </div>

            {/* Level buttons — always visible, not hidden behind dropdown */}
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-1.5 sm:gap-2">
              {LEVELS.map(({ level, name, short, color, desc }) => {
                const isActive = selectedLevels.length === 0 || selectedLevels.includes(level);
                const isExplicit = selectedLevels.includes(level);
                const count = levelCounts[level] || 0;

                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`relative flex flex-col items-center gap-0.5 px-2 py-2 sm:py-2.5 rounded-lg border text-center transition-all duration-200 ${
                      isExplicit
                        ? "border-current bg-current/10 shadow-sm"
                        : selectedLevels.length > 0 && !isActive
                        ? "border-border/20 bg-muted/10 opacity-40"
                        : "border-border/30 bg-muted/20 hover:bg-muted/40 hover:border-border/50"
                    }`}
                    style={isExplicit ? { color, borderColor: `${color}50` } : undefined}
                    title={desc}
                  >
                    {/* Level number badge */}
                    <span
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold mb-0.5"
                      style={{
                        backgroundColor: isExplicit ? `${color}25` : `${color}15`,
                        color: isActive ? color : `${color}60`,
                      }}
                    >
                      {level}
                    </span>

                    {/* Level name */}
                    <span className={`text-[9px] sm:text-[10px] font-medium leading-tight ${
                      isActive ? "text-foreground" : "text-muted-foreground/60"
                    }`}>
                      <span className="hidden sm:inline">{name}</span>
                      <span className="sm:hidden">{short}</span>
                    </span>

                    {/* Event count */}
                    {count > 0 && (
                      <span
                        className="text-[8px] sm:text-[9px] font-mono mt-0.5"
                        style={{ color: isActive ? `${color}cc` : `${color}40` }}
                      >
                        {count} соб.
                      </span>
                    )}

                    {/* Description tooltip on hover (desktop only) */}
                    <span className="hidden lg:block absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-card border border-border/50 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                      {desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Description of selected level on mobile */}
            {selectedLevels.length === 1 && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center lg:hidden">
                {LEVELS.find(l => l.level === selectedLevels[0])?.desc}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
