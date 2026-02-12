/*
 * DESIGN: Intelligence Dashboard — Strategic Insights
 * Expandable insight cards with evidence, conclusions, and education implications
 * Mobile-first responsive design
 */
import { useState } from "react";
import {
  Building, Bot, Landmark, Brain, ShieldAlert, Layers, GraduationCap,
  ChevronDown, ChevronUp, Lightbulb, BookOpen, AlertTriangle
} from "lucide-react";
import { STRATEGIC_INSIGHTS, type StrategicInsight } from "@/data/insightsData";

const ICON_MAP: Record<string, typeof Building> = {
  Building, Bot, Landmark, Brain, ShieldAlert, Layers, GraduationCap,
};

function InsightCard({ insight, isExpanded, onToggle }: {
  insight: StrategicInsight;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = ICON_MAP[insight.icon] || Lightbulb;

  return (
    <div
      className={`
        bg-card/60 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-400
        ${isExpanded ? "border-primary/40 glow-cyan" : "border-border/50 hover:border-border"}
      `}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-3 sm:gap-4"
      >
        {/* Icon */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: `${insight.accentColor}15`,
            borderColor: `${insight.accentColor}30`,
          }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: insight.accentColor }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Number badge */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                color: insight.accentColor,
                borderColor: `${insight.accentColor}40`,
                backgroundColor: `${insight.accentColor}10`,
              }}
            >
              Инсайт {insight.id}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm sm:text-base font-heading font-bold text-foreground leading-snug mb-1">
            {insight.title}
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
            {insight.subtitle}
          </p>
        </div>

        {/* Expand icon */}
        <div className="shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Summary — always visible */}
      <div className="px-4 sm:px-5 pb-3 sm:pb-4">
        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
          {insight.summary}
        </p>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/30">
          {/* Evidence */}
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: insight.accentColor }} />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Доказательная база
              </span>
            </div>
            <ul className="space-y-1.5">
              {insight.evidence.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary/50 mt-1 shrink-0 text-[8px]">●</span>
                  <span className="text-xs sm:text-sm text-foreground/70 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Non-obvious conclusion */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 bg-amber-400/5 border-t border-amber-400/10">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono text-amber-400/80 uppercase tracking-wider">
                Неочевидный вывод
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              {insight.nonObviousConclusion}
            </p>
          </div>

          {/* Education implication */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 bg-primary/5 border-t border-primary/10">
            <div className="flex items-center gap-2 mb-2.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-primary/80 uppercase tracking-wider">
                Для образовательных программ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              {insight.educationImplication}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StrategicInsights() {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  return (
    <div className="container">
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          Стратегические инсайты
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          7 ключевых выводов периода
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Структурные инсайты, выходящие за рамки отдельных новостей и отражающие глубинные сдвиги
          в том, кто контролирует ключевые узлы создания ценности в AI-экономике.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {STRATEGIC_INSIGHTS.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            isExpanded={expandedId === insight.id}
            onToggle={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
          />
        ))}
      </div>
    </div>
  );
}
