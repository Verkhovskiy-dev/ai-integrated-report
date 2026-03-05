/*
 * PracticalTakeaways: "Практические выводы недели" section.
 * Shows 3-5 actionable recommendations in format:
 * Situation → Risk/Opportunity → Action
 * Visible in both modes, but especially prominent in Executive mode.
 */
import { useState } from "react";
import {
  Target, AlertTriangle, TrendingUp, Zap, ChevronDown, ChevronUp,
  ArrowRight, Shield, Lightbulb,
} from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useExecutiveData, type WeeklyTakeaway } from "@/contexts/ExecutiveDataContext";

const PRIORITY_STYLES: Record<string, { bg: string; border: string; text: string; label: string; labelEn: string }> = {
  high: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    label: "Высокий",
    labelEn: "High",
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    label: "Средний",
    labelEn: "Medium",
  },
  low: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    label: "Низкий",
    labelEn: "Low",
  },
};

const TYPE_ICONS: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  risk: { icon: AlertTriangle, color: "#ef4444" },
  opportunity: { icon: TrendingUp, color: "#10b981" },
  both: { icon: Shield, color: "#f59e0b" },
};

function TakeawayCard({
  takeaway,
  index,
  isEn,
  isExpanded,
  onToggle,
}: {
  takeaway: WeeklyTakeaway;
  index: number;
  isEn: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const priority = PRIORITY_STYLES[takeaway.priority] || PRIORITY_STYLES.medium;
  const typeInfo = TYPE_ICONS[takeaway.risk_or_opportunity] || TYPE_ICONS.both;
  const TypeIcon = typeInfo.icon;

  return (
    <div
      className={`bg-card/50 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 ${
        isExpanded ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border/40 hover:border-primary/20"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-3"
      >
        {/* Number badge */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <span className="text-sm font-mono font-bold text-primary">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Priority + Type badges */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono ${priority.bg} ${priority.border} ${priority.text} border`}>
              <Zap className="w-2.5 h-2.5" />
              {isEn ? priority.labelEn : priority.label}
            </span>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border"
              style={{
                color: typeInfo.color,
                backgroundColor: `${typeInfo.color}15`,
                borderColor: `${typeInfo.color}30`,
              }}
            >
              <TypeIcon className="w-2.5 h-2.5" />
              {takeaway.risk_or_opportunity === "risk"
                ? (isEn ? "Risk" : "Риск")
                : takeaway.risk_or_opportunity === "opportunity"
                ? (isEn ? "Opportunity" : "Возможность")
                : (isEn ? "Risk & Opportunity" : "Риск и возможность")}
            </span>
          </div>

          {/* Situation */}
          <p className={`text-xs sm:text-sm text-foreground leading-snug ${isExpanded ? "" : "line-clamp-2"}`}>
            {takeaway.situation}
          </p>
        </div>

        <div className="shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/30">
          {/* Risk/Opportunity description */}
          <div className="px-4 sm:px-5 py-3 sm:py-4" style={{ backgroundColor: `${typeInfo.color}08` }}>
            <div className="flex items-center gap-2 mb-2">
              <TypeIcon className="w-3.5 h-3.5" style={{ color: typeInfo.color }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: typeInfo.color }}>
                {takeaway.risk_or_opportunity === "risk"
                  ? (isEn ? "Risk Assessment" : "Оценка риска")
                  : takeaway.risk_or_opportunity === "opportunity"
                  ? (isEn ? "Opportunity" : "Возможность")
                  : (isEn ? "Risk & Opportunity" : "Риск и возможность")}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">
              {takeaway.risk_opportunity_text}
            </p>
          </div>

          {/* Action */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 bg-primary/5 border-t border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">
                {isEn ? "Recommended Action" : "Рекомендуемое действие"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-foreground/90 leading-relaxed font-medium">
              {takeaway.action}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticalTakeaways() {
  const { locale } = useTranslation();
  const { isExecutive } = useViewMode();
  const { data, loading } = useExecutiveData();
  const isEn = locale === "en";
  const [expandedId, setExpandedId] = useState<number | null>(0);

  // Only show when we have data (executive mode must have been activated at least once)
  const takeaways = data?.weekly_takeaways || [];
  if (takeaways.length === 0 && !loading) return null;

  return (
    <section id="takeaways" className="py-6 sm:py-10">
      <div className="container">
        {/* Section header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">
              {isEn ? "Practical Takeaways" : "Практические выводы"}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              <Target className="w-2.5 h-2.5" />
              {isEn ? "actionable" : "к действию"}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
            {isEn
              ? `${takeaways.length} Practical Takeaways of the Week`
              : `${takeaways.length} практических выводов недели`}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {isEn
              ? "Concrete recommendations based on this week's AI landscape analysis. Each takeaway includes a situation assessment, risk/opportunity evaluation, and a specific action to take."
              : "Конкретные рекомендации на основе анализа AI-ландшафта этой недели. Каждый вывод включает оценку ситуации, риска/возможности и конкретное действие."}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
            <span className="ml-3 text-xs text-muted-foreground font-mono">
              {isEn ? "Loading insights..." : "Загрузка выводов..."}
            </span>
          </div>
        )}

        {/* Takeaway cards */}
        {!loading && (
          <div className="space-y-3 sm:space-y-4">
            {takeaways.map((takeaway, idx) => (
              <TakeawayCard
                key={idx}
                takeaway={takeaway}
                index={idx}
                isEn={isEn}
                isExpanded={expandedId === idx}
                onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
