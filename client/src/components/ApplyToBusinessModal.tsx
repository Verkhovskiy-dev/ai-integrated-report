/*
 * ApplyToBusinessModal: "Применить к моему бизнесу" interactive feature.
 * Industry selector with personalized impacts, opportunities, risks, and actions.
 * Opens as a modal/drawer overlay.
 */
import { useState, useEffect, useCallback } from "react";
import {
  X, Building2, TrendingUp, AlertTriangle, Lightbulb, ArrowRight,
  ChevronRight, Factory, ShoppingCart, Heart, Wifi, Zap,
  GraduationCap, Landmark, Truck, Film, Briefcase,
} from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";
import { useExecutiveData, type IndustryPersonalization } from "@/contexts/ExecutiveDataContext";

/* ── Industry icons ──────────────────────────────────────── */
const INDUSTRY_ICONS: Record<string, typeof Building2> = {
  "Финансы и банки": Building2,
  "Finance & Banking": Building2,
  "Производство": Factory,
  "Manufacturing": Factory,
  "Ритейл и e-commerce": ShoppingCart,
  "Retail & E-commerce": ShoppingCart,
  "Здравоохранение": Heart,
  "Healthcare": Heart,
  "Телеком и IT": Wifi,
  "Telecom & IT": Wifi,
  "Энергетика": Zap,
  "Energy": Zap,
  "Образование": GraduationCap,
  "Education": GraduationCap,
  "Государственный сектор": Landmark,
  "Government & Public Sector": Landmark,
  "Логистика и транспорт": Truck,
  "Logistics & Transport": Truck,
  "Медиа и развлечения": Film,
  "Media & Entertainment": Film,
};

function getIcon(industry: string) {
  return INDUSTRY_ICONS[industry] || Building2;
}

/* ── Floating button ─────────────────────────────────────── */
export function ApplyToBusinessButton({ onClick }: { onClick: () => void }) {
  const { locale } = useTranslation();
  const isEn = locale === "en";

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-xl
        bg-gradient-to-r from-primary/90 to-cyan-500/90 text-white shadow-lg shadow-primary/25
        hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300
        border border-white/10 backdrop-blur-sm group"
    >
      <Briefcase className="w-4 h-4 group-hover:rotate-12 transition-transform" />
      <span className="text-xs sm:text-sm font-medium">
        {isEn ? "Apply to My Business" : "Применить к моему бизнесу"}
      </span>
      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

/* ── Modal ───────────────────────────────────────────────── */
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplyToBusinessModal({ isOpen, onClose }: Props) {
  const { locale } = useTranslation();
  const { data, loading } = useExecutiveData();
  const isEn = locale === "en";
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const industries = data?.industry_personalizations || [];
  const selected = industries.find((i) => i.industry === selectedIndustry);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-background border border-border/50 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-foreground">
                {isEn ? "Apply to My Business" : "Применить к моему бизнесу"}
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {isEn
                  ? "Select your industry for personalized insights"
                  : "Выберите отрасль для персонализированных выводов"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">
                {isEn ? "Loading..." : "Загрузка..."}
              </span>
            </div>
          ) : !selected ? (
            /* Industry selector grid */
            <div>
              <p className="text-xs text-muted-foreground mb-4">
                {isEn
                  ? "Choose your industry to see how this week's AI developments affect your business:"
                  : "Выберите вашу отрасль, чтобы увидеть, как события недели в AI влияют на ваш бизнес:"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {industries.map((ind) => {
                  const Icon = getIcon(ind.industry);
                  return (
                    <button
                      key={ind.industry}
                      onClick={() => setSelectedIndustry(ind.industry)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border/40
                        hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                    >
                      <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[11px] sm:text-xs text-center text-foreground/80 group-hover:text-foreground font-medium leading-tight">
                        {ind.industry}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Selected industry details */
            <div className="space-y-4">
              {/* Back button + industry name */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setSelectedIndustry(null)}
                  className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  {isEn ? "Back" : "Назад"}
                </button>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getIcon(selected.industry);
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                  <h3 className="text-base sm:text-lg font-heading font-bold text-foreground">
                    {selected.industry}
                  </h3>
                </div>
              </div>

              {/* Key Impacts */}
              <div className="bg-card/50 border border-border/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground">
                    {isEn ? "Key Impacts" : "Ключевые последствия"}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {selected.key_impacts.map((impact, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1 shrink-0 text-[8px]">●</span>
                      <span className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">{impact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground">
                    {isEn ? "Opportunities" : "Возможности"}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {selected.opportunities.map((opp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1 shrink-0 text-[8px]">●</span>
                      <span className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground">
                    {isEn ? "Risks" : "Риски"}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {selected.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-1 shrink-0 text-[8px]">●</span>
                      <span className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Immediate Actions */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <h4 className="text-xs sm:text-sm font-heading font-semibold text-foreground">
                    {isEn ? "Immediate Actions" : "Немедленные действия"}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {selected.immediate_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0 font-mono text-[10px] font-bold">{i + 1}.</span>
                      <span className="text-[11px] sm:text-xs text-foreground/90 leading-relaxed font-medium">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
