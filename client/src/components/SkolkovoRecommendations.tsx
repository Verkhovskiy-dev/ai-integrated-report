import { BookOpen, ExternalLink, Star, TrendingUp, Zap, GraduationCap, Rocket, Award, Clock, Users } from "lucide-react";
import { useLiveData, type LiveReport } from "@/contexts/LiveDataContext";
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
  description: string;
  format: string;
}> = {
  intensiveAI: {
    keywords: ["генератив", "модел", "llm", "gpt", "prompt", "fine-tun", "инференс", "reasoning", "cot", "нейросет"],
    levels: [4, 5, 6, 7],
    mastery: "beginner",
    description: "Знакомство с генеративными моделями: архитектуры, промптинг, практические инструменты ИИ",
    format: "2-3 дня · интенсив",
  },
  intensiveAgents: {
    keywords: ["агент", "agent", "agentic", "mcp", "orchestrat", "tool", "продукт", "product", "boundary", "guardrail"],
    levels: [4, 5, 6],
    mastery: "beginner",
    description: "Введение в AI-агенты и AI-продукты: принципы работы, архитектура, первые шаги",
    format: "2-3 дня · интенсив",
  },
  ubnd: {
    keywords: ["управлен", "бизнес", "решен", "kpi", "roi", "эффективн", "менеджмент", "капитал", "данн"],
    levels: [7, 8, 9],
    mastery: "beginner",
    description: "ИИ и данные как основа управленческих решений: понимание принципов и ситуации",
    format: "2-3 дня · интенсив",
  },
  aiMarketing: {
    keywords: ["маркетинг", "marketing", "контент", "content", "персонализ", "клиент", "consumer", "бренд", "brand"],
    levels: [3, 5, 6],
    mastery: "beginner",
    description: "Практическое применение генеративного ИИ в маркетинге: инструменты и принципы",
    format: "2-3 дня · интенсив",
  },
  aiShift: {
    keywords: ["трансформац", "стратег", "бизнес-процесс", "внедрен", "цифров", "ai strategy", "digital", "переход"],
    levels: [5, 6, 7, 8, 9],
    mastery: "advanced",
    description: "Системная трансформация бизнес-процессов с помощью ИИ: стратегия, внедрение, управление изменениями",
    format: "Длительная программа",
  },
  dataDriven: {
    keywords: ["данн", "data", "аналитик", "metric", "governance", "pipeline", "etl", "warehouse", "data-driven"],
    levels: [4, 5, 6, 7],
    mastery: "advanced",
    description: "Построение data-driven системы управления: от интуитивного к доказательному менеджменту через данные",
    format: "Длительная программа",
  },
};

function computeRelevance(reports: LiveReport[]): Record<string, ProgramWithLevel> {
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
      reasons.push(`${keywordHits} упоминаний`);
    }

    let levelScore = 0;
    for (const lvl of config.levels) {
      levelScore += levelActivity[lvl] || 0;
    }
    if (levelScore > 0) {
      score += Math.min(40, levelScore * 2);
      reasons.push(`Активность уровней ${config.levels.join(", ")}`);
    }

    score += 20;

    results[key] = {
      key,
      name: program.name,
      shortName: program.shortName || key,
      url: program.url,
      description: config.description,
      format: config.format,
      score: Math.min(100, score),
      reasons,
    };
  }

  return results;
}

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
    title: "Начальный уровень",
    subtitle: "Ознакомление с ИИ, практические инструменты и понимание принципов и ситуации",
    icon: GraduationCap,
    color: "#22d3ee",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/5",
    programKeys: ["intensiveAI", "intensiveAgents", "ubnd", "aiMarketing"],
    badge: "2-3 дня",
  },
  {
    id: "advanced",
    title: "Продвинутый уровень",
    subtitle: "Системная трансформация бизнеса и управление на основе данных",
    icon: Rocket,
    color: "#a78bfa",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/5",
    programKeys: ["aiShift", "dataDriven"],
  },
  {
    id: "professional",
    title: "Профессиональный уровень",
    subtitle: "Комплексная программа для Chief AI Officers (CAIO) и лидеров AI-трансформации",
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
    title: "Агентная безопасность",
    description: "Включить модуль по boundary governance, prompt injection defense и audit trail для агентных систем.",
    color: "#22d3ee",
  },
  {
    icon: TrendingUp,
    title: "Экономика инференса",
    description: "Добавить практикум по оптимизации стоимости вычислений: выбор моделей, квантизация, routing.",
    color: "#10b981",
  },
  {
    icon: Star,
    title: "Open-weight стратегия",
    description: "Разработать кейс по выбору между closed API и open-weight моделями для корпоративных задач.",
    color: "#f59e0b",
  },
];

export default function SkolkovoRecommendations() {
  const { archiveReports, latestReport } = useLiveData();
  const allReports = latestReport
    ? [...archiveReports.filter((r) => r.date !== latestReport.date), latestReport]
    : archiveReports;

  const programScores = computeRelevance(allReports);

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-emerald-400/70 tracking-widest uppercase mb-2">Образовательная траектория</p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          Программы СКОЛКОВО: ступени освоения ИИ
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Программы расположены по уровням освоения — от первого знакомства с AI до профессионального лидерства в AI-трансформации.
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
                        Ступень {levelIdx + 1}
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
                    {programs.length} {programs.length === 1 ? "программа" : programs.length < 5 ? "программы" : "программ"}
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
                        В разработке
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span className="text-sm sm:text-base font-heading font-bold text-foreground">AI PRO</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      Комплексная программа для Chief AI Officers (CAIO) — стратегическое управление AI-трансформацией на уровне организации.
                      Охватывает все 9 уровней СРТ: от технологий и данных до институциональных изменений и капитала.
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Для CAIO и C-level
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Запуск — 2026
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
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border border-border/30 bg-background/40 hover:border-primary/30 hover:bg-background/60 transition-all group"
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
                          <span className="text-[10px] text-muted-foreground">Релевантность:</span>
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
        <span className="text-[10px] font-mono uppercase tracking-widest">Путь развития →</span>
        <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 via-amber-500/30 to-transparent" />
      </div>

      {/* Content Recommendations */}
      <div>
        <h4 className="text-sm font-heading font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Рекомендации по содержанию программ
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
