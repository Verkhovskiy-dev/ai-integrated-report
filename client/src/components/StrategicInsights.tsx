/*
 * DESIGN: Intelligence Dashboard — Strategic Insights
 * Expandable insight cards with evidence, conclusions, and education implications
 * Mobile-first responsive design
 * Now includes native SKOLKOVO program links in education sections
 * Supports dynamic insights from insights.json with static fallback
 * i18n support
 * Role-based filtering with 6 professional roles
 */
import { useState, useMemo } from "react";
import {
  Building, Bot, Landmark, Brain, ShieldAlert, Layers, GraduationCap,
  ChevronDown, ChevronUp, Lightbulb, BookOpen, AlertTriangle,
  Zap, Globe, Shield, TrendingUp, Database, RefreshCw,
  Users, Briefcase, Code2, BarChart3, UserCog, Heart,
} from "lucide-react";
import { type StrategicInsight } from "@/data/insightsData";
import { ProgramBadgeGroup } from "@/components/ProgramBadge";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useTranslation } from "@/contexts/I18nContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useExecutiveData } from "@/contexts/ExecutiveDataContext";

/* ------------------------------------------------------------------ */
/*  Role definitions & relevance mapping                               */
/* ------------------------------------------------------------------ */

export type RoleKey = "all" | "entrepreneur" | "ceo" | "manager" | "cto" | "product" | "hr";

interface RoleMeta {
  labelRu: string;
  labelEn: string;
  icon: typeof Briefcase;
  /** Keywords in insight text that signal relevance to this role */
  keywords: RegExp;
  /** Accent colour (tailwind-compatible) */
  color: string;
}

const ROLES: Record<RoleKey, RoleMeta> = {
  all: {
    labelRu: "Все роли",
    labelEn: "All Roles",
    icon: Users,
    keywords: /./i, // matches everything
    color: "primary",
  },
  entrepreneur: {
    labelRu: "Предприниматель",
    labelEn: "Entrepreneur",
    icon: Briefcase,
    keywords: /рынок|market|бизнес|business|стоимост|value|капитал|capital|инвестиц|invest|конкурен|compet|стратег|strateg|масштаб|scale|startup|стартап|предприним|entrepren|маржа|margin|revenue|выручк|клиент|customer|продаж|sales|прибыл|profit|экономик|econom|цепочк.*стоимост|value.?chain|lock.?in|консолидац|consolidat/i,
    color: "amber",
  },
  ceo: {
    labelRu: "CEO",
    labelEn: "CEO",
    icon: BarChart3,
    keywords: /стратег|strateg|управлен|manag|governance|регулир|regulat|compliance|комплаенс|институт|institut|государств|govern|фискал|fiscal|трансформац|transform|цепочк|chain|позиц|position|контрол|control|стоимост|value|капитал|capital|инфраструктур|infrastruct|вертикальн|vertical|интеграц|integrat|риск|risk|CEO|C-level|руковод|leader|безопасност|security|агент|agent|AI|ИИ/i,
    color: "cyan",
  },
  manager: {
    labelRu: "Менеджер",
    labelEn: "Manager",
    icon: UserCog,
    keywords: /управлен|manag|процесс|process|команд|team|операцион|operat|эффективност|efficien|ROI|внедрен|implement|пилот|pilot|use.?case|кейс|case|проект|project|оптимиз|optimiz|автоматиз|automat|масштаб|scale|KPI|метрик|metric|продуктивност|productiv/i,
    color: "neon-green",
  },
  cto: {
    labelRu: "CTO",
    labelEn: "CTO",
    icon: Code2,
    keywords: /технолог|technolog|инфраструктур|infrastruct|архитектур|architect|платформ|platform|API|MCP|агент|agent|модел|model|compute|вычислен|чип|chip|память|memory|HBM|GPU|безопасност|security|DevOps|MLOps|open.?source|open.?weight|дата.?центр|data.?center|компилятор|compiler|kernel|верификац|verif|tool|инструмент|фреймворк|framework|стек|stack|железн|hardware/i,
    color: "magenta",
  },
  product: {
    labelRu: "Продакт",
    labelEn: "Product Manager",
    icon: Lightbulb,
    keywords: /продукт|product|пользовател|user|UX|интерфейс|interface|фич|feature|клиент|customer|рынок|market|монетизац|monetiz|платформ|platform|данн|data|контекст|context|персонализац|personaliz|lock.?in|экосистем|ecosystem|SaaS|приложен|app|сервис|service|use.?case|кейс|case/i,
    color: "amber",
  },
  hr: {
    labelRu: "HR",
    labelEn: "HR",
    icon: Heart,
    keywords: /образован|educat|компетенц|competen|кадр|talent|профессион|profession|труд|labor|занятост|employ|переподготовк|retrain|навык|skill|обучен|train|курс|course|программ.*подготовк|training.?program|сокращен|layoff|рынок.*труда|labor.?market|Agent.?Ops|DevOps|специалист|specialist|дефицит|shortage|наём|hiring/i,
    color: "magenta",
  },
};

const ROLE_KEYS: RoleKey[] = ["all", "entrepreneur", "ceo", "manager", "cto", "product", "hr"];

/**
 * Role-specific framing for the "education implication" section.
 * Returns a short contextual line prepended to the original educationImplication.
 */
function getRoleTakeaway(role: RoleKey, insight: StrategicInsight, isEn: boolean): string | null {
  if (role === "all") return null;

  const text = `${insight.title} ${insight.subtitle} ${insight.summary} ${insight.nonObviousConclusion}`.toLowerCase();

  const takeaways: Record<Exclude<RoleKey, "all">, { ru: string; en: string }[]> = {
    entrepreneur: [
      { ru: "💡 Для предпринимателя: оцените, как этот сдвиг меняет вашу цепочку создания ценности и где открываются новые ниши.", en: "💡 For entrepreneurs: assess how this shift changes your value chain and where new niches are emerging." },
    ],
    ceo: [
      { ru: "🎯 Для CEO: этот инсайт требует стратегического пересмотра позиционирования компании и управления рисками.", en: "🎯 For CEOs: this insight calls for a strategic reassessment of company positioning and risk management." },
    ],
    manager: [
      { ru: "⚙️ Для менеджера: определите конкретные процессы и use-cases, которые можно трансформировать с учётом этого тренда.", en: "⚙️ For managers: identify specific processes and use-cases that can be transformed based on this trend." },
    ],
    cto: [
      { ru: "🔧 Для CTO: оцените технологический стек и инфраструктурные решения в свете этого структурного сдвига.", en: "🔧 For CTOs: evaluate your technology stack and infrastructure decisions in light of this structural shift." },
    ],
    product: [
      { ru: "🚀 Для продакт-менеджера: этот тренд влияет на roadmap — пересмотрите приоритеты фич и стратегию монетизации.", en: "🚀 For product managers: this trend impacts your roadmap — reassess feature priorities and monetization strategy." },
    ],
    hr: [
      { ru: "👥 Для HR: этот сдвиг формирует новые требования к компетенциям — пересмотрите программы развития и найма.", en: "👥 For HR: this shift creates new competency requirements — reassess development and hiring programs." },
    ],
  };

  const options = takeaways[role];
  return options ? (isEn ? options[0].en : options[0].ru) : null;
}

/**
 * Score how relevant an insight is to a given role.
 * Higher score = more relevant.
 */
function scoreInsightForRole(insight: StrategicInsight, role: RoleKey): number {
  if (role === "all") return 1;
  const meta = ROLES[role];
  const corpus = [
    insight.title,
    insight.subtitle,
    insight.summary,
    ...insight.evidence,
    insight.nonObviousConclusion,
    insight.educationImplication,
  ].join(" ");

  const matches = corpus.match(meta.keywords);
  return matches ? matches.length : 0;
}

/* ------------------------------------------------------------------ */
/*  ICON_MAP                                                           */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, typeof Building> = {
  Building, Bot, Landmark, Brain, ShieldAlert, Layers, GraduationCap,
  Zap, Globe, Shield, TrendingUp, Database,
};

/* ------------------------------------------------------------------ */
/*  InsightCard                                                        */
/* ------------------------------------------------------------------ */

function InsightCard({ insight, isExpanded, onToggle, isEn, role, isExecutive, executiveAdvice }: {
  insight: StrategicInsight;
  isExpanded: boolean;
  onToggle: () => void;
  isEn: boolean;
  role: RoleKey;
  isExecutive: boolean;
  executiveAdvice?: { ceo: string; cto: string; cdo: string } | null;
}) {
  const Icon = ICON_MAP[insight.icon] || Lightbulb;
  const roleTakeaway = getRoleTakeaway(role, insight, isEn);

  return (
    <div
      className={`
        bg-card/60 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-400
        ${isExpanded ? "border-primary/40 glow-cyan" : "border-border/50 hover:border-border"}
      `}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-3 sm:gap-4"
      >
        {/* Icon */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: `${insight.accentColor}15`,
            borderColor: `${insight.accentColor}30`,
          }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: insight.accentColor }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Number badge */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                color: insight.accentColor,
                borderColor: `${insight.accentColor}40`,
                backgroundColor: `${insight.accentColor}10`,
              }}
            >
              {isEn ? "Insight" : "Инсайт"} {insight.id}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm sm:text-base font-heading font-bold text-foreground leading-snug mb-1">
            {insight.title}
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
            {insight.subtitle}
          </p>
        </div>

        {/* Expand icon */}
        <div className="shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Summary — always visible */}
      <div className="px-4 sm:px-5 pb-3 sm:pb-4">
        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
          {insight.summary}
        </p>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/30">
          {/* Evidence */}
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: insight.accentColor }} />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {isEn ? "Evidence Base" : "Доказательная база"}
              </span>
            </div>
            <ul className="space-y-1.5">
              {insight.evidence.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary/50 mt-1 shrink-0 text-[8px]">●</span>
                  <span className="text-xs sm:text-sm text-foreground/70 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Non-obvious conclusion */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 bg-amber-400/5 border-t border-amber-400/10">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono text-amber-400/80 uppercase tracking-wider">
                {isEn ? "Non-Obvious Conclusion" : "Неочевидный вывод"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              {insight.nonObviousConclusion}
            </p>
          </div>

          {/* Role-specific takeaway (shown when a specific role is selected) */}
          {roleTakeaway && (
            <div className="px-4 sm:px-5 py-3 sm:py-4 bg-cyan-400/5 border-t border-cyan-400/10">
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                {roleTakeaway}
              </p>
            </div>
          )}

          {/* Executive role-based advice ("Что это значит для вас") */}
          {isExecutive && executiveAdvice && (
            <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-amber-500/5 to-cyan-500/5 border-t border-amber-400/15">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-mono text-amber-400/80 uppercase tracking-wider">
                  {isEn ? "What This Means for You" : "Что это значит для вас"}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">CEO</span>
                  <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">{executiveAdvice.ceo}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">CTO</span>
                  <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">{executiveAdvice.cto}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">CDO</span>
                  <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">{executiveAdvice.cdo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Education implication with program links */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 bg-primary/5 border-t border-primary/10">
            <div className="flex items-center gap-2 mb-2.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-primary/80 uppercase tracking-wider">
                {isEn ? "For Educational Programs" : "Для образовательных программ"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              {insight.educationImplication}
            </p>
            {/* Program links */}
            {insight.relevantPrograms && insight.relevantPrograms.length > 0 && (
              <ProgramBadgeGroup
                programKeys={insight.relevantPrograms}
                label={isEn ? "Programs →" : "Программы →"}
                compact={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RoleSwitcher                                                       */
/* ------------------------------------------------------------------ */

function RoleSwitcher({
  activeRole,
  onRoleChange,
  isEn,
}: {
  activeRole: RoleKey;
  onRoleChange: (role: RoleKey) => void;
  isEn: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {ROLE_KEYS.map((key) => {
        const meta = ROLES[key];
        const RIcon = meta.icon;
        const isActive = activeRole === key;
        return (
          <button
            key={key}
            onClick={() => onRoleChange(key)}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2
              rounded-lg text-[11px] sm:text-xs font-medium
              border transition-all duration-200
              ${isActive
                ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                : "bg-card/40 border-border/40 text-muted-foreground hover:border-border hover:text-foreground hover:bg-card/60"
              }
            `}
          >
            <RIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{isEn ? meta.labelEn : meta.labelRu}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function StrategicInsights() {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [activeRole, setActiveRole] = useState<RoleKey>("all");
  const { strategicInsights, insightsPeriod, insightsGeneratedAt, insightsLive } = useLiveData();
  const { locale } = useTranslation();
  const { isExecutive } = useViewMode();
  const { getRoleAdvice } = useExecutiveData();
  const isEn = locale === "en";

  // Filter and sort insights by role relevance
  const filteredInsights = useMemo(() => {
    if (activeRole === "all") return strategicInsights;

    // Score each insight for the selected role
    const scored = strategicInsights.map((insight) => ({
      insight,
      score: scoreInsightForRole(insight, activeRole),
    }));

    // Filter out insights with zero relevance, then sort by score descending
    const relevant = scored.filter((s) => s.score > 0);

    // If nothing matches (unlikely), show all
    if (relevant.length === 0) return strategicInsights;

    return relevant
      .sort((a, b) => b.score - a.score)
      .map((s) => s.insight);
  }, [strategicInsights, activeRole]);

  // Format generated date for display
  const generatedLabel = insightsGeneratedAt
    ? new Date(insightsGeneratedAt).toLocaleDateString(isEn ? "en-US" : "ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="container">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">
            {isEn ? "Strategic Insights" : "Стратегические инсайты"}
          </p>
          {insightsLive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              <RefreshCw className="w-2.5 h-2.5" />
              live
            </span>
          )}
        </div>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">
          {isEn
            ? `${strategicInsights.length} Key Conclusions of the Period`
            : `${strategicInsights.length} ключевых выводов периода`}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {insightsPeriod || (isEn
            ? "Structural insights that go beyond individual news and reflect deep shifts in who controls key value creation nodes in the AI economy."
            : "Структурные инсайты, выходящие за рамки отдельных новостей и отражающие глубинные сдвиги в том, кто контролирует ключевые узлы создания ценности в AI-экономике.")}
        </p>
        {generatedLabel && (
          <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">
            {isEn ? "Updated:" : "Обновлено:"} {generatedLabel}
          </p>
        )}
      </div>

      {/* Role Switcher */}
      <div className="mb-5 sm:mb-6">
        <p className="text-[10px] sm:text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2">
          {isEn ? "View by Role" : "Фильтр по роли"}
        </p>
        <RoleSwitcher activeRole={activeRole} onRoleChange={setActiveRole} isEn={isEn} />
        {activeRole !== "all" && (
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-2">
            {isEn
              ? `Showing ${filteredInsights.length} of ${strategicInsights.length} insights most relevant for ${ROLES[activeRole].labelEn}`
              : `${filteredInsights.length} из ${strategicInsights.length} инсайтов, наиболее релевантных для роли «${ROLES[activeRole].labelRu}»`}
          </p>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            isExpanded={expandedId === insight.id}
            onToggle={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
            isEn={isEn}
            role={activeRole}
            isExecutive={isExecutive}
            executiveAdvice={isExecutive ? getRoleAdvice(insight.id) : null}
          />
        ))}
      </div>
    </div>
  );
}
