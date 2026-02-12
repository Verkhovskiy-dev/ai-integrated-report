/*
 * DESIGN: Intelligence Dashboard — Nodal Positions Map
 * 5 key positions in AI economy 2026 with visual cards
 * Mobile-first responsive design
 */
import { NODAL_POSITIONS, EDUCATION_RECOMMENDATIONS } from "@/data/insightsData";
import { Target, BookOpen, ArrowRight } from "lucide-react";

export default function NodalPositions() {
  return (
    <div className="container">
      {/* Nodal Positions */}
      <div className="mb-10 sm:mb-14">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
            Сводная карта
          </p>
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
            5 узловых позиций AI-экономики 2026
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Ключевые узлы, за контроль которых идёт основная борьба в AI-индустрии.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {NODAL_POSITIONS.map((pos) => (
            <div
              key={pos.id}
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-5 hover:border-primary/20 transition-all duration-300 group"
            >
              {/* Position number */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center border"
                  style={{
                    backgroundColor: `${pos.trendColor}15`,
                    borderColor: `${pos.trendColor}30`,
                  }}
                >
                  <span className="text-xs font-mono font-bold" style={{ color: pos.trendColor }}>
                    {pos.id}
                  </span>
                </div>
                <Target className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {/* Name */}
              <h4 className="text-sm font-heading font-bold text-foreground mb-2 leading-snug">
                {pos.name}
              </h4>

              {/* Controllers */}
              <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                <span className="text-foreground/60 font-medium">Кто контролирует:</span>{" "}
                {pos.controllers}
              </p>

              {/* Stakes */}
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                <span className="text-foreground/60 font-medium">Что на кону:</span>{" "}
                {pos.stakes}
              </p>

              {/* Trend */}
              <div
                className="text-[10px] font-mono px-2 py-1 rounded border inline-block"
                style={{
                  color: pos.trendColor,
                  borderColor: `${pos.trendColor}30`,
                  backgroundColor: `${pos.trendColor}08`,
                }}
              >
                {pos.trend}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education Recommendations */}
      <div className="bg-card/40 backdrop-blur-sm border border-primary/20 rounded-xl p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-foreground">
              Рекомендации для образовательных программ
            </h3>
            <p className="text-xs text-muted-foreground">
              На основании выявленных инсайтов
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {EDUCATION_RECOMMENDATIONS.map((rec, i) => (
            <div key={i}>
              <h4 className="text-sm font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-[10px] font-mono text-primary shrink-0">
                  {i + 1}
                </span>
                {rec.category}
              </h4>
              <ul className="space-y-2">
                {rec.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-primary/50 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
