/*
 * DESIGN: Intelligence Dashboard — Programs Section
 * Dedicated section showcasing SKOLKOVO educational programs
 * Positioned as a natural extension of the strategic analysis
 * Mobile-first responsive design
 */
import { ExternalLink, GraduationCap, Calendar, ArrowRight } from "lucide-react";
import { SKOLKOVO_PROGRAMS } from "@/data/insightsData";

interface ProgramCardData {
  key: string;
  tagline: string;
  description: string;
  startDate: string;
  status: "active" | "closed";
  accentColor: string;
  relevance: string;
}

const PROGRAM_CARDS: ProgramCardData[] = [
  {
    key: "aiShift",
    tagline: "Стратегия ИИ-трансформации для руководителей",
    description: "Комплексная программа для лидеров, выстраивающих стратегию перехода организации в ИИ. Охватывает все уровни СРТ — от инфраструктуры до институциональных изменений.",
    startDate: "26 марта 2026",
    status: "active",
    accentColor: "#22d3ee",
    relevance: "Инсайты 1, 3, 5, 7 · Сдвиги «Финансиализация Compute», «Регулирование»",
  },
  {
    key: "intensiveAI",
    tagline: "Генеративные алгоритмы: от теории к практике",
    description: "Интенсивный формат погружения в генеративный ИИ. Практическая работа с моделями, промпт-инжиниринг, fine-tuning и развёртывание в продуктивной среде.",
    startDate: "13 апреля 2026 (поток 18)",
    status: "active",
    accentColor: "#10b981",
    relevance: "Инсайт 2 «Агентная революция» · Инсайт 7 «Образование — узкое место»",
  },
  {
    key: "intensiveAgents",
    tagline: "Создание ИИ-продуктов и агентных систем",
    description: "Полный цикл разработки ИИ-продуктов: от идеи до развёртывания. Создание ИИ-ассистентов и агентов с boundary-control, мониторингом и governance.",
    startDate: "16 марта 2026",
    status: "active",
    accentColor: "#f59e0b",
    relevance: "Инсайт 2 «Агентная революция» · Сигнал «Agent Ops как новый рынок»",
  },
  {
    key: "ubnd",
    tagline: "ИИ и данные как основа управленческих решений",
    description: "Программа для руководителей, выстраивающих управление на основе данных и ИИ. Data governance, аналитическая инфраструктура, метрики и KPI.",
    startDate: "10 апреля 2026",
    status: "active",
    accentColor: "#8b5cf6",
    relevance: "Инсайт 1 «Великое перемещение стоимости» · Инсайт 4 «Память агента»",
  },
  {
    key: "aiMarketing",
    tagline: "ИИ-инструменты для маркетинговых команд",
    description: "Практическое применение генеративного ИИ в маркетинге: контент, персонализация, аналитика, автоматизация воронок и работа с данными клиентов.",
    startDate: "4 апреля 2026",
    status: "active",
    accentColor: "#ec4899",
    relevance: "Инсайт 5 «Теневая экономика AI» · Сигнал «Потребительские бойкоты»",
  },
  {
    key: "dataDriven",
    tagline: "Пошаговый алгоритм data-driven трансформации",
    description: "Практикум по построению data-driven системы управления. Переход от интуитивного к доказательному менеджменту через данные.",
    startDate: "Следующий поток — уточняется",
    status: "closed",
    accentColor: "#f97316",
    relevance: "Инсайт 4 «Память агента» · Инсайт 6 «Вертикальная интеграция 2.0»",
  },
];

export default function ProgramsSection() {
  return (
    <div className="container">
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
          Образовательные программы
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          Программы СКОЛКОВО по цифровой трансформации
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Портфель программ, закрывающий полный спектр компетенций — от стратегического видения
          до практических навыков создания ИИ-продуктов. Каждая программа связана с ключевыми
          инсайтами и структурными сдвигами, выявленными в аналитике.
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
                      Регистрация открыта
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border border-muted-foreground/25 bg-muted-foreground/8 text-muted-foreground">
                      Уточняется
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h4 className="text-sm sm:text-base font-heading font-bold text-foreground mb-1 leading-snug group-hover:text-primary transition-colors">
                {program.shortName || program.name}
              </h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 leading-relaxed" style={{ color: `${card.accentColor}cc` }}>
                {card.tagline}
              </p>

              {/* Description */}
              <p className="text-[11px] sm:text-xs text-foreground/60 leading-relaxed mb-3">
                {card.description}
              </p>

              {/* Start date */}
              <div className="flex items-center gap-1.5 mb-3">
                <Calendar className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  {card.startDate}
                </span>
              </div>

              {/* Relevance to insights */}
              <div className="border-t border-border/30 pt-2.5 mt-auto">
                <p className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/60 leading-relaxed">
                  {card.relevance}
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1.5 mt-3 text-primary/70 group-hover:text-primary transition-colors">
                <span className="text-[10px] sm:text-xs font-medium">Подробнее о программе</span>
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
