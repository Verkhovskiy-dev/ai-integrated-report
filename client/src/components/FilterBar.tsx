import { Search, Filter, X } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { useState } from "react";

const LEVEL_NAMES: Record<number, string> = {
  9: "Капитал",
  8: "Институты",
  7: "Знания",
  6: "Технологии",
  5: "Value Chain",
  4: "Hardware",
  3: "Профессии",
  2: "География",
  1: "Ресурсы",
};

const LEVEL_COLORS: Record<number, string> = {
  9: "#ef4444", 8: "#f97316", 7: "#f59e0b",
  6: "#22d3ee", 5: "#06b6d4", 4: "#0ea5e9",
  3: "#10b981", 2: "#84cc16", 1: "#a3e635",
};

export default function FilterBar() {
  const { searchQuery, setSearchQuery, selectedLevels, toggleLevel, clearLevels, hasActiveFilters } = useFilters();
  const [showLevels, setShowLevels] = useState(false);

  return (
    <div className="sticky top-12 sm:top-14 z-30 bg-background/90 backdrop-blur-lg border-b border-border/30">
      <div className="container flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по трендам..."
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
        <button
          onClick={() => setShowLevels(!showLevels)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-all ${selectedLevels.length > 0 ? "bg-primary/15 border-primary/30 text-primary" : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"}`}
        >
          <Filter className="w-3 h-3" />
          <span>Уровни СРТ</span>
          {selectedLevels.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-primary/20 rounded-full">{selectedLevels.length}</span>
          )}
        </button>
        {hasActiveFilters && (
          <button onClick={() => { setSearchQuery(""); clearLevels(); }} className="text-[10px] text-muted-foreground hover:text-foreground underline">Сбросить</button>
        )}
      </div>
      {showLevels && (
        <div className="container pb-2">
          <div className="flex flex-wrap gap-1.5">
            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((level) => {
              const isActive = selectedLevels.includes(level);
              return (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border transition-all ${isActive ? "border-current bg-current/10" : "border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground"}`}
                  style={isActive ? { color: LEVEL_COLORS[level] } : undefined}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS[level] }} />
                  <span className="font-mono">{level}</span>
                  <span className="hidden sm:inline">{LEVEL_NAMES[level]}</span>
                </button>
              );
            })}
            {selectedLevels.length > 0 && (
              <button onClick={clearLevels} className="px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground">Все</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
