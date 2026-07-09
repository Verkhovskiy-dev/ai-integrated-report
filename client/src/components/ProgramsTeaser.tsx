/*
 * Compact SKOLKOVO programs teaser — placed right after Strategic Insights.
 * 3 insight-linked programs + link to full catalog at /programs.
 * Umami events: program-click / programs-all-click.
 */
import { GraduationCap, ArrowRight, ExternalLink } from "lucide-react";
import { getSkolkovoPrograms } from "@/data/insightsDataLocalized";
import { useTranslation } from "@/contexts/I18nContext";
import AiProSpotlight from "@/components/AiProSpotlight";

const TEASER_KEYS = ["aiShift", "intensiveAI", "intensiveAgents"] as const;

const TEASER_META: Record<string, { tagline_ru: string; tagline_en: string; relevance_ru: string; relevance_en: string; accent: string }> = {
  aiShift: {
    tagline_ru: "Стратегия ИИ-трансформации для руководителей",
    tagline_en: "AI Transformation Strategy for Executives",
    relevance_ru: "Связана с инсайтами 1, 3, 5, 7 сегодняшнего отчёта",
    relevance_en: "Linked to insights 1, 3, 5, 7 of today's report",
    accent: "#22d3ee",
  },
  intensiveAI: {
    tagline_ru: "Генеративные алгоритмы: от теории к практике",
    tagline_en: "Generative Algorithms: From Theory to Practice",
    relevance_ru: "Связана с инсайтом 2 «Агентная революция»",
    relevance_en: "Linked to insight 2 \"Agentic Revolution\"",
    accent: "#10b981",
  },
  intensiveAgents: {
    tagline_ru: "Создание ИИ-продуктов и агентных систем",
    tagline_en: "Building AI Products and Agentic Systems",
    relevance_ru: "Связана с сигналом «Agent Ops как новый рынок»",
    relevance_en: "Linked to signal \"Agent Ops as a New Market\"",
    accent: "#a78bfa",
  },
};

export default function ProgramsTeaser() {
  const { locale } = useTranslation();
  const isEn = locale === "en";
  const programs = getSkolkovoPrograms(locale);

  return (
    <div className="container">
      <div className="bg-card/40 border border-border/50 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-1.5">
              {isEn ? "From Insights to Skills" : "От инсайтов — к навыкам"}
            </p>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground">
              {isEn ? "SKOLKOVO Programs on Today's Topics" : "Программы СКОЛКОВО по темам этого отчёта"}
            </h3>
          </div>
          <a
            href="/programs"
            data-umami-event="programs-all-click"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/30 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors no-underline"
          >
            {isEn ? "All programs" : "Все программы"}
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEASER_KEYS.map((key) => {
            const program = programs[key];
            const meta = TEASER_META[key];
            if (!program || !meta) return null;
            return (
              <a
                key={key}
                href={program.url}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="program-click"
                data-umami-event-program={key}
                className="group bg-background/60 border border-border/40 rounded-xl p-3.5 hover:border-primary/40 transition-all no-underline block"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center border shrink-0"
                    style={{ backgroundColor: `${meta.accent}12`, borderColor: `${meta.accent}30` }}
                  >
                    <GraduationCap className="w-3.5 h-3.5" style={{ color: meta.accent }} />
                  </div>
                  <h4 className="text-sm font-heading font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {program.shortName || program.name}
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                  {isEn ? meta.tagline_en : meta.tagline_ru}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/60 leading-relaxed mb-2">
                  {isEn ? meta.relevance_en : meta.relevance_ru}
                </p>
                <div className="flex items-center gap-1.5 text-primary/70 group-hover:text-primary transition-colors">
                  <span className="text-[11px] font-medium">{isEn ? "Learn more" : "Подробнее"}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-3">
          <AiProSpotlight source="teaser" />
        </div>
      </div>
    </div>
  );
}
