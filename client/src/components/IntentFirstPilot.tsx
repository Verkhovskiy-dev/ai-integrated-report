import { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Download, Rocket, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EkenRouteAction from "@/components/EkenRouteAction";
import {
  buildLocalPilotConfig,
  buildSampleRun,
  sampleRunToMarkdown,
  saveLocalPilot,
  type DownstreamIntent,
  type JobFamily,
  type PilotLocale,
  type PilotSignal,
  type UsefulnessChoice,
  type VagueIntentAnswers,
  type WorkFrequency,
} from "@/data/vagueIntentPilot";

interface IntentFirstPilotProps {
  signal: PilotSignal;
  locale: PilotLocale;
  compact?: boolean;
}

const COPY = {
  ru: {
    trigger: "Показать, какую работу можно ускорить",
    title: "Найдём полезную работу по текущему AI-сигналу",
    description: "Три коротких ответа — и сразу покажем пример результата. Без регистрации, модели и API.",
    family: "1. Какую повторяющуюся работу вы хотите ускорить?",
    intent: "2. Что должно произойти дальше?",
    frequency: "3. Как часто возникает такая задача?",
    show: "Показать пример на данных сводки",
    sample: "Пример готов",
    result: "На выходе",
    criterion: "Критерий полезности",
    usefulQuestion: "Это помогло понять следующий шаг?",
    save: "Сохранить как пилот",
    saved: "Пилот сохранён локально",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать .md",
    revise: "Изменить ответы",
    adjust: "Уточните ответы и снова проверьте пример — частичный результат пока не становится пилотом.",
    rejected: "Этот вариант не сохраняем и не передаём в Eken. Измените ответы и проверьте другую работу.",
    eken: "Хотите развить результат? EkenLab доступен после preview, но не обязателен.",
  },
  en: {
    trigger: "Show me which work can be accelerated",
    title: "Find useful work from a current AI signal",
    description: "Three short answers, then an immediate sample result. No sign-up, model, or API required.",
    family: "1. Which recurring job do you want to accelerate?",
    intent: "2. What should happen next?",
    frequency: "3. How often does this work occur?",
    show: "Show a sample using dashboard data",
    sample: "Sample ready",
    result: "Output",
    criterion: "Usefulness criterion",
    usefulQuestion: "Did this clarify the next step?",
    save: "Save as a pilot",
    saved: "Pilot saved locally",
    copy: "Copy",
    copied: "Copied",
    download: "Download .md",
    revise: "Change answers",
    adjust: "Refine the answers and test the sample again — a partial result is not a pilot yet.",
    rejected: "This option will not be saved or sent to Eken. Change the answers and test another job.",
    eken: "Want to develop the result? EkenLab is available after preview, but remains optional.",
  },
} as const;

const OPTIONS = {
  family: {
    ru: { strategy: "Готовить решения по AI для руководства", product: "Превращать сигналы в продуктовые гипотезы", operations: "Находить улучшения процессов", sales: "Адаптировать предложение и продажи", people: "Обновлять роли и навыки команды", technology: "Проверять инструменты на реальной задаче" },
    en: { strategy: "Prepare AI decisions for leadership", product: "Turn signals into product hypotheses", operations: "Find process improvements", sales: "Adapt offers and sales", people: "Update team roles and skills", technology: "Test tools on a real task" },
  },
  intent: {
    ru: { decision: "Принять решение", opportunity: "Проверить возможность", role: "Освоить новую роль", pilot: "Запустить пилот" },
    en: { decision: "Make a decision", opportunity: "Test an opportunity", role: "Enter a new role", pilot: "Launch a pilot" },
  },
  frequency: {
    ru: { daily: "Каждый день", weekly: "Каждую неделю", monthly: "Несколько раз в месяц" },
    en: { daily: "Daily", weekly: "Weekly", monthly: "A few times a month" },
  },
} as const;

export default function IntentFirstPilot({ signal, locale, compact = false }: IntentFirstPilotProps) {
  const text = COPY[locale];
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"questions" | "sample">("questions");
  const [answers, setAnswers] = useState<VagueIntentAnswers>({ jobFamily: "strategy", intent: "decision", frequency: "weekly" });
  const [usefulness, setUsefulness] = useState<UsefulnessChoice | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "copied" | "error">("idle");
  const [pilotSaved, setPilotSaved] = useState(false);
  const run = useMemo(() => buildSampleRun(signal, answers, locale), [signal, answers, locale]);
  const markdown = useMemo(() => sampleRunToMarkdown(run, locale), [run, locale]);

  const reset = () => {
    setStage("questions");
    setAnswers({ jobFamily: "strategy", intent: "decision", frequency: "weekly" });
    setUsefulness(null);
    setStatus("idle");
    setPilotSaved(false);
  };

  const save = () => {
    if (usefulness !== "useful") return;
    try {
      saveLocalPilot(localStorage, buildLocalPilotConfig(answers, signal, locale, usefulness));
      setStatus("saved");
      setPilotSaved(true);
    } catch {
      setStatus("error");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-signal-pilot-${signal.id.replace(/[^a-z0-9_-]+/gi, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) reset(); }}>
      <DialogTrigger asChild>
        <button type="button" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 font-medium text-emerald-200 hover:bg-emerald-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${compact ? "mt-2 px-2.5 py-1.5 text-[10px]" : "px-4 py-2.5 text-sm"}`}>
          <Sparkles className="h-3.5 w-3.5 shrink-0" /> {text.trigger}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-emerald-400/20 bg-[#0b1020] text-slate-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl text-white">{text.title}</DialogTitle>
          <DialogDescription className="text-slate-400">{text.description}</DialogDescription>
        </DialogHeader>

        {stage === "questions" ? (
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              {text.family}
              <select value={answers.jobFamily} onChange={(event) => setAnswers((current) => ({ ...current, jobFamily: event.target.value as JobFamily }))} className="min-h-11 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-white focus:ring-2 focus:ring-emerald-300">
                {(Object.keys(OPTIONS.family[locale]) as JobFamily[]).map((value) => <option key={value} value={value} className="bg-slate-900">{OPTIONS.family[locale][value]}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              {text.intent}
              <select value={answers.intent} onChange={(event) => setAnswers((current) => ({ ...current, intent: event.target.value as DownstreamIntent }))} className="min-h-11 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-white focus:ring-2 focus:ring-emerald-300">
                {(Object.keys(OPTIONS.intent[locale]) as DownstreamIntent[]).map((value) => <option key={value} value={value} className="bg-slate-900">{OPTIONS.intent[locale][value]}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              {text.frequency}
              <select value={answers.frequency} onChange={(event) => setAnswers((current) => ({ ...current, frequency: event.target.value as WorkFrequency }))} className="min-h-11 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-white focus:ring-2 focus:ring-emerald-300">
                {(Object.keys(OPTIONS.frequency[locale]) as WorkFrequency[]).map((value) => <option key={value} value={value} className="bg-slate-900">{OPTIONS.frequency[locale][value]}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setStage("sample")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
              {text.show} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-300">{text.sample}</p>
              <h3 className="mt-1 text-base font-semibold text-white">{signal.title}</h3>
              {run.observation && <p className="mt-2 border-l-2 border-emerald-300/40 pl-3 text-xs leading-5 text-slate-300">{run.observation}</p>}
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">{run.promise}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {run.lanes.map((lane) => (
                <article key={lane.kind} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-bold tracking-wider text-emerald-300">{lane.kind}</p>
                  <h4 className="mt-1 text-sm font-medium text-white">{lane.title}</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{lane.detail}</p>
                </article>
              ))}
            </div>
            <div className="rounded-lg border border-white/10 p-3 text-xs leading-5 text-slate-300">
              <p><strong className="text-white">{text.result}:</strong> {run.artifact}</p>
              <p className="mt-1"><strong className="text-white">{text.criterion}:</strong> {run.acceptanceCriterion}</p>
            </div>

            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-medium text-white">{text.usefulQuestion}</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["useful", "adjust", "not-useful"] as UsefulnessChoice[]).map((choice) => {
                  const label = locale === "en"
                    ? { useful: "Yes", adjust: "Partly", "not-useful": "No" }[choice]
                    : { useful: "Да", adjust: "Частично", "not-useful": "Нет" }[choice];
                  return <button key={choice} type="button" aria-pressed={usefulness === choice} onClick={() => { setUsefulness(choice); setStatus("idle"); setPilotSaved(false); }} className={`min-h-11 rounded-lg border px-2 text-sm ${usefulness === choice ? "border-emerald-300 bg-emerald-400/15 text-emerald-100" : "border-white/10 text-slate-300 hover:bg-white/[0.05]"}`}>{label}</button>;
                })}
              </div>
            </fieldset>

            <div className="grid gap-2 sm:grid-cols-3">
              <button type="button" disabled={usefulness !== "useful"} onClick={save} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"><Rocket className="h-4 w-4" />{text.save}</button>
              <button type="button" onClick={copy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/[0.05]">{status === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{status === "copied" ? text.copied : text.copy}</button>
              <button type="button" onClick={download} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/[0.05]"><Download className="h-4 w-4" />{text.download}</button>
            </div>
            <div aria-live="polite" className="min-h-5 text-xs text-emerald-300">
              {status === "saved" && text.saved}
              {status === "error" && (locale === "en" ? "Local saving is unavailable. Copy or download the result instead." : "Локальное сохранение недоступно. Скопируйте или скачайте результат.")}
              {usefulness === "adjust" && text.adjust}
              {usefulness === "not-useful" && text.rejected}
            </div>
            {(usefulness === "adjust" || usefulness === "not-useful") && (
              <button type="button" onClick={() => { setStage("questions"); setUsefulness(null); setStatus("idle"); setPilotSaved(false); }} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/[0.05]">
                {text.revise}
              </button>
            )}
            {pilotSaved && usefulness === "useful" && (
              <div className="border-t border-white/10 pt-3">
                <p className="mb-2 text-xs text-slate-500">{text.eken}</p>
                <EkenRouteAction compact surface="dashboard-focus" sourceId={signal.id} sourceName={signal.title} sourceText={signal.description} reportDate={signal.reportDate} level={8} locale={locale} />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
