/*
 * EducationWhatsNew — Dynamic "What's New" section for AI Education Monitor
 * Reads from /data/education-live.json (updated by n8n 3x daily)
 * Highlights: critical alerts, new programs, trend changes, new signals
 */
import { useState, useEffect } from "react";
import {
  AlertTriangle, TrendingUp, Plus, Zap, ArrowUpRight, Clock,
  ChevronDown, ChevronUp, RefreshCw, Flame, Target, BookOpen,
  Building2, Globe, ShieldAlert, Lightbulb, BarChart2, Bell,
  CheckCircle2, ArrowRight, Sparkles, Eye
} from "lucide-react";

/* ── Types ── */
interface CriticalAlert {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  body: string;
  relevance: string;
  action: string;
  source_institution: string;
  detected_at: string;
}

interface NewProgram {
  id: string;
  institution: string;
  program_name: string;
  region: string;
  level: string;
  description: string;
  url: string;
  added_at: string;
  why_relevant: string;
}

interface UpdatedTrend {
  id: string;
  trend_name: string;
  change_type: "momentum_up" | "momentum_down" | "new_player" | "new_evidence";
  previous_momentum: string;
  current_momentum: string;
  delta_description: string;
  new_evidence: string;
}

interface NewSignal {
  id: string;
  institution: string;
  signal: string;
  impact: string;
  signal_type: "competitive_threat" | "market_shift" | "pricing_pressure" | "opportunity";
  detected_at: string;
}

interface DeveloperDigest {
  summary: string;
  top_actions: string[];
  market_temperature: "hot" | "warm" | "cool";
  competitive_pressure: "high" | "medium" | "low";
}

interface StatsDelta {
  new_programs_count: number;
  updated_trends_count: number;
  new_signals_count: number;
  critical_alerts_count: number;
  total_programs_monitored: number;
  regions_with_changes: string[];
}

interface EducationLiveData {
  generated_at: string;
  previous_report_date: string;
  current_report_date: string;
  update_frequency: string;
  critical_alerts: CriticalAlert[];
  new_programs: NewProgram[];
  updated_trends: UpdatedTrend[];
  new_signals: NewSignal[];
  developer_digest: DeveloperDigest;
  stats_delta: StatsDelta;
}

/* ── Helpers ── */
function getBasePath() {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : base + "/";
}

function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor(diffMs / 60000);
  if (diffH >= 24) return `${Math.floor(diffH / 24)} дн. назад`;
  if (diffH >= 1) return `${diffH} ч. назад`;
  if (diffM >= 1) return `${diffM} мин. назад`;
  return "только что";
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric"
  });
}

/* ── Severity config ── */
const SEVERITY_CONFIG = {
  critical: {
    label: "КРИТИЧНО",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    glow: "shadow-red-500/10",
    barColor: "bg-red-500",
    icon: ShieldAlert,
  },
  high: {
    label: "ВАЖНО",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    glow: "shadow-amber-500/10",
    barColor: "bg-amber-500",
    icon: AlertTriangle,
  },
  medium: {
    label: "ВНИМАНИЕ",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/40",
    glow: "shadow-sky-500/10",
    barColor: "bg-sky-500",
    icon: Bell,
  },
};

const SIGNAL_TYPE_CONFIG = {
  competitive_threat: { label: "Угроза конкурента", color: "text-red-400", bg: "bg-red-400/10", icon: ShieldAlert },
  market_shift: { label: "Сдвиг рынка", color: "text-amber-400", bg: "bg-amber-400/10", icon: BarChart2 },
  pricing_pressure: { label: "Ценовое давление", color: "text-orange-400", bg: "bg-orange-400/10", icon: TrendingUp },
  opportunity: { label: "Возможность", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: Lightbulb },
};

const CHANGE_TYPE_CONFIG = {
  momentum_up: { label: "↑ Моментум вырос", color: "text-red-400", bg: "bg-red-400/10" },
  momentum_down: { label: "↓ Моментум снизился", color: "text-zinc-400", bg: "bg-zinc-400/10" },
  new_player: { label: "+ Новый игрок", color: "text-amber-400", bg: "bg-amber-400/10" },
  new_evidence: { label: "◉ Новые данные", color: "text-sky-400", bg: "bg-sky-400/10" },
};

const LEVEL_LABEL: Record<string, string> = {
  Beginner: "Начальный",
  Applied_Short: "Прикладной",
  Intermediate: "Средний",
  Premium_Long: "Премиум",
};

const REGION_FLAG: Record<string, string> = {
  USA: "🇺🇸", UK: "🇬🇧", EU: "🇪🇺", China: "🇨🇳",
  India: "🇮🇳", Saudi_Arabia: "🇸🇦", Russia: "🇷🇺", Other: "🌍",
};

/* ── Sub-components ── */

function LivePulse() {
  return (
    <span className="relative flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Live</span>
    </span>
  );
}

function DeltaBadge({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${color} bg-current/5`}
      style={{ borderColor: "currentColor", backgroundColor: "transparent" }}>
      <span className={`text-lg font-heading font-bold ${color}`}>{count}</span>
      <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

function CriticalAlertCard({ alert }: { alert: CriticalAlert }) {
  const [expanded, setExpanded] = useState(alert.severity === "critical");
  const cfg = SEVERITY_CONFIG[alert.severity];
  const Icon = cfg.icon;

  return (
    <div className={`relative rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all duration-300 hover:shadow-lg hover:${cfg.glow}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.barColor}`} />

      <div className="pl-4">
        {/* Header row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-colors"
        >
          <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${cfg.bg}`}>
            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {formatRelativeTime(alert.detected_at)}
              </span>
              <span className="text-[10px] text-muted-foreground">· {alert.source_institution}</span>
            </div>
            <h4 className={`text-sm font-heading font-semibold ${cfg.color} leading-snug`}>{alert.title}</h4>
          </div>
          <div className="shrink-0 mt-1">
            {expanded
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
            <p className="text-xs text-foreground/80 leading-relaxed">{alert.body}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Relevance */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5">
                <Eye className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Почему важно</p>
                  <p className="text-[11px] text-foreground/80">{alert.relevance}</p>
                </div>
              </div>
              {/* Action */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5">
                <Target className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Рекомендуемое действие</p>
                  <p className="text-[11px] text-emerald-400/90 font-medium">{alert.action}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NewProgramCard({ program }: { program: NewProgram }) {
  const flag = REGION_FLAG[program.region] || "🌍";
  const levelLabel = LEVEL_LABEL[program.level] || program.level;

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4 hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden">
      {/* NEW badge glow */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              + Новая
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">{formatRelativeTime(program.added_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">{flag}</span>
            <span className="text-[10px] text-muted-foreground">{levelLabel}</span>
          </div>
        </div>

        {/* Program name */}
        <h4 className="text-sm font-heading font-semibold text-foreground mb-0.5 leading-snug">{program.program_name}</h4>
        <p className="text-[11px] text-primary/70 mb-2 flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {program.institution}
        </p>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{program.description}</p>

        {/* Why relevant */}
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <Sparkles className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-emerald-400/80">{program.why_relevant}</p>
        </div>

        {/* Link */}
        {program.url && (
          <a
            href={program.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowUpRight className="w-3 h-3" />
            Подробнее
          </a>
        )}
      </div>
    </div>
  );
}

function UpdatedTrendCard({ trend }: { trend: UpdatedTrend }) {
  const changeCfg = CHANGE_TYPE_CONFIG[trend.change_type] || CHANGE_TYPE_CONFIG.new_evidence;

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-amber-400/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-heading font-semibold text-foreground leading-snug flex-1">{trend.trend_name}</h4>
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${changeCfg.bg} ${changeCfg.color} border border-current/20 uppercase tracking-wider`}>
          {changeCfg.label}
        </span>
      </div>

      {/* Momentum change */}
      {trend.previous_momentum !== trend.current_momentum && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-muted-foreground">{trend.previous_momentum}</span>
          <ArrowRight className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-medium text-amber-400">{trend.current_momentum}</span>
        </div>
      )}

      {/* Delta description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{trend.delta_description}</p>

      {/* Evidence */}
      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-400/5 border border-amber-400/10">
        <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-amber-400/80">{trend.new_evidence}</p>
      </div>
    </div>
  );
}

function NewSignalCard({ signal }: { signal: NewSignal }) {
  const typeCfg = SIGNAL_TYPE_CONFIG[signal.signal_type] || SIGNAL_TYPE_CONFIG.market_shift;
  const Icon = typeCfg.icon;

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-sky-400/20 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-sky-400/30 rounded-l-xl" />
      <div className="pl-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${typeCfg.bg} ${typeCfg.color} uppercase tracking-wider`}>
            <Icon className="w-2.5 h-2.5" />
            {typeCfg.label}
          </span>
          <span className="text-[10px] font-heading font-semibold text-sky-400">{signal.institution}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{formatRelativeTime(signal.detected_at)}</span>
        </div>

        {/* Signal text */}
        <p className="text-xs text-foreground/85 mb-2 leading-relaxed">{signal.signal}</p>

        {/* Impact */}
        <div className="flex items-start gap-1.5">
          <Zap className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">{signal.impact}</p>
        </div>
      </div>
    </div>
  );
}

function DeveloperDigestPanel({ digest, stats }: { digest: DeveloperDigest; stats: StatsDelta }) {
  const [actionsExpanded, setActionsExpanded] = useState(true);

  const tempConfig = {
    hot: { label: "Горячий рынок", color: "text-red-400", bg: "bg-red-400/10", icon: Flame },
    warm: { label: "Активный рынок", color: "text-amber-400", bg: "bg-amber-400/10", icon: TrendingUp },
    cool: { label: "Спокойный рынок", color: "text-sky-400", bg: "bg-sky-400/10", icon: BarChart2 },
  };
  const pressureConfig = {
    high: { label: "Высокое", color: "text-red-400" },
    medium: { label: "Среднее", color: "text-amber-400" },
    low: { label: "Низкое", color: "text-emerald-400" },
  };

  const tempCfg = tempConfig[digest.market_temperature];
  const TempIcon = tempCfg.icon;
  const pressCfg = pressureConfig[digest.competitive_pressure];

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-heading font-semibold text-foreground">Дайджест разработчика программ</h4>
            <p className="text-[10px] text-muted-foreground">Что важно для вас прямо сейчас</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${tempCfg.bg}`}>
            <TempIcon className={`w-3 h-3 ${tempCfg.color}`} />
            <span className={`text-[10px] font-medium ${tempCfg.color}`}>{tempCfg.label}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{digest.summary}</p>

        {/* Market stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-muted/20 rounded-lg p-2.5 text-center">
            <div className="text-lg font-heading font-bold text-foreground">{stats.total_programs_monitored}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Программ</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-2.5 text-center">
            <div className={`text-lg font-heading font-bold ${pressCfg.color}`}>{pressCfg.label}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Конкуренция</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-2.5 text-center">
            <div className="text-lg font-heading font-bold text-foreground">{stats.regions_with_changes.length}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Регионов изменилось</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-2.5 text-center">
            <div className="text-lg font-heading font-bold text-red-400">{stats.critical_alerts_count}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Критических</div>
          </div>
        </div>

        {/* Action items */}
        <div>
          <button
            onClick={() => setActionsExpanded(!actionsExpanded)}
            className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xs font-heading font-semibold text-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              Приоритетные действия
            </span>
            {actionsExpanded
              ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            }
          </button>

          {actionsExpanded && (
            <div className="space-y-1.5">
              {digest.top_actions.map((action, idx) => {
                const isUrgent = action.toLowerCase().startsWith("срочно");
                const isPriority = action.toLowerCase().startsWith("приоритет");
                const isOpportunity = action.toLowerCase().startsWith("возможность");
                const dotColor = isUrgent ? "bg-red-400" : isPriority ? "bg-amber-400" : isOpportunity ? "bg-emerald-400" : "bg-sky-400";
                const textColor = isUrgent ? "text-red-400/90" : isPriority ? "text-amber-400/90" : isOpportunity ? "text-emerald-400/90" : "text-foreground/80";

                return (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                    <p className={`text-[11px] leading-relaxed ${textColor}`}>{action}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main WhatsNew Component ── */
export default function EducationWhatsNew() {
  const [data, setData] = useState<EducationLiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"alerts" | "programs" | "trends" | "signals">("alerts");
  const [collapsed, setCollapsed] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    const basePath = getBasePath();
    // Cache-bust with timestamp to always get fresh data
    fetch(`${basePath}data/education-live.json?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: EducationLiveData) => {
        setData(json);
        setLoading(false);
        setLastRefreshed(new Date());
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* Loading skeleton */
  if (loading && !data) {
    return (
      <section className="py-6 sm:py-8">
        <div className="container">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted/30 rounded-lg w-64" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted/20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* Error state — silent, don't break the page */
  if (error || !data) {
    return (
      <section className="py-4">
        <div className="container">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/30">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Данные о последних изменениях временно недоступны. Обновляется автоматически.
            </span>
            <button onClick={fetchData} className="ml-auto text-[10px] text-primary hover:text-primary/80 transition-colors">
              Повторить
            </button>
          </div>
        </div>
      </section>
    );
  }

  const { critical_alerts, new_programs, updated_trends, new_signals, developer_digest, stats_delta } = data;
  const totalChanges = stats_delta.new_programs_count + stats_delta.updated_trends_count + stats_delta.new_signals_count + stats_delta.critical_alerts_count;

  const TABS = [
    { id: "alerts" as const, label: "Критические", count: critical_alerts.length, color: "text-red-400", activeBg: "bg-red-500/15 border-red-500/30" },
    { id: "programs" as const, label: "Новые программы", count: new_programs.length, color: "text-emerald-400", activeBg: "bg-emerald-500/15 border-emerald-500/30" },
    { id: "trends" as const, label: "Тренды", count: updated_trends.length, color: "text-amber-400", activeBg: "bg-amber-500/15 border-amber-500/30" },
    { id: "signals" as const, label: "Сигналы", count: new_signals.length, color: "text-sky-400", activeBg: "bg-sky-500/15 border-sky-500/30" },
  ];

  return (
    <section className="py-6 sm:py-8 relative">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative">
        {/* ── Section header ── */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base sm:text-lg font-heading font-bold text-foreground">Что изменилось</h3>
                <LivePulse />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Обновлено {formatRelativeTime(data.generated_at)} · {data.update_frequency}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/30 transition-all duration-200 disabled:opacity-50"
              title="Обновить данные"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
            {/* Collapse button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/30 text-[10px] text-muted-foreground transition-all duration-200"
            >
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              {collapsed ? "Развернуть" : "Свернуть"}
            </button>
          </div>
        </div>

        {/* ── Delta summary pills ── */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {stats_delta.critical_alerts_count > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-sm font-heading font-bold text-red-400">{stats_delta.critical_alerts_count}</span>
              <span className="text-[11px] text-muted-foreground">критических</span>
            </div>
          )}
          {stats_delta.new_programs_count > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-heading font-bold text-emerald-400">{stats_delta.new_programs_count}</span>
              <span className="text-[11px] text-muted-foreground">новых программ</span>
            </div>
          )}
          {stats_delta.updated_trends_count > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-heading font-bold text-amber-400">{stats_delta.updated_trends_count}</span>
              <span className="text-[11px] text-muted-foreground">трендов обновлено</span>
            </div>
          )}
          {stats_delta.new_signals_count > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/25">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-sm font-heading font-bold text-sky-400">{stats_delta.new_signals_count}</span>
              <span className="text-[11px] text-muted-foreground">новых сигналов</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
            с {formatDate(data.previous_report_date)}
          </span>
        </div>

        {!collapsed && (
          <>
            {/* ── Developer Digest ── */}
            <div className="mb-5">
              <DeveloperDigestPanel digest={developer_digest} stats={stats_delta} />
            </div>

            {/* ── Tab navigation ── */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all duration-200 ${
                    activeTab === tab.id
                      ? `${tab.activeBg} ${tab.color}`
                      : "bg-muted/20 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded ${
                      activeTab === tab.id ? "bg-current/20" : "bg-muted/40"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            <div className="space-y-3">
              {activeTab === "alerts" && (
                <>
                  {critical_alerts.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">Критических изменений нет. Рынок стабилен.</span>
                    </div>
                  ) : (
                    critical_alerts.map((alert) => (
                      <CriticalAlertCard key={alert.id} alert={alert} />
                    ))
                  )}
                </>
              )}

              {activeTab === "programs" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {new_programs.length === 0 ? (
                    <div className="col-span-full flex items-center gap-2 p-4 rounded-xl bg-muted/20 border border-border/30">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Новых программ с прошлого отчёта не обнаружено.</span>
                    </div>
                  ) : (
                    new_programs.map((prog) => (
                      <NewProgramCard key={prog.id} program={prog} />
                    ))
                  )}
                </div>
              )}

              {activeTab === "trends" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {updated_trends.length === 0 ? (
                    <div className="col-span-full flex items-center gap-2 p-4 rounded-xl bg-muted/20 border border-border/30">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Тренды не изменились с прошлого отчёта.</span>
                    </div>
                  ) : (
                    updated_trends.map((trend) => (
                      <UpdatedTrendCard key={trend.id} trend={trend} />
                    ))
                  )}
                </div>
              )}

              {activeTab === "signals" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {new_signals.length === 0 ? (
                    <div className="col-span-full flex items-center gap-2 p-4 rounded-xl bg-muted/20 border border-border/30">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Новых конкурентных сигналов не зафиксировано.</span>
                    </div>
                  ) : (
                    new_signals.map((signal) => (
                      <NewSignalCard key={signal.id} signal={signal} />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ── Footer note ── */}
            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
              <Clock className="w-3 h-3" />
              <span>Последнее обновление: {lastRefreshed.toLocaleTimeString("ru-RU")} · Авто-обновление каждые 15 мин</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
