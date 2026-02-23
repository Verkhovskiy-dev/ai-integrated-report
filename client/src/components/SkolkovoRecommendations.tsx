import { BookOpen, ExternalLink, Star, TrendingUp, Zap, GraduationCap, Rocket, Award, Clock, Users } from "lucide-react";
import { useLiveData, type LiveReport } from "@/contexts/LiveDataContext";
import { useTranslation } from "@/contexts/I18nContext";
import { SKOLKOVO_PROGRAMS } from "@/data/insightsData";

interface ProgramWithLevel {
  key: string;
  name: string;
  shortName: string;
  url: string;
  description: string;
  format: string;
  score: number;
  reasons: string[];
}

const PROGRAM_CONFIG: Record<string, {
  keywords: string[];
  levels: number[];
  mastery: "beginner" | "advanced" | "professional";
  description_ru: string;
  description_en: string;
  format_ru: string;
  format_en: string;
}> = {
  intensiveAI: {
    keywords: ["генератив", "модел", "llm", "gpt", "prompt", "fine-tun", "инференс", "reasoning", "cot", "нейросет"],
    levels: [4, 5, 6, 7],
    mastery: "beginner",
    description_ru: "Знакомство с генеративными моделями: архитектуры, промптинг, практические инструменты ИИ",
    description_en: "Introduction to generative models: architectures, prompting, practical AI tools",
    format_ru: "2-3 дня · интенсив",
    format_en: "2-3 days · intensive",
  },
  intensiveAgents: {
    keywords: ["агент", "agent", "agentic", "mcp", "orchestrat", "tool", "продукт", "product", "boundary", "guardrail"],
    levels: [4, 5, 6],
    mastery: "beginner",
    description_ru: "Введение в AI-агенты и AI-продукты: принципы работы, архитектура, первые шаги",
    description_en: "Introduction to AI agents and AI products: principles, architecture, first steps",
    format_ru: "2-3 дня · интенсив",
    format_en: "2-3 days · intensive",
  },
  ubnd: {
    keywords: ["управлен", "бизнес", "решен", "kpi", "roi", "эффективн", "менеджмент", "капитал", "данн"],
    levels: [7, 8, 9],
    mastery: "beginner",
    description_ru: "ИИ и данные как основа управленческих решений: понимание принципов и ситуации",
    description_en: "AI and data as the foundation for management decisions: understanding principles and context",
    format_ru: "2-3 дня · интенсив",
    format_en: "2-3 days · intensive",
  },
  aiMarketing: {
    keywords: ["маркетинг", "marketing", "контент", "content", "персонализ", "клиент", "consumer", "бренд", "brand"],
    levels: [3, 5, 6],
    mastery: "beginner",
    description_ru: "Практическое применение генеративного ИИ в маркетинге: инструменты и принципы",
    description_en: "Practical application of generative AI in marketing: tools and principles",
    format_ru: "2-3 дня · интенсив",
    format_en: "2-3 days · intensive",
  },
  aiShift: {
    keywords: ["трансформац", "стратег", "бизнес-процесс", "внедрен", "цифров", "ai strategy", "digital", "переход"],
    levels: [5, 6, 7, 8, 9],
    mastery: "advanced",
    description_ru: "Системная трансформация бизнес-процессов с помощью ИИ: стратегия, внедрение, управление изменениями",
    description_en: "Systematic business process transformation with AI: strategy, implementation, change management",
    format_ru: "Длительная программа",
    format_en: "Long-term program",
  },
  dataDriven: {
    keywords: ["данн", "data", "аналитик", "metric", "governance", "pipeline", "etl", "warehouse", "data-driven"],
    levels: [4, 5, 6, 7],
    mastery: "advanced",
    description_ru: "Построение data-driven системы управления: от интуитивного к доказательному менеджменту через данные",
    description_en: "Building a data-driven management system: from intuitive to evidence-based management through data",
    format_ru: "Длительная программа",
    format_en: "Long-term program",
  },
};

function computeRelevance(reports: LiveReport[], isEn: boolean): Record<string, ProgramWithLevel> {
  const allText = reports
    .flatMap((r) => r.srt_levels.flatMap((sl) => sl.events.map((e) => `${e.title} ${e.description}`)))
    .join(" ")
    .toLowerCase();

  const levelActivity: Record<number, number> = {};
  for (const r of reports) {
    for (const sl of r.srt_levels) {
      levelActivity[sl.level] = (levelActivity[sl.level] || 0) + sl.event_count;
    }
  }

  const results: Record<string, ProgramWithLevel> = {};

  for (const [key, config] of Object.entries(PROGRAM_CONFIG)) {
    const program = SKOLKOVO_PROGRAMS[key];
    if (!program) continue;

    let score = 0;
    const reasons: string[] = [];

    let keywordHits = 0;
    for (const kw of config.keywords) {
      const regex = new RegExp(kw, "gi");
      const matches = allText.match(regex);
      if (matches) keywordHits += matches.length;
    }
    if (keywordHits > 0) {
      score += Math.min(40, keywordHits * 3);
      reasons.push(isEn ? `${keywordHits} mentions` : `${keywordHits} упоминаний`);
    }

    let levelScore = 0;
    for (const lvl of config.levels) {
      levelScore += levelActivity[lvl] || 0;
    }
    if (levelScore > 0) {
      score += Math.min(40, levelScore * 2);
      reasons.push(isEn ? `Activity at levels ${config.levels.join(", ")}` : `Активность уровней ${config.levels.join(", ")}`);
    }

    score += 20;

    results[key] = {
      key,
      name: program.name,
      shortName: program.shortName || key,
      url: program.url,
      description: isEn ? config.description_en : config.description_ru,
      format: isEn ? config.format_en : config.format_ru,
      score: Math.min(100, score),
      reasons,
    };
  }

  return results;
}

export default function SkolkovoRecommendations() {
  const { archiveReports, latestReport } = useLiveData();
  const { locale } = useTranslation();
  const isEn = locale === "en";

  const allReports = latestReport
    ? [...archiveReports.filter((r) => r.date !== latestReport.date), latestReport]
    : archiveReports;

  const programScores = computeRelevance(allReports, isEn);

  const MASTERY_LEVELS: {
    id: string;
    title: string;
    subtitle: string;
    icon: typeof GraduationCap;
    color: string;
    borderColor: string;
    bgColor: string;
    programKeys: string[];
    badge?: string;
  }[] = [
    {
      id: "beginner",
      title: isEn ? "Beginner Level" : "Начальный уровень",
      subtitle: isEn
        ? "Getting acquainted with AI, practical tools, and understanding principles and the current landscape"
        : "Ознакомление с ИИ, практические инструменты и понимание принципов и ситуации",
      icon: GraduationCap,
      color: "#22d3ee",
      borderColor: "border-cyan-500/30",
      bgColor: "bg-cyan-500/5",
      programKeys: ["intensiveAI", "intensiveAgents", "ubnd", "aiMarketing"],
      badge: isEn ? "2-3 days" : "2-3 дня",
    },
    {
      id: "advanced",
      title: isEn ? "Advanced Level" : "Продвинутый уровень",
      subtitle: isEn
        ? "Systematic business transformation and data-driven management"
        : "Системная трансформация бизнеса и управление на основе данных",
      icon: Rocket,
      color: "#a78bfa",
      borderColor: "border-violet-500/30",
      bgColor: "bg-violet-500/5",
      programKeys: ["aiShift", "dataDriven"],
    },
    {
      id: "professional",
      title: isEn ? "Professional Level" : "Профессиональный уровень",
      subtitle: isEn
        ? "Comprehensive program for Chief AI Officers (CAIO) and AI transformation leaders"
        : "Комплексная программа для Chief AI Officers (CAIO) и лидеров AI-трансформации",
      icon: Award,
      color: "#f59e0b",
      borderColor: "border-amber-500/30",
      bgColor: "bg-amber-500/5",
      programKeys: [],
    },
  ];

  const CONTENT_RECS = [
    {
      icon: Zap,
      title: isEn ? "Agent Security" : "Агентная безопасность",
      description: isEn
        ? "Include a module on boundary governance, prompt injection defense, and audit trail for agentic systems."
        : "Включить модуль по boundary governance, prompt injection defense и audit trail для агентных систем.",
      color: "#22d3ee",
    },
    {
      icon: TrendingUp,
      title: isEn ? "Inference Economics" : "Экономика инференса",
      description: isEn
        ? "Add a workshop on compute cost optimization: model selection, quantization, routing."
        : "Добавить практикум по оптимизации стоимости вычислений: выбор моделей, квантизация, routing.",
      color: "#10b981",
    },
    {
      icon: Star,
      title: isEn ? "Open-Weight Strategy" : "Open-weight стратегия",
      description: isEn
        ? "Develop a case study on choosing between closed API and open-weight models for enterprise tasks."
        : "Разработать кейс по выбору между closed API и open-weight моделями для корпоративных задач.",
      color: "#f59e0b",
    },
  ];

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-emerald-400/70 tracking-widest uppercase mb-2">
          {isEn ? "Educational Trajectory" : "Образовательная траектория"}
        </p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          {isEn ? "SKOLKOVO Programs: AI Mastery Levels" : "Программы СКОЛКОВО: ступени освоения ИИ"}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          {isEn
            ? "Programs are arranged by mastery level — from first introduction to AI to professional leadership in AI transformation."
            : "Программы расположены по уровням освоения — от первого знакомства с AI до профессионального лидерства в AI-трансформации."}
        </p>
      </div>

      {/* Mastery Levels */}
      <div className="space-y-6 mb-8">
        {MASTERY_LEVELS.map((level, levelIdx) => {
          const Icon = level.icon;
          const programs = level.programKeys
            .map((k) => programScores[k])
            .filter(Boolean);

          const isProfessional = level.id === "professional";

          return (
            <div key={level.id} className={`rounded-xl border ${level.borderColor} ${level.bgColor} p-4 sm:p-5`}>
              {/* Level Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${level.color}15`, border: `1px solid ${level.color}40` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: level.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider" style={{ color: level.color }}>
                        {isEn ? `Stage ${levelIdx + 1}` : `Ступень ${levelIdx + 1}`}
                      </span>
                      {level.badge && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                          style={{ backgroundColor: `${level.color}20`, color: level.color, border: `1px solid ${level.color}30` }}
                        >
                          <Clock className="w-2.5 h-2.5 inline mr-1" />
                          {level.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-heading font-bold text-foreground">{level.title}</h4>
                  </div>
                </div>
                {!isProfessional && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {programs.length} {isEn
                      ? (programs.length === 1 ? "program" : "programs")
                      : (programs.length === 1 ? "программа" : programs.length < 5 ? "программы" : "программ")}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4 ml-12">{level.subtitle}</p>

              {/* Programs or Coming Soon */}
              {isProfessional ? (
                <div className="ml-0 sm:ml-12">
                  <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
                    <div className="absolute top-2 right-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {isEn ? "In Development" : "В разработке"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span className="text-sm sm:text-base font-heading font-bold text-foreground">AI PRO</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {isEn
                        ? "Comprehensive program for Chief AI Officers (CAIO) — strategic management of AI transformation at the organizational level. Covers all 9 DLS levels: from technologies and data to institutional changes and capital."
                        : "Комплексная программа для Chief AI Officers (CAIO) — стратегическое управление AI-трансформацией на уровне организации. Охватывает все 9 уровней СРТ: от технологий и данных до институциональных изменений и капитала."}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {isEn ? "For CAIO and C-level" : "Для CAIO и C-level"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isEn ? "Launch — 2026" : "Запуск — 2026"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 ml-0 sm:ml-12">
                  {programs.map((prog) => (
                    <a
                      key={prog.key}
                      href={prog.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border border-border/30 bg-card/40 hover:border-primary/20 hover:bg-card/60 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs sm:text-sm font-semibold text-foreground">{prog.shortName}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground font-mono">{prog.format}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">{prog.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{isEn ? "Relevance:" : "Релевантность:"}</span>
                          <div className="w-16 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${prog.score}%`,
                                background: `linear-gradient(to right, ${level.color}80, ${level.color})`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono w-8 text-right" style={{ color: level.color }}>
                            {prog.score}%
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progression Arrow */}
      <div className="flex items-center justify-center gap-2 mb-8 text-muted-foreground/50">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-violet-500/30" />
        <span className="text-[10px] font-mono uppercase tracking-widest">
          {isEn ? "Development Path →" : "Путь развития →"}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 via-amber-500/30 to-transparent" />
      </div>

      {/* Content Recommendations */}
      <div>
        <h4 className="text-sm font-heading font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          {isEn ? "Program Content Recommendations" : "Рекомендации по содержанию программ"}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CONTENT_RECS.map((rec, idx) => {
            const RecIcon = rec.icon;
            return (
              <div key={idx} className="p-4 rounded-lg border border-border/40 bg-muted/10">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${rec.color}15`, border: `1px solid ${rec.color}30` }}
                  >
                    <RecIcon className="w-3.5 h-3.5" style={{ color: rec.color }} />
                  </div>
                  <h5 className="text-xs font-semibold text-foreground">{rec.title}</h5>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
