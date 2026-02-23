import { BookOpen, ExternalLink, Star, TrendingUp, Zap, GraduationCap, Rocket, Award } from "lucide-react";
import { useLiveData, type LiveReport } from "@/contexts/LiveDataContext";
import { SKOLKOVO_PROGRAMS } from "@/data/insightsData";

interface ProgramWithLevel {
  key: string;
  name: string;
  shortName: string;
  url: string;
  description: string;
  score: number;
  reasons: string[];
}

interface MasteryLevel {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof GraduationCap;
  color: string;
  borderColor: string;
  bgColor: string;
  programs: ProgramWithLevel[];
}

const PROGRAM_CONFIG: Record<string, {
  keywords: string[];
  levels: number[];
  mastery: "beginner" | "advanced" | "professional";
  description: string;
}> = {
  aiShift: {
    keywords: ["трансформац", "стратег", "бизнес-процесс", "внедрен", "цифров", "ai strategy", "digital"],
    levels: [5, 6, 7, 8, 9],
    mastery: "beginner",
    description: "Первый шаг в понимании AI-трансформации: как ИИ меняет бизнес-процессы и стратегию компании",
  },
  dataDriven: {
    keywords: ["данн", "data", "аналитик", "metric", "governance", "pipeline", "etl", "warehouse"],
    levels: [4, 5, 6, 7],
    mastery: "beginner",
    description: "Построение культуры принятия решений на основе данных — фундамент для внедрения ИИ",
  },
  aiMarketing: {
    keywords: ["маркетинг", "marketing", "контент", "content", "персонализ", "клиент", "consumer", "бренд", "brand"],
    levels: [3, 5, 6],
    mastery: "beginner",
    description: "Применение генеративного ИИ в маркетинге: персонализация, контент, аналитика клиентов",
  },
  intensiveAI: {
    keywords: ["генератив", "модел", "llm", "gpt", "prompt", "fine-tun", "инференс", "reasoning", "cot"],
    levels: [4, 5, 6, 7],
    mastery: "advanced",
    description: "Глубокое погружение в генеративные модели: архитектуры, промптинг, файн-тюнинг, инференс",
  },
  ubnd: {
    keywords: ["управлен", "бизнес", "решен", "kpi", "roi", "эффективн", "менеджмент", "капитал"],
    levels: [7, 8, 9],
    mastery: "advanced",
    description: "Управление бизнесом нового поколения: ИИ и данные как ядро операционной модели",
  },
  intensiveAgents: {
    keywords: ["агент", "agent", "agentic", "mcp", "orchestrat", "tool", "продукт", "product", "boundary", "guardrail"],
    levels: [4, 5, 6],
    mastery: "professional",
    description: "Разработка AI-продуктов и агентных систем: архитектура, безопасность, оркестрация",
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
      score: Math.min(100, score),
      reasons,
    };
  }

  return results;
}

const MASTERY_LEVELS: { id: string; title: string; subtitle: string; icon: typeof GraduationCap; color: string; borderColor: string; bgColor: string; programKeys: string[] }[] = [
  {
    id: "beginner",
    title: "Начальный уровень",
    subtitle: "Понимание AI-трансформации и первые шаги",
    icon: GraduationCap,
    color: "#22d3ee",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/5",
    programKeys: ["aiShift", "dataDriven", "aiMarketing"],
  },
  {
    id: "advanced",
    title: "Продвинутый уровень",
    subtitle: "Глубокое владение технологиями и управление на данных",
    icon: Rocket,
    color: "#a78bfa",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/5",
    programKeys: ["intensiveAI", "ubnd"],
  },
  {
    id: "professional",
    title: "Профессиональный уровень",
    subtitle: "Разработка AI-продуктов и агентных систем",
    icon: Award,
    color: "#f59e0b",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    programKeys: ["intensiveAgents"],
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
          Программы расположены по уровням освоения — от первого знакомства с AI-трансформацией до профессиональной разработки AI-продуктов.
        </p>
      </div>

      {/* Mastery Levels */}
      <div className="space-y-6 mb-8">
        {MASTERY_LEVELS.map((level, levelIdx) => {
          const Icon = level.icon;
          const programs = level.programKeys
            .map((k) => programScores[k])
            .filter(Boolean)
            .sort((a, b) => b.score - a.score);

          return (
            <div key={level.id} className={`rounded-xl border ${level.borderColor} ${level.bgColor} p-4 sm:p-5`}>
              {/* Level Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
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
                    </div>
                    <h4 className="text-sm sm:text-base font-heading font-bold text-foreground">{level.title}</h4>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 ml-12">{level.subtitle}</p>

              {/* Programs */}
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
