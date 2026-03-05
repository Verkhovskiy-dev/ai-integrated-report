/*
 * ExecutiveEventCard: Simplified event explanation for executive mode.
 * Shows: what happened, why it matters, business impact.
 * Replaces the technical event description when viewMode === "executive".
 */
import { Briefcase, TrendingUp, AlertTriangle } from "lucide-react";
import type { ExecutiveEvent } from "@/contexts/ExecutiveDataContext";

interface Props {
  explanation: ExecutiveEvent;
  accentColor?: string;
}

export default function ExecutiveEventCard({ explanation, accentColor = "#22d3ee" }: Props) {
  return (
    <div className="mt-2 space-y-2 border-t border-border/20 pt-2">
      {/* What happened */}
      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Briefcase className="w-3 h-3" style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">
            Что произошло
          </p>
          <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">
            {explanation.what_happened}
          </p>
        </div>
      </div>

      {/* Why important */}
      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: "#f59e0b15" }}
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
        </div>
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">
            Почему важно
          </p>
          <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">
            {explanation.why_important}
          </p>
        </div>
      </div>

      {/* Business impact */}
      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: "#10b98115" }}
        >
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        </div>
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">
            Влияние на бизнес
          </p>
          <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">
            {explanation.business_impact}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Localized version that switches labels based on locale */
export function ExecutiveEventCardLocalized({
  explanation,
  accentColor = "#22d3ee",
  isEn = false,
}: Props & { isEn?: boolean }) {
  return (
    <div className="mt-2 space-y-2 border-t border-border/20 pt-2">
      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Briefcase className="w-3 h-3" style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">
            {isEn ? "What happened" : "Что произошло"}
          </p>
          <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">
            {explanation.what_happened}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: "#f59e0b15" }}
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
        </div>
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">
            {isEn ? "Why it matters" : "Почему важно"}
          </p>
          <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">
            {explanation.why_important}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: "#10b98115" }}
        >
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        </div>
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">
            {isEn ? "Business impact" : "Влияние на бизнес"}
          </p>
          <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">
            {explanation.business_impact}
          </p>
        </div>
      </div>
    </div>
  );
}
