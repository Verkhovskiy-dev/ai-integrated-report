/*
 * DESIGN: Intelligence Dashboard — Top Companies
 * Horizontal bar chart of company mentions
 */
import { TOP_COMPANIES } from "@/data/reportData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function getTrendIcon(trend: string) {
  if (trend === "up") return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

const CATEGORY_COLORS: Record<string, string> = {
  Hardware: "#f59e0b",
  Models: "#22d3ee",
  Platform: "#8b5cf6",
  Cloud: "#06b6d4",
  Devices: "#ec4899",
  Memory: "#f97316",
  Security: "#ef4444",
};

export default function TopCompanies() {
  const maxMentions = Math.max(...TOP_COMPANIES.map((c) => c.mentions));

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg p-6">
      <div className="mb-6">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-1">
          Ключевые игроки
        </p>
        <h3 className="text-lg font-heading font-bold text-foreground">
          Топ компаний по упоминаниям
        </h3>
      </div>

      <div className="space-y-2.5">
        {TOP_COMPANIES.map((company, i) => {
          const barWidth = (company.mentions / maxMentions) * 100;
          const catColor = CATEGORY_COLORS[company.category] || "#666";

          return (
            <div key={company.name} className="group">
              <div className="flex items-center gap-3">
                {/* Rank */}
                <span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">
                  {i + 1}
                </span>

                {/* Company name */}
                <span className="text-xs font-medium text-foreground w-28 shrink-0 truncate">
                  {company.name}
                </span>

                {/* Bar */}
                <div className="flex-1 h-5 bg-muted/30 rounded-sm overflow-hidden relative">
                  <div
                    className="h-full rounded-sm transition-all duration-700 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: `${catColor}40`,
                      borderRight: `2px solid ${catColor}`,
                    }}
                  />
                </div>

                {/* Count */}
                <span className="text-xs font-mono text-foreground w-6 text-right shrink-0">
                  {company.mentions}
                </span>

                {/* Trend */}
                <div className="shrink-0">{getTrendIcon(company.trend)}</div>

                {/* Category badge */}
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 hidden sm:inline"
                  style={{ color: catColor, backgroundColor: `${catColor}15` }}
                >
                  {company.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
