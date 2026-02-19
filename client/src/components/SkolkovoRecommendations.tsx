import { BookOpen, ExternalLink, Star, TrendingUp, Zap } from "lucide-react";
import { useLiveData, type LiveReport } from "@/contexts/LiveDataContext";
import { SKOLKOVO_PROGRAMS } from "@/data/insightsData";

interface ProgramRelevance {
  key: string;
  name: string;
  shortName: string;
  url: string;
  score: number;
  reasons: string[];
}

const PROGRAM_KEYWORDS: Record<string, { keywords: string[]; levels: number[] }> = {
  aiShift: {
    keywords: ["трансформац", "стратег", "бизнес-процесс", "внедрен", "цифров", "ai strategy", "digital"],
    levels: [5, 6, 7, 8, 9],
  },
  intensiveAI: {
    keywords: ["генератив", "модел", "llm", "gpt", "prompt", "fine-tun", "инференс", "reasoning", "cot"],
    levels: [4, 5, 6, 7],
  },
  intensiveAgents: {
    keywords: ["агент", "agent", "agentic", "mcp", "orchestrat", "tool", "продукт", "product", "boundary", "guardrail"],
    levels: [4, 5, 6],
  },
  dataDriven: {
    keywords: ["данн", "data", "аналитик", "metric", "governance", "pipeline", "etl", "warehouse"],
    levels: [4, 5, 6, 7],
  },
  ubnd: {
    keywords: ["управлен", "бизнес", "решен", "kpi", "roi", "эффективн", "менеджмент", "капитал"],
    levels: [7, 8, 9],
  },
  aiMarketing: {
    keywords: ["маркетинг", "marketing", "контент", "content", "персонализ", "клиент", "consumer", "бренд", "brand"],
    levels: [3, 5, 6],
  },
};

function computeRelevance(reports: LiveReport[]): ProgramRelevance[] {
  if (reports.length === 0) return [];

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

  const results: ProgramRelevance[] = [];

  for (const [key, config] of Object.entries(PROGRAM_KEYWORDS)) {
    const program = SKOLKOVO_PROGRAMS[key];
    if (!program) continue;

    let score = 0;
    const reasons: string[] = [];

    // Keyword matching
    let keywordHits = 0;
    for (const kw of config.keywords) {
      const regex = new RegExp(kw, "gi");
      const matches = allText.match(regex);
      if (matches) keywordHits += matches.length;
    }
    if (keywordHits > 0) {
      score += Math.min(40, keywordHits * 3);
      reasons.push(`${keywordHits} упоминаний ключевых тем`);
    }

    // Level activity matching
    let levelScore = 0;
    for (const lvl of config.levels) {
      levelScore += levelActivity[lvl] || 0;
    }
    if (levelScore > 0) {
      score += Math.min(40, levelScore * 2);
      reasons.push(`Высокая активность на уровнях ${config.levels.join(", ")}`);
    }

    // Base relevance
    score += 20;

    results.push({
      key,
      name: program.name,
      shortName: program.shortName || key,
      url: program.url,
      score: Math.min(100, score),
      reasons,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

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

  const programRanking = computeRelevance(allReports);

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-emerald-400/70 tracking-widest uppercase mb-2">Рекомендации</p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">Рекомендации для программ СКОЛКОВО</h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Рейтинг релевантности программ на основе текущих трендов и рекомендации по содержанию.
        </p>
      </div>

      {/* Program Relevance Ranking */}
      {programRanking.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-heading font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400" />
            Рейтинг программ по релевантности трендам
          </h4>
          <div className="space-y-2">
            {programRanking.map((prog, idx) => (
              <a
                key={prog.key}
                href={prog.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10 hover:border-primary/30 hover:bg-muted/20 transition-all group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-heading font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground truncate">{prog.shortName}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{prog.reasons.join(" · ")}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                      style={{ width: `${prog.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-primary w-8 text-right">{prog.score}%</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Content Recommendations */}
      <div>
        <h4 className="text-sm font-heading font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Рекомендации по содержанию программ
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CONTENT_RECS.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <div key={idx} className="p-4 rounded-lg border border-border/40 bg-muted/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${rec.color}15`, border: `1px solid ${rec.color}30` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: rec.color }} />
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
