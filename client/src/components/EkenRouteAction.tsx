import { useState } from "react";
import { AlertTriangle, ArrowRight, Check, Copy, Download, LoaderCircle, Route, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEkenRoutes } from "@/contexts/EkenRoutesContext";
import {
  buildLocalLearningRoutePlan,
  buildLearningBriefDraft,
  buildExecutiveRoleTrackDraft,
  buildLearningRoutePayload,
  findDashboardScenario,
  LEARNING_INTENT_COPY,
  learningOutcomeForIntent,
  retargetLearningBriefDraft,
  type DashboardRouteSource,
  type LearningBriefDraft,
  type LocalLearningRoutePlan,
  type LearningRouteIntent,
  type EkenLearningRouteV2,
} from "@/data/ekenScenarioRoutes";
import { buildEkenCompatibilityUrl, createEkenHandoff, HandoffServiceError } from "@/data/ekenIntegrationUrl";

interface EkenRouteActionProps extends DashboardRouteSource {
  compact?: boolean;
  className?: string;
  entryLabel?: string;
  trackRole?: "CEO" | "CTO" | "CDO";
  trackRecommendation?: string;
}

export default function EkenRouteAction({ compact = false, className = "", entryLabel, trackRole, trackRecommendation, ...source }: EkenRouteActionProps) {
  const { registry } = useEkenRoutes();
  const baseScenario = findDashboardScenario(registry, source);
  const scenario = trackRole
    ? {
        ...baseScenario,
        role: trackRole,
        recipientRole: trackRole,
        promise: `Превратить рекомендацию для ${trackRole} в решение и первый проверяемый шаг`,
      }
    : baseScenario;
  const buildInitialDraft = () => {
    if (trackRole) {
      return buildExecutiveRoleTrackDraft(
        source,
        scenario,
        trackRole,
        trackRecommendation || source.sourceText || source.sourceName,
      );
    }
    return buildLearningBriefDraft(source, scenario);
  };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LearningBriefDraft>(buildInitialDraft);
  const [plan, setPlan] = useState<LocalLearningRoutePlan | null>(null);
  const [payload, setPayload] = useState<EkenLearningRouteV2 | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"preview" | "creating" | "redirecting" | "failed-retryable" | "failed-service">("preview");
  const isInsightDecision = source.surface === "dashboard-insight";
  const isRoleTrack = Boolean(trackRole);
  const triggerLabel = entryLabel ?? (isInsightDecision
    ? "Подготовить решение"
    : source.surface === "dashboard-trend"
      ? "Проверить влияние"
      : source.surface === "dashboard-shift"
        ? "Спроектировать манёвр"
        : "Собрать маршрут");

  const update = <K extends keyof LearningBriefDraft>(key: K, value: LearningBriefDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const startRoute = () => {
    const analytics = (window as Window & {
      umami?: { track: (event: string, data?: Record<string, string | number>) => void };
    }).umami;
    analytics?.track("handoff_confirmed", {
      surface: scenario.surface,
      scenario: scenario.scenarioId,
      source: scenario.sourceId,
      minutes: scenario.estimatedMinutes,
    });
    try {
      setPayload(buildLearningRoutePayload(source, scenario, draft));
      setPlan(buildLocalLearningRoutePlan(source, scenario, draft));
      setStatus("preview");
    } catch {
      analytics?.track("handoff_failed", {
        surface: scenario.surface,
        scenario: scenario.scenarioId,
        reason: "payload-validation",
      });
      setStatus("failed-service");
    }
  };

  const copyPlan = async () => {
    if (!plan) return;
    await navigator.clipboard.writeText(plan.text);
    setCopied(true);
    (window as Window & { umami?: { track: (event: string, data?: Record<string, string>) => void } }).umami
      ?.track("handoff_fallback_copied", { scenario: scenario.scenarioId });
  };

  const downloadPlan = () => {
    if (!plan) return;
    const blobUrl = URL.createObjectURL(new Blob([plan.text], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `verkhovskiy-route-${scenario.sourceId.replace(/[^a-z0-9_-]+/gi, "-")}.md`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  const openCompatibilityRoute = () => {
    if (!payload) return;
    window.open(buildEkenCompatibilityUrl({
      routeId: payload.routeId,
      scenarioId: payload.scenarioId,
      sourceId: payload.source.sourceId,
      surface: payload.source.surface,
    }), "_blank", "noopener,noreferrer");
  };

  const continueToEken = async () => {
    if (!payload || status === "creating" || status === "redirecting") return;
    const analytics = (window as Window & {
      umami?: { track: (event: string, data?: Record<string, string | number>) => void };
    }).umami;
    setStatus("creating");
    try {
      const handoff = await createEkenHandoff(payload);
      analytics?.track("handoff_created", {
        surface: scenario.surface,
        scenario: scenario.scenarioId,
        source: scenario.sourceId,
        intent: draft.intent,
      });
      setStatus("redirecting");
      analytics?.track("handoff_redirect_started", {
        scenario: scenario.scenarioId,
        source: scenario.sourceId,
      });
      window.open(handoff.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      const retryable = error instanceof HandoffServiceError && error.kind === "network";
      setStatus(retryable ? "failed-retryable" : "failed-service");
      analytics?.track("handoff_failed", {
        scenario: scenario.scenarioId,
        reason: error instanceof HandoffServiceError ? error.kind : "unknown",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const nextDraft = buildInitialDraft();
          setDraft(nextDraft);
          setStatus("preview");
          if (trackRole) {
            try {
              setPayload(buildLearningRoutePayload(source, scenario, nextDraft));
              setPlan(buildLocalLearningRoutePlan(source, scenario, nextDraft));
            } catch {
              setPayload(null);
              setPlan(null);
              setStatus("failed-service");
            }
          } else {
            setPlan(null);
            setPayload(null);
          }
          setCopied(false);
          setOpen(true);
          (window as Window & { umami?: { track: (event: string, data?: Record<string, string>) => void } }).umami
            ?.track("handoff_preview_opened", { scenario: scenario.scenarioId, source: scenario.sourceId });
        }}
        className={`group/eken inline-flex items-center gap-1.5 rounded-md border border-violet-400/25 bg-violet-400/[0.07] text-violet-200 transition-colors hover:border-violet-300/50 hover:bg-violet-400/[0.13] ${compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[10px] sm:text-xs"} ${className}`}
        title={`Результат: ${scenario.artifact}`}
        aria-label={`${scenario.promise}. Результат: ${scenario.artifact}. ${scenario.estimatedMinutes} минут`}
        data-eken-source={scenario.sourceId}
        data-eken-surface={scenario.surface}
      >
        <Route className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>{triggerLabel}{isRoleTrack ? "" : ` · ${scenario.estimatedMinutes} мин`}</span>
        <ArrowRight className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} opacity-60 transition-transform group-hover/eken:translate-x-0.5`} />
      </button>

      <DialogContent
        className={`max-h-[92vh] overflow-y-auto border-violet-400/20 bg-[#0b1020]/95 text-slate-100 backdrop-blur-xl ${isRoleTrack ? "sm:max-w-lg" : "sm:max-w-2xl"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
            <Sparkles className="h-4 w-4" /> {isRoleTrack ? "Переход в Eken" : isInsightDecision ? "Инсайт → бриф решения" : "Verkhovskiy.ai → EkenLab"}
          </div>
          <DialogTitle className="text-xl text-white">
            {isRoleTrack ? `Продолжить как ${trackRole}` : isInsightDecision ? "Превратить инсайт в решение" : "Короткий бриф на рабочий AI-инструмент"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isRoleTrack
              ? "Роль и результат уже определены. Проверьте их и откройте готовый трек — ничего заполнять не нужно."
              : isInsightDecision
              ? `За ${scenario.estimatedMinutes} минут сформулируйте одно решение, назовите адресата и способ проверить эффект. На выходе — ${scenario.artifact}.`
              : "Проверьте три поля. Полный технический контракт будет собран автоматически и передан в EkenLab."}
          </DialogDescription>
        </DialogHeader>

        {isRoleTrack && plan ? (
          <div className="grid gap-4 py-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-md bg-violet-400/15 px-2 py-1 text-xs font-semibold text-violet-200">{trackRole}</span>
                <span className="text-xs text-slate-400">{scenario.estimatedMinutes} минут</span>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-emerald-300">Что сделает {trackRole}</p>
              <p className="mt-2 text-sm leading-6 text-white">{trackRecommendation || draft.objective}</p>
              <p className="mt-3 text-xs leading-5 text-emerald-50/65">На выходе: {scenario.artifact}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
              <p><strong className="text-white">В Eken перейдут:</strong> этот инсайт, рекомендация для {trackRole}, роль и ожидаемый результат.</p>
              <p className="mt-1 text-xs text-slate-500">Ничего заполнять не нужно. Текст не попадёт в URL.</p>
            </div>

            <div aria-live="polite" className="min-h-5 text-xs text-slate-300">
              {status === "creating" && "Создаём трек в Eken…"}
              {status === "redirecting" && "Открываем Eken в новой вкладке…"}
              {status === "failed-retryable" && "Не удалось связаться с Eken. Можно повторить или скопировать бриф."}
              {status === "failed-service" && "Eken пока не принял контекст. Бриф остался здесь."}
            </div>

            {(status === "failed-retryable" || status === "failed-service") && (
              <div className="grid gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs text-amber-100/80">
                <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Контекст не потерян.</span>
                <button type="button" onClick={copyPlan} className="min-h-11 rounded-lg border border-amber-200/20 px-3 text-amber-100 hover:bg-amber-200/10">
                  {copied ? "Бриф скопирован" : "Скопировать бриф"}
                </button>
                <button type="button" onClick={openCompatibilityRoute} className="min-h-11 rounded-lg border border-amber-200/20 px-3 text-amber-100 hover:bg-amber-200/10">
                  Открыть Eken без переноса контекста
                </button>
              </div>
            )}

            <button type="button" disabled={!payload || status === "creating" || status === "redirecting"} onClick={continueToEken} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 disabled:cursor-wait disabled:opacity-50">
              {(status === "creating" || status === "redirecting") && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {status === "failed-retryable" ? "Повторить" : `Открыть трек ${trackRole} в Eken`} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : plan ? (
          <div className="grid gap-4 py-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-300">{isRoleTrack ? `Старт трека ${trackRole} готов` : isInsightDecision ? "Бриф решения готов" : "Маршрут готов"}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{plan.title}</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">На выходе: {plan.outcome}</p>
            </div>

            <dl className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs sm:grid-cols-2">
              <div><dt className="text-slate-500">Источник</dt><dd className="mt-1 text-slate-200">{scenario.sourceName}</dd></div>
              <div><dt className="text-slate-500">Роль</dt><dd className="mt-1 text-slate-200">{source.audienceRole ?? scenario.role}</dd></div>
              <div><dt className="text-slate-500">Адресат</dt><dd className="mt-1 text-slate-200">{scenario.recipientRole}</dd></div>
              <div><dt className="text-slate-500">Время</dt><dd className="mt-1 text-slate-200">{scenario.estimatedMinutes} минут</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500">Критерий приёмки</dt><dd className="mt-1 text-slate-200">{draft.successCriterion}</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500">Передадим в EkenLab</dt><dd className="mt-1 text-slate-200">Источник, роль, цель, ожидаемый артефакт, критерий и доказательства из выбранной карточки. Контактные данные не передаются.</dd></div>
            </dl>

            <div className="grid gap-2">
              {plan.steps.map((step, index) => (
                <div key={step.title} className="grid grid-cols-[32px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-400/30 bg-violet-400/10 text-xs font-semibold text-violet-200">{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div aria-live="polite" className="min-h-5 text-xs text-slate-300">
              {status === "creating" && "Готовим защищённый переход…"}
              {status === "redirecting" && "Открываем EkenLab в новой вкладке…"}
              {status === "failed-retryable" && "Не удалось подключиться к EkenLab. Бриф сохранён — можно повторить."}
              {status === "failed-service" && "EkenLab сейчас недоступен или не принял бриф. Продолжите с локальной копией."}
            </div>

            {(status === "failed-retryable" || status === "failed-service") && (
              <div className="grid gap-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-100/80">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Техническая ошибка не затронула заполненный preview.
                </div>
                <button type="button" onClick={openCompatibilityRoute} className="min-h-11 rounded-lg border border-amber-200/20 px-3 text-amber-100 hover:bg-amber-200/10">
                  Открыть EkenLab без передачи брифа
                </button>
                <p className="text-[10px] text-amber-100/55">Откроется новая вкладка только с техническими ID маршрута. Скопируйте бриф отдельно — заполненные поля и доказательства в URL не попадут.</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" disabled={!payload || status === "creating" || status === "redirecting"} onClick={continueToEken} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 disabled:cursor-wait disabled:opacity-50">
                {(status === "creating" || status === "redirecting") && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {status === "failed-retryable" ? "Повторить" : "Продолжить в EkenLab"} <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={copyPlan} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.05]">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Скопировано" : "Копировать"}
              </button>
              <button type="button" onClick={downloadPlan} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.05]">
                <Download className="h-4 w-4" /> Скачать .md
              </button>
            </div>
            <button type="button" onClick={() => setPlan(null)} className="text-xs text-slate-500 hover:text-slate-300">{isRoleTrack ? "Изменить старт трека" : isInsightDecision ? "Изменить бриф решения" : "Изменить короткий бриф"}</button>
          </div>
        ) : (
        <div className="grid gap-5 py-2">
          {!isInsightDecision && <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Зачем нужен маршрут</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(LEARNING_INTENT_COPY) as LearningRouteIntent[]).map((intent) => {
                const item = LEARNING_INTENT_COPY[intent];
                const selected = draft.intent === intent;
                return (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => setDraft((current) => retargetLearningBriefDraft(current, intent, scenario))}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${selected ? "border-violet-400/70 bg-violet-400/15" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-100">
                      {selected && <Check className="h-3.5 w-3.5 text-violet-300" />}{item.label}
                    </span>
                    <span className="mt-1 block text-[10px] leading-4 text-slate-500">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>}

          <label className="grid gap-2 text-xs font-medium text-slate-300">
            {isRoleTrack ? `Какой результат нужен в роли ${trackRole}?` : isInsightDecision ? "Какое решение нужно подготовить?" : "Что должен делать инструмент?"}
            <Textarea
              value={draft.objective}
              onChange={(event) => update("objective", event.target.value)}
              className="min-h-20 border-white/10 bg-white/[0.04] text-sm text-white"
            />
          </label>

          <label className="grid gap-2 text-xs font-medium text-slate-300">
            {isRoleTrack ? "На каком процессе или решении проверить?" : isInsightDecision ? "Какой процесс или контекст затронут?" : "Реальный пример для первой проверки"}
            <Textarea
              value={draft.realInput}
              onChange={(event) => update("realInput", event.target.value)}
              placeholder={isRoleTrack ? "Например: инвестиционный комитет, AI-платформа или политика данных" : isInsightDecision ? "Например: бюджет AI-инфраструктуры на 2027 год или решение о поставщике" : undefined}
              className="min-h-20 border-white/10 bg-white/[0.04] text-sm text-white"
            />
          </label>

          <label className="grid gap-2 text-xs font-medium text-slate-300">
            {isRoleTrack ? "Как понять, что первый шаг принят?" : isInsightDecision ? "Как получатель поймёт, что решение полезно?" : "Когда результат можно считать рабочим?"}
            <Textarea
              value={draft.successCriterion}
              onChange={(event) => update("successCriterion", event.target.value)}
              className="min-h-20 border-white/10 bg-white/[0.04] text-sm text-white"
            />
          </label>

          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3 text-xs leading-5 text-emerald-100/80">
            <strong className="text-emerald-200">На выходе:</strong> {isInsightDecision ? scenario.artifact : learningOutcomeForIntent(draft.intent, scenario)}.
            {!isInsightDecision && " Освоение подтверждается на указанном примере, а не просмотром материалов."}
          </div>

          <button
            type="button"
            disabled={!draft.objective.trim() || !draft.realInput.trim() || !draft.successCriterion.trim()}
            onClick={startRoute}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRoleTrack ? "Собрать старт трека" : isInsightDecision ? "Собрать бриф решения" : "Сформировать маршрут"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
