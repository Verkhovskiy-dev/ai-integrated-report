/*
 * AI Education Monitor — Business Schools Dashboard
 * Dark theme matching the main site (Space Grotesk + IBM Plex Sans)
 * All UI text in Russian
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  GraduationCap, TrendingUp, AlertTriangle, Globe, ChevronDown, ChevronUp,
  ExternalLink, ArrowLeft, Activity, Zap, BarChart3, BookOpen, MapPin,
  Flame, Clock, Users, Award
} from "lucide-react";

/* ── Types ── */
interface Program {
  institution: string;
  program_name: string;
  level: "Beginner" | "Applied_Short" | "Intermediate" | "Premium_Long";
  description: string;
  url: string;
}

interface Trend {
  trend_name: string;
  description: string;
  momentum: "High" | "Medium" | "Low";
}

interface Signal {
  institution: string;
  signal: string;
  impact: string;
}

interface EducationReport {
  report_date: string;
  regions: Record<string, Program[]>;
  trends: Trend[];
  competitive_signals: Signal[];
  notes: string;
  meta: {
    total_programs: number;
    total_trends: number;
    total_signals: number;
    processed_at: string;
  };
}

/* ── Constants ── */
const REGION_META: Record<string, { flag: string; label: string }> = {
  USA: { flag: "🇺🇸", label: "США" },
  UK: { flag: "🇬🇧", label: "Великобритания" },
  EU: { flag: "🇪🇺", label: "Европа" },
  China: { flag: "🇨🇳", label: "Китай" },
  India: { flag: "🇮🇳", label: "Индия" },
  Saudi_Arabia: { flag: "🇸🇦", label: "Саудовская Аравия" },
  Other: { flag: "🌍", label: "Другие регионы" },
};

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Beginner: {
    label: "Начальный",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  Applied_Short: {
    label: "Прикладной",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/30",
  },
  Intermediate: {
    label: "Средний",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
  },
  Premium_Long: {
    label: "Премиум",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/30",
  },
};

const MOMENTUM_CONFIG: Record<string, { label: string; color: string; bg: string; pulse: boolean; icon: typeof Flame }> = {
  High: { label: "Высокий", color: "text-red-400", bg: "bg-red-400/10", pulse: true, icon: Flame },
  Medium: { label: "Средний", color: "text-amber-400", bg: "bg-amber-400/10", pulse: false, icon: TrendingUp },
  Low: { label: "Низкий", color: "text-zinc-400", bg: "bg-zinc-400/10", pulse: false, icon: Clock },
};

/* ── Helper: fetch data ── */
function getBasePath() {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : base + "/";
}

/* ── Sub-components ── */

function StatCard({ icon: Icon, value, label, accent }: { icon: typeof Activity; value: number | string; label: string; accent: string }) {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${accent}`} />
      <div className="relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent.replace("0.15", "0.2")}`}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.Beginner;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function MomentumBadge({ momentum }: { momentum: string }) {
  const cfg = MOMENTUM_CONFIG[momentum] || MOMENTUM_CONFIG.Low;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon className={`w-3 h-3 ${cfg.pulse ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

function RegionCard({ regionKey, programs }: { regionKey: string; programs: Program[] }) {
  const [expanded, setExpanded] = useState(false);
  const meta = REGION_META[regionKey] || { flag: "🌐", label: regionKey };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:border-primary/20 transition-all duration-300">
      {/* Region header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.flag}</span>
          <div>
            <h3 className="text-sm sm:text-base font-heading font-semibold text-foreground">{meta.label}</h3>
            <p className="text-xs text-muted-foreground">
              {programs.length} {programs.length === 1 ? "программа" : programs.length < 5 ? "программы" : "программ"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Level distribution mini-badges */}
          <div className="hidden sm:flex items-center gap-1">
            {Object.entries(
              programs.reduce((acc, p) => {
                acc[p.level] = (acc[p.level] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([level, count]) => {
              const cfg = LEVEL_CONFIG[level];
              return cfg ? (
                <span key={level} className={`text-[9px] px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                  {count}
                </span>
              ) : null;
            })}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Programs list */}
      {expanded && (
        <div className="border-t border-border/30">
          {programs.map((prog, idx) => (
            <div
              key={idx}
              className={`p-4 sm:p-5 ${idx > 0 ? "border-t border-border/20" : ""} hover:bg-muted/10 transition-colors`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-heading font-semibold text-foreground">{prog.program_name}</h4>
                    <LevelBadge level={prog.level} />
                  </div>
                  <p className="text-xs text-primary/80 mt-0.5 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {prog.institution}
                  </p>
                </div>
                {prog.url && (
                  <a
                    href={prog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Подробнее
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{prog.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendCard({ trend }: { trend: Trend }) {
  const mcfg = MOMENTUM_CONFIG[trend.momentum] || MOMENTUM_CONFIG.Low;
  return (
    <div className={`bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-5 hover:border-primary/20 transition-all duration-300 relative overflow-hidden`}>
      {/* Subtle glow for high momentum */}
      {trend.momentum === "High" && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
      )}
      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="text-sm font-heading font-semibold text-foreground">{trend.trend_name}</h4>
          <MomentumBadge momentum={trend.momentum} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{trend.description}</p>
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-5 hover:border-amber-400/20 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400/40 rounded-l-xl" />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-heading font-semibold text-amber-400">{signal.institution}</span>
        </div>
        <p className="text-xs text-foreground/90 mb-2 leading-relaxed">{signal.signal}</p>
        <div className="flex items-start gap-1.5">
          <Zap className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{signal.impact}</p>
        </div>
      </div>
    </div>
  );
}

function RegionBarChart({ regions }: { regions: Record<string, Program[]> }) {
  const data = Object.entries(regions)
    .map(([key, programs]) => ({
      key,
      meta: REGION_META[key] || { flag: "🌐", label: key },
      count: programs.length,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-heading font-semibold text-foreground">Распределение по регионам</h3>
      </div>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-3">
            <span className="text-lg w-8 text-center">{d.meta.flag}</span>
            <span className="text-xs text-muted-foreground w-28 sm:w-36 truncate">{d.meta.label}</span>
            <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/60 to-primary/30 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                style={{ width: `${Math.max((d.count / maxCount) * 100, 8)}%` }}
              >
                <span className="text-[10px] font-mono font-medium text-foreground">{d.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LevelDistribution({ regions }: { regions: Record<string, Program[]> }) {
  const allPrograms = Object.values(regions).flat();
  const levels = Object.entries(
    allPrograms.reduce((acc, p) => {
      acc[p.level] = (acc[p.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const total = allPrograms.length;

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-heading font-semibold text-foreground">Уровни программ</h3>
      </div>
      <div className="space-y-3">
        {levels.map(([level, count]) => {
          const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.Beginner;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={level} className="flex items-center gap-3">
              <span className={`text-xs w-24 ${cfg.color}`}>{cfg.label}</span>
              <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${cfg.bg.replace("/10", "/40")}`}
                  style={{ width: `${Math.max(pct, 5)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-12 text-right">{count} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function Education() {
  const [data, setData] = useState<EducationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  useEffect(() => {
    document.title = "AI Education Monitor — Business Schools";
    const basePath = getBasePath();
    fetch(`${basePath}data/education-report.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: EducationReport) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const regionKeys = useMemo(() => {
    if (!data) return [];
    return Object.keys(REGION_META).filter((k) => data.regions[k] && data.regions[k].length > 0);
  }, [data]);

  const filteredRegions = useMemo(() => {
    if (!data) return {};
    if (!activeRegion) return data.regions;
    return { [activeRegion]: data.regions[activeRegion] || [] };
  }, [data, activeRegion]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center animate-pulse">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-heading font-semibold mb-2">Данные недоступны</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Не удалось загрузить отчёт Education Monitor. {error && `Ошибка: ${error}`}
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.report_date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-clip">
      {/* Subtle scan line overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-20 scan-line hidden sm:block" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container flex items-center justify-between h-12 sm:h-14">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-semibold font-heading tracking-tight text-foreground">
                AI Education Monitor
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground font-mono">
                  Business Schools — {formattedDate}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">AI Strategic Intelligence</span>
            <span className="sm:hidden">Главная</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── Hero Section ── */}
        <section className="py-8 sm:py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="container relative">
            <div className="max-w-3xl mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">Education Monitor</span>
                <span className="w-8 h-px bg-primary/30" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3">
                Мониторинг AI/ML программ ведущих бизнес-школ мира
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Отслеживание образовательных программ по искусственному интеллекту, машинному обучению и цифровой трансформации
                в ведущих бизнес-школах мира. Тренды, конкурентные сигналы и аналитика.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={GraduationCap} value={data.meta.total_programs} label="Программ" accent="bg-primary/15" />
              <StatCard icon={TrendingUp} value={data.meta.total_trends} label="Трендов" accent="bg-amber-400/15" />
              <StatCard icon={AlertTriangle} value={data.meta.total_signals} label="Сигналов" accent="bg-red-400/15" />
              <StatCard icon={Globe} value={regionKeys.length} label="Регионов" accent="bg-purple-400/15" />
            </div>
          </div>
        </section>

        {/* ── Regional Overview ── */}
        <section className="py-6 sm:py-10">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <RegionBarChart regions={data.regions} />
              <LevelDistribution regions={data.regions} />
            </div>
          </div>
        </section>

        {/* ── Programs by Region ── */}
        <section className="py-6 sm:py-10">
          <div className="container">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">Программы</span>
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-4">
              Программы по регионам
            </h3>

            {/* Region filter pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveRegion(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  !activeRegion
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                Все регионы
              </button>
              {regionKeys.map((key) => {
                const meta = REGION_META[key];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveRegion(activeRegion === key ? null : key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      activeRegion === key
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                  >
                    {meta?.flag} {meta?.label}
                  </button>
                );
              })}
            </div>

            {/* Region cards */}
            <div className="space-y-3">
              {Object.entries(filteredRegions)
                .filter(([, programs]) => programs.length > 0)
                .map(([key, programs]) => (
                  <RegionCard key={key} regionKey={key} programs={programs} />
                ))}
            </div>
          </div>
        </section>

        {/* ── Trends ── */}
        <section className="py-6 sm:py-10">
          <div className="container">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">Тренды</span>
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-4">
              Ключевые тренды
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {data.trends.map((trend, idx) => (
                <TrendCard key={idx} trend={trend} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Competitive Signals ── */}
        <section className="py-6 sm:py-10">
          <div className="container">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-400/60 uppercase tracking-widest">Сигналы</span>
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-4">
              Конкурентные сигналы
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {data.competitive_signals.map((signal, idx) => (
                <SignalCard key={idx} signal={signal} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Notes ── */}
        {data.notes && (
          <section className="py-6 sm:py-10">
            <div className="container">
              <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-heading font-semibold text-muted-foreground">Примечания</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{data.notes}</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-4 sm:py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary/60" />
            <span className="text-[10px] text-muted-foreground font-mono">
              AI Education Monitor — обновлено {formattedDate}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              ← AI Strategic Intelligence
            </Link>
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              Данные обновляются 3 раза в день
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
