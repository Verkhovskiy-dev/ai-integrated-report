/*
 * DESIGN: Intelligence Dashboard — Theme Frequency
 * Horizontal bar chart of key themes
 */
import { THEME_FREQUENCY } from "@/data/reportData";

export default function ThemeFrequency() {
  const maxCount = Math.max(...THEME_FREQUENCY.map((t) => t.count));

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg p-6">
      <div className="mb-6">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-1">
          Частотный анализ
        </p>
        <h3 className="text-lg font-heading font-bold text-foreground">
          Ключевые темы периода
        </h3>
      </div>

      <div className="space-y-3">
        {THEME_FREQUENCY.map((item, i) => {
          const barWidth = (item.count / maxCount) * 100;
          return (
            <div key={item.theme} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground/80 font-medium">
                  {item.theme}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {item.count} отчётов
                </span>
              </div>
              <div className="h-4 bg-muted/30 rounded-sm overflow-hidden relative">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out relative"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: `${item.color}30`,
                    borderRight: `2px solid ${item.color}`,
                  }}
                >
                  {/* Subtle inner glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${item.color}20)`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
