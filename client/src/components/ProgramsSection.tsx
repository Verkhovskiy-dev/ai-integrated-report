/*
 * DESIGN: Intelligence Dashboard — Programs Section
 * Dedicated section showcasing SKOLKOVO educational programs
 * Positioned as a natural extension of the strategic analysis
 * Mobile-first responsive design, i18n support
 */
import { ExternalLink, GraduationCap, Calendar, ArrowRight } from "lucide-react";
import { SKOLKOVO_PROGRAMS } from "@/data/insightsData";
import { useTranslation } from "@/contexts/I18nContext";

interface ProgramCardData {
  key: string;
  tagline_ru: string;
  tagline_en: string;
  description_ru: string;
  description_en: string;
  startDate_ru: string;
  startDate_en: string;
  status: "active" | "closed";
  accentColor: string;
  relevance_ru: string;
  relevance_en: string;
}

const PROGRAM_CARDS: ProgramCardData[] = [
  {
    key: "aiShift",
    tagline_ru: "Стратегия ИИ-трансформации для руководителей",
    tagline_en: "AI Transformation Strategy for Executives",
    description_ru: "Комплексная программа для лидеров, выстраивающих стратегию перехода организации в ИИ. Охватывает все уровни СРТ — от инфраструктуры до институциональных изменений.",
    description_en: "Comprehensive program for leaders building organizational AI transition strategy. Covers all DLS levels — from infrastructure to institutional changes.",
    startDate_ru: "26 марта 2026",
    startDate_en: "March 26, 2026",
    status: "active",
    accentColor: "#22d3ee",
    relevance_ru: "Инсайты 1, 3, 5, 7 · Сдвиги «Финансиализация Compute», «Регулирование»",
    relevance_en: "Insights 1, 3, 5, 7 · Shifts \"Compute Financialization\", \"Regulation\"",
  },
  {
    key: "intensiveAI",
    tagline_ru: "Генеративные алгоритмы: от теории к практике",
    tagline_en: "Generative Algorithms: From Theory to Practice",
    description_ru: "Интенсивный формат погружения в генеративный ИИ. Практическая работа с моделями, промпт-инжиниринг, fine-tuning и развёртывание в продуктивной среде.",
    description_en: "Intensive immersion in generative AI. Hands-on work with models, prompt engineering, fine-tuning, and deployment in production environments.",
    startDate_ru: "13 апреля 2026 (поток 18)",
    startDate_en: "April 13, 2026 (cohort 18)",
    status: "active",
    accentColor: "#10b981",
    relevance_ru: "Инсайт 2 «Агентная революция» · Инсайт 7 «Образование — узкое место»",
    relevance_en: "Insight 2 \"Agentic Revolution\" · Insight 7 \"Education as Bottleneck\"",
  },
  {
    key: "intensiveAgents",
    tagline_ru: "Создание ИИ-продуктов и агентных систем",
    tagline_en: "Building AI Products and Agentic Systems",
    description_ru: "Полный цикл разработки ИИ-продуктов: от идеи до развёртывания. Создание ИИ-ассистентов и агентов с boundary-control, мониторингом и governance.",
    description_en: "Full AI product development cycle: from idea to deployment. Building AI assistants and agents with boundary-control, monitoring, and governance.",
    startDate_ru: "16 марта 2026",
    startDate_en: "March 16, 2026",
    status: "active",
    accentColor: "#f59e0b",
    relevance_ru: "Инсайт 2 «Агентная революция» · Сигнал «Agent Ops как новый рынок»",
    relevance_en: "Insight 2 \"Agentic Revolution\" · Signal \"Agent Ops as New Market\"",
  },
  {
    key: "ubnd",
    tagline_ru: "ИИ и данные как основа управленческих решений",
    tagline_en: "AI and Data as the Foundation for Management Decisions",
    description_ru: "Программа для руководителей, выстраивающих управление на основе данных и ИИ. Data governance, аналитическая инфраструктура, метрики и KPI.",
    description_en: "Program for executives building data and AI-driven management. Data governance, analytical infrastructure, metrics, and KPIs.",
    startDate_ru: "10 апреля 2026",
    startDate_en: "April 10, 2026",
    status: "active",
    accentColor: "#8b5cf6",
    relevance_ru: "Инсайт 1 «Великое перемещение стоимости» · Инсайт 4 «Память агента»",
    relevance_en: "Insight 1 \"Great Value Migration\" · Insight 4 \"Agent Memory\"",
  },
  {
    key: "aiMarketing",
    tagline_ru: "ИИ-инструменты для маркетинговых команд",
    tagline_en: "AI Tools for Marketing Teams",
    description_ru: "Практическое применение генеративного ИИ в маркетинге: контент, персонализация, аналитика, автоматизация воронок и работа с данными клиентов.",
    description_en: "Practical application of generative AI in marketing: content, personalization, analytics, funnel automation, and customer data management.",
    startDate_ru: "4 апреля 2026",
    startDate_en: "April 4, 2026",
    status: "active",
    accentColor: "#ec4899",
    relevance_ru: "Инсайт 5 «Теневая экономика AI» · Сигнал «Потребительские бойкоты»",
    relevance_en: "Insight 5 \"Shadow AI Economy\" · Signal \"Consumer Boycotts\"",
  },
  {
    key: "dataDriven",
    tagline_ru: "Пошаговый алгоритм data-driven трансформации",
    tagline_en: "Step-by-Step Data-Driven Transformation Algorithm",
    description_ru: "Практикум по построению data-driven системы управления. Переход от интуитивного к доказательному менеджменту через данные.",
    description_en: "Workshop on building a data-driven management system. Transition from intuitive to evidence-based management through data.",
    startDate_ru: "Следующий поток — уточняется",
    startDate_en: "Next cohort — TBD",
    status: "closed",
    accentColor: "#f97316",
    relevance_ru: "Инсайт 4 «Память агента» · Инсайт 6 «Вертикальная интеграция 2.0»",
    relevance_en: "Insight 4 \"Agent Memory\" · Insight 6 \"Vertical Integration 2.0\"",
  },
];

export default function ProgramsSection() {
  const { locale } = useTranslation();
  const isEn = locale === "en";

  return (
    <div className="container">
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          {isEn ? "Educational Programs" : "Образовательные программы"}
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          {isEn ? "SKOLKOVO Digital Transformation Programs" : "Программы СКОЛКОВО по цифровой трансформации"}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {isEn
            ? "A portfolio of programs covering the full spectrum of competencies — from strategic vision to practical AI product development skills. Each program is linked to key insights and structural shifts identified in the analysis."
            : "Портфель программ, закрывающий полный спектр компетенций — от стратегического видения до практических навыков создания ИИ-продуктов. Каждая программа связана с ключевыми инсайтами и структурными сдвигами, выявленными в аналитике."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {PROGRAM_CARDS.map((card) => {
          const program = SKOLKOVO_PROGRAMS[card.key];
          if (!program) return null;

          return (
            <a
              key={card.key}
              href={program.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all duration-300 no-underline block"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border"
                  style={{
                    backgroundColor: `${card.accentColor}12`,
                    borderColor: `${card.accentColor}25`,
                  }}
                >
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: card.accentColor }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {card.status === "active" ? (
                    <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border border-green-400/25 bg-green-400/8 text-green-400">
                      {isEn ? "Registration Open" : "Регистрация открыта"}
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border border-muted-foreground/25 bg-muted-foreground/8 text-muted-foreground">
                      {isEn ? "TBD" : "Уточняется"}
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h4 className="text-sm sm:text-base font-heading font-bold text-foreground mb-1 leading-snug group-hover:text-primary transition-colors">
                {program.shortName || program.name}
              </h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 leading-relaxed" style={{ color: `${card.accentColor}cc` }}>
                {isEn ? card.tagline_en : card.tagline_ru}
              </p>

              {/* Description */}
              <p className="text-[11px] sm:text-xs text-foreground/60 leading-relaxed mb-3">
                {isEn ? card.description_en : card.description_ru}
              </p>

              {/* Start date */}
              <div className="flex items-center gap-1.5 mb-3">
                <Calendar className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  {isEn ? card.startDate_en : card.startDate_ru}
                </span>
              </div>

              {/* Relevance to insights */}
              <div className="border-t border-border/30 pt-2.5 mt-auto">
                <p className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/60 leading-relaxed">
                  {isEn ? card.relevance_en : card.relevance_ru}
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1.5 mt-3 text-primary/70 group-hover:text-primary transition-colors">
                <span className="text-[10px] sm:text-xs font-medium">
                  {isEn ? "Learn more about the program" : "Подробнее о программе"}
                </span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
