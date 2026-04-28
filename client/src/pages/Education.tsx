/*
 * AI Education Monitor — Business Schools Dashboard
 * Dark theme matching the main site (Space Grotesk + IBM Plex Sans)
 * All UI text in Russian
 * Extended with Russia region and SKOLKOVO Comparison
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  GraduationCap, TrendingUp, AlertTriangle, Globe, ChevronDown, ChevronUp,
  ExternalLink, ArrowLeft, Activity, Zap, BarChart3, BookOpen, MapPin,
  Flame, Clock, Users, Award, Building2, ArrowRightLeft, ShieldCheck,
  Target, Lightbulb, Layers
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

interface SkolkovoComparison {
  competitor_program: string;
  competitor_institution: string;
  competitor_region: string;
  skolkovo_equivalent: string;
  advantage: string;
  gap: string;
  overlap?: string;
}

interface EducationReport {
  report_date: string;
  regions: Record<string, Program[]>;
  trends: Trend[];
  competitive_signals: Signal[];
  skolkovo_comparison?: SkolkovoComparison[];
  notes: string;
  meta: {
    total_programs: number;
    total_trends: number;
    total_signals: number;
    total_skolkovo_comparisons?: number;
    processed_at: string;
  };
}

/* ── Constants ── */
const REGION_META: Record<string, { flag: string; label: string }> = {
  USA: { flag: "\u{1F1FA}\u{1F1F8}", label: "\u0421\u0428\u0410" },
  UK: { flag: "\u{1F1EC}\u{1F1E7}", label: "\u0412\u0435\u043B\u0438\u043A\u043E\u0431\u0440\u0438\u0442\u0430\u043D\u0438\u044F" },
  EU: { flag: "\u{1F1EA}\u{1F1FA}", label: "\u0415\u0432\u0440\u043E\u043F\u0430" },
  China: { flag: "\u{1F1E8}\u{1F1F3}", label: "\u041A\u0438\u0442\u0430\u0439" },
  India: { flag: "\u{1F1EE}\u{1F1F3}", label: "\u0418\u043D\u0434\u0438\u044F" },
  Saudi_Arabia: { flag: "\u{1F1F8}\u{1F1E6}", label: "\u0421\u0430\u0443\u0434\u043E\u0432\u0441\u043A\u0430\u044F \u0410\u0440\u0430\u0432\u0438\u044F" },
  Russia: { flag: "\u{1F1F7}\u{1F1FA}", label: "\u0420\u043E\u0441\u0441\u0438\u044F" },
  Other: { flag: "\u{1F30D}", label: "\u0414\u0440\u0443\u0433\u0438\u0435 \u0440\u0435\u0433\u0438\u043E\u043D\u044B" },
};

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Beginner: {
    label: "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u044B\u0439",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  Applied_Short: {
    label: "\u041F\u0440\u0438\u043A\u043B\u0430\u0434\u043D\u043E\u0439",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/30",
  },
  Intermediate: {
    label: "\u0421\u0440\u0435\u0434\u043D\u0438\u0439",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
  },
  Premium_Long: {
    label: "\u041F\u0440\u0435\u043C\u0438\u0443\u043C",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/30",
  },
};

const MOMENTUM_CONFIG: Record<string, { label: string; color: string; bg: string; pulse: boolean; icon: typeof Flame }> = {
  High: { label: "\u0412\u044B\u0441\u043E\u043A\u0438\u0439", color: "text-red-400", bg: "bg-red-400/10", pulse: true, icon: Flame },
  Medium: { label: "\u0421\u0440\u0435\u0434\u043D\u0438\u0439", color: "text-amber-400", bg: "bg-amber-400/10", pulse: false, icon: TrendingUp },
  Low: { label: "\u041D\u0438\u0437\u043A\u0438\u0439", color: "text-zinc-400", bg: "bg-zinc-400/10", pulse: false, icon: Clock },
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
  const meta = REGION_META[regionKey] || { flag: "\u{1F310}", label: regionKey };

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
              {programs.length} {programs.length === 1 ? "\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430" : programs.length < 5 ? "\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B" : "\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C"}
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
                    \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435
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
      meta: REGION_META[key] || { flag: "\u{1F310}", label: key },
      count: programs.length,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-heading font-semibold text-foreground">\u0420\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E \u0440\u0435\u0433\u0438\u043E\u043D\u0430\u043C</h3>
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
        <h3 className="text-sm font-heading font-semibold text-foreground">\u0423\u0440\u043E\u0432\u043D\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C</h3>
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

/* ── SKOLKOVO Comparison Components ── */

function ComparisonIndicator({ type }: { type: "advantage" | "gap" | "overlap" }) {
  const configs = {
    advantage: { icon: ShieldCheck, label: "\u041F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u043E \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u0430", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
    gap: { icon: Lightbulb, label: "\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u044C \u0421\u041A\u041E\u041B\u041A\u041E\u0412\u041E", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
    overlap: { icon: Layers, label: "\u041F\u0435\u0440\u0435\u0441\u0435\u0447\u0435\u043D\u0438\u0435", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  };
  const cfg = configs[type];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function SkolkovoComparisonCard({ comp }: { comp: SkolkovoComparison }) {
  const regionMeta = REGION_META[comp.competitor_region] || { flag: "\u{1F310}", label: comp.competitor_region };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-5 hover:border-cyan-400/20 transition-all duration-300 relative overflow-hidden">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400/60 via-primary/40 to-transparent" />

      {/* Header: Competitor vs SKOLKOVO */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
            <span className="text-sm">{regionMeta.flag}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-heading font-semibold text-foreground leading-tight">{comp.competitor_program}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">{comp.competitor_institution}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-400/5 border border-cyan-400/10">
          <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-cyan-400/70 uppercase tracking-wider">\u042D\u043A\u0432\u0438\u0432\u0430\u043B\u0435\u043D\u0442 \u0421\u041A\u041E\u041B\u041A\u041E\u0412\u041E</p>
            <p className="text-xs font-heading font-medium text-cyan-400">{comp.skolkovo_equivalent}</p>
          </div>
        </div>
      </div>

      {/* Analysis items */}
      <div className="space-y-3">
        {comp.advantage && (
          <div className="flex items-start gap-2">
            <ComparisonIndicator type="advantage" />
            <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{comp.advantage}</p>
          </div>
        )}
        {comp.gap && (
          <div className="flex items-start gap-2">
            <ComparisonIndicator type="gap" />
            <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{comp.gap}</p>
          </div>
        )}
        {comp.overlap && (
          <div className="flex items-start gap-2">
            <ComparisonIndicator type="overlap" />
            <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{comp.overlap}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SkolkovoComparisonSection({ comparisons }: { comparisons: SkolkovoComparison[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? comparisons : comparisons.slice(0, 6);

  // Summary stats
  const withAdvantage = comparisons.filter(c => c.advantage && c.advantage.length > 0).length;
  const withGap = comparisons.filter(c => c.gap && c.gap.length > 0).length;
  const withOverlap = comparisons.filter(c => c.overlap && c.overlap.length > 0).length;

  // Unique SKOLKOVO programs referenced
  const skolkovoPrograms = [...new Set(comparisons.map(c => c.skolkovo_equivalent))];

  return (
    <section className="py-6 sm:py-10">
      <div className="container">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0430\u043D\u0430\u043B\u0438\u0437</span>
        </div>
        <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-2">
          \u0421\u041A\u041E\u041B\u041A\u041E\u0412\u041E: \u0421\u0440\u0430\u0432\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0430\u043D\u0430\u043B\u0438\u0437
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          \u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u043D\u044B\u0445 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u043E\u0432 \u0441 \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u0435\u043C AI/\u0446\u0438\u0444\u0440\u043E\u0432\u044B\u0445 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C \u0428\u043A\u043E\u043B\u044B \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0421\u041A\u041E\u041B\u041A\u041E\u0412\u041E.
          \u041F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u0430, \u0440\u0430\u0437\u0440\u044B\u0432\u044B \u0438 \u043F\u0435\u0440\u0435\u0441\u0435\u0447\u0435\u043D\u0438\u044F \u0441 \u043C\u0438\u0440\u043E\u0432\u044B\u043C\u0438 \u043B\u0438\u0434\u0435\u0440\u0430\u043C\u0438 \u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u044F.
        </p>

        {/* Summary stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0439</span>
            </div>
            <span className="text-xl font-heading font-bold text-foreground">{comparisons.length}</span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <span className="text-xs text-muted-foreground">\u0423\u0433\u0440\u043E\u0437\u044B</span>
            </div>
            <span className="text-xl font-heading font-bold text-foreground">{withAdvantage}</span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0438</span>
            </div>
            <span className="text-xl font-heading font-bold text-foreground">{withGap}</span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">\u041F\u0435\u0440\u0435\u0441\u0435\u0447\u0435\u043D\u0438\u044F</span>
            </div>
            <span className="text-xl font-heading font-bold text-foreground">{withOverlap}</span>
          </div>
        </div>

        {/* SKOLKOVO benchmark programs */}
        <div className="bg-card/40 backdrop-blur-sm border border-cyan-400/10 rounded-xl p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-heading font-semibold text-cyan-400">\u0411\u0435\u043D\u0447\u043C\u0430\u0440\u043A-\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u0421\u041A\u041E\u041B\u041A\u041E\u0412\u041E</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skolkovoPrograms.map((prog, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-medium bg-cyan-400/5 text-cyan-400/90 border border-cyan-400/15"
              >
                {prog}
              </span>
            ))}
          </div>
        </div>

        {/* Comparison cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {displayed.map((comp, idx) => (
            <SkolkovoComparisonCard key={idx} comp={comp} />
          ))}
        </div>

        {/* Show more button */}
        {comparisons.length > 6 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40 border border-border/30 transition-all duration-200"
            >
              {showAll ? "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435" : `\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432\u0441\u0435 (${comparisons.length})`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Main Page ── */
export default function Education() {
  const [data, setData] = useState<EducationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  useEffect(() => {
    document.title = "AI Education Monitor \u2014 Business Schools";
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
          <p className="text-sm text-muted-foreground">\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445...</p>
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
          <h2 className="text-lg font-heading font-semibold mb-2">\u0414\u0430\u043D\u043D\u044B\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B</h2>
          <p className="text-sm text-muted-foreground mb-4">
            \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043E\u0442\u0447\u0451\u0442 Education Monitor. {error && `\u041E\u0448\u0438\u0431\u043A\u0430: ${error}`}
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            \u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E
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

  const skolkovoComparisons = data.skolkovo_comparison || [];

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
                  Business Schools \u2014 {formattedDate}
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
            <span className="sm:hidden">\u0413\u043B\u0430\u0432\u043D\u0430\u044F</span>
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
                \u041C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433 AI/ML \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C \u0432\u0435\u0434\u0443\u0449\u0438\u0445 \u0431\u0438\u0437\u043D\u0435\u0441-\u0448\u043A\u043E\u043B \u043C\u0438\u0440\u0430
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                \u041E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u043D\u0438\u0435 \u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C \u043F\u043E \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u043C\u0443 \u0438\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443, \u043C\u0430\u0448\u0438\u043D\u043D\u043E\u043C\u0443 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044E \u0438 \u0446\u0438\u0444\u0440\u043E\u0432\u043E\u0439 \u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438
                \u0432 \u0432\u0435\u0434\u0443\u0449\u0438\u0445 \u0431\u0438\u0437\u043D\u0435\u0441-\u0448\u043A\u043E\u043B\u0430\u0445 \u043C\u0438\u0440\u0430. \u0422\u0440\u0435\u043D\u0434\u044B, \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u043D\u044B\u0435 \u0441\u0438\u0433\u043D\u0430\u043B\u044B, \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430 \u0438 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0441\u043E \u0421\u041A\u041E\u041B\u041A\u041E\u0412\u041E.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              <StatCard icon={GraduationCap} value={data.meta.total_programs} label="\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C" accent="bg-primary/15" />
              <StatCard icon={TrendingUp} value={data.meta.total_trends} label="\u0422\u0440\u0435\u043D\u0434\u043E\u0432" accent="bg-amber-400/15" />
              <StatCard icon={AlertTriangle} value={data.meta.total_signals} label="\u0421\u0438\u0433\u043D\u0430\u043B\u043E\u0432" accent="bg-red-400/15" />
              <StatCard icon={Globe} value={regionKeys.length} label="\u0420\u0435\u0433\u0438\u043E\u043D\u043E\u0432" accent="bg-purple-400/15" />
              <StatCard icon={Building2} value={skolkovoComparisons.length} label="\u0421\u041A\u041E\u041B\u041A\u041E\u0412\u041E \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0439" accent="bg-cyan-400/15" />
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
              <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B</span>
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-4">
              \u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u043F\u043E \u0440\u0435\u0433\u0438\u043E\u043D\u0430\u043C
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
                \u0412\u0441\u0435 \u0440\u0435\u0433\u0438\u043E\u043D\u044B
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

        {/* ── SKOLKOVO Comparison ── */}
        {skolkovoComparisons.length > 0 && (
          <SkolkovoComparisonSection comparisons={skolkovoComparisons} />
        )}

        {/* ── Trends ── */}
        <section className="py-6 sm:py-10">
          <div className="container">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">\u0422\u0440\u0435\u043D\u0434\u044B</span>
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-4">
              \u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0442\u0440\u0435\u043D\u0434\u044B
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
              <span className="text-[10px] font-mono text-amber-400/60 uppercase tracking-widest">\u0421\u0438\u0433\u043D\u0430\u043B\u044B</span>
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-4">
              \u041A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u043D\u044B\u0435 \u0441\u0438\u0433\u043D\u0430\u043B\u044B
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
                  <span className="text-xs font-heading font-semibold text-muted-foreground">\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F</span>
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
              AI Education Monitor \u2014 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E {formattedDate}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              \u2190 AI Strategic Intelligence
            </Link>
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              \u0414\u0430\u043D\u043D\u044B\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u044E\u0442\u0441\u044F 3 \u0440\u0430\u0437\u0430 \u0432 \u0434\u0435\u043D\u044C
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
