/*
 * AI PRO spotlight — flagship program banner for CAIO/C-level.
 * Used in: executive mode (main), after structural shifts, programs teaser.
 * Umami: program-click / aiPro / source.
 */
import { Award, ArrowRight } from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";

const AIPRO_URL =
  "https://www.skolkovo.ru/programmes/tehnologii-osnova-ii-transformacii-biznesa/?utm_source=messengers&utm_medium=telegram&utm_content=expert_dashboardNV";

const NOTES: Record<string, { ru: string; en: string }> = {
  executive: {
    ru: "Этот отчёт — ежедневная работа CAIO. AI PRO учит выстраивать систему ИИ-трансформации в своей компании: все 9 уровней, от технологий до капитала.",
    en: "This report is a CAIO's daily work. AI PRO teaches building an AI transformation system in your company: all 9 levels, from technology to capital.",
  },
  shifts: {
    ru: "Как управлять этими сдвигами в своей организации — стратегическая программа для CAIO и C-level.",
    en: "How to manage these shifts in your organization — a strategic program for CAIO and C-level.",
  },
  teaser: {
    ru: "Комплексная программа управления ИИ-трансформацией: технологии, данные, институты, капитал.",
    en: "Comprehensive AI transformation management program: technology, data, institutions, capital.",
  },
};

export default function AiProSpotlight({ source }: { source: "executive" | "shifts" | "teaser" }) {
  const { locale } = useTranslation();
  const isEn = locale === "en";
  const note = NOTES[source] || NOTES.teaser;

  return (
    <a
      href={AIPRO_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-umami-event="program-click"
      data-umami-event-program="aiPro"
      data-umami-event-source={source}
      className="group block rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-4 hover:border-amber-400/60 transition-colors no-underline"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-heading font-bold text-foreground">AI PRO</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300">
              {isEn ? "Flagship · for CAIO & C-level" : "Флагманская программа · для CAIO и C-level"}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              {isEn ? "Start — Oct 14, 2026" : "Старт — 14 октября 2026"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {isEn ? note.en : note.ru}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-medium shrink-0 group-hover:gap-2.5 transition-all">
          {isEn ? "Learn more" : "Подробнее"}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </a>
  );
}
