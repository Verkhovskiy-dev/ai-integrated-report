export type PilotLocale = "ru" | "en";
export type JobFamily = "strategy" | "product" | "operations" | "sales" | "people" | "technology";
export type DownstreamIntent = "decision" | "opportunity" | "role" | "pilot";
export type WorkFrequency = "daily" | "weekly" | "monthly";
export type UsefulnessChoice = "useful" | "adjust" | "not-useful";

export interface PilotSignal {
  id: string;
  title: string;
  description: string;
  reportDate: string;
}

export interface VagueIntentAnswers {
  jobFamily: JobFamily;
  intent: DownstreamIntent;
  frequency: WorkFrequency;
}

export interface SampleRun {
  signal: PilotSignal;
  observation: string;
  promise: string;
  lanes: Array<{ kind: "ACT" | "VERIFY" | "WATCH" | "IGNORE"; title: string; detail: string }>;
  artifact: string;
  acceptanceCriterion: string;
}

export interface LocalPilotConfigV1 {
  schemaVersion: "1.0";
  pilotId: string;
  createdAt: string;
  locale: PilotLocale;
  answers: VagueIntentAnswers;
  source: Pick<PilotSignal, "id" | "reportDate">;
  snapshot: { signalTitle: string; artifact: string; acceptanceCriterion: string };
  usefulness: UsefulnessChoice;
}

export const LOCAL_PILOTS_KEY = "verkhovskiy.local-pilots.v1";

const familyNames: Record<PilotLocale, Record<JobFamily, string>> = {
  ru: { strategy: "стратегии", product: "продукте", operations: "операциях", sales: "продажах", people: "работе с людьми", technology: "технологиях" },
  en: { strategy: "strategy", product: "product", operations: "operations", sales: "sales", people: "people work", technology: "technology" },
};

export function buildSampleRun(signal: PilotSignal, answers: VagueIntentAnswers, locale: PilotLocale): SampleRun {
  const family = familyNames[locale][answers.jobFamily];
  const cadence = answers.frequency === "daily"
    ? (locale === "en" ? "today" : "сегодня")
    : answers.frequency === "weekly"
      ? (locale === "en" ? "this week" : "на этой неделе")
      : (locale === "en" ? "this month" : "в этом месяце");
  const intentArtifact: Record<DownstreamIntent, { ru: string; en: string }> = {
    decision: { ru: "decision brief с владельцем и критерием результата", en: "decision brief with an owner and acceptance criterion" },
    opportunity: { ru: "карта возможности с проверяемой гипотезой", en: "opportunity map with a testable hypothesis" },
    role: { ru: "карта новой роли и первого доказуемого действия", en: "new-role map and first demonstrable action" },
    pilot: { ru: "паспорт пилота с ограниченным риском", en: "bounded-risk pilot charter" },
  };
  const artifact = intentArtifact[answers.intent][locale];

  return {
    signal,
    observation: signal.description.replace(/\s+/g, " ").trim().slice(0, 240),
    promise: locale === "en"
      ? `Turn this signal into a useful result in ${family} ${cadence}.`
      : `Превратить этот сигнал в полезный результат в ${family} ${cadence}.`,
    lanes: [
      {
        kind: "ACT",
        title: locale === "en" ? "Prepare one bounded move" : "Подготовить один ограниченный манёвр",
        detail: locale === "en" ? `Create a ${artifact} for the affected process owner.` : `Собрать ${artifact} для владельца затронутого процесса.`,
      },
      {
        kind: "VERIFY",
        title: locale === "en" ? "Verify relevance" : "Проверить применимость",
        detail: locale === "en" ? "Check the source and one real example from your workflow before acting." : "Проверить источник и один реальный пример из своего процесса до действия.",
      },
      {
        kind: "WATCH",
        title: locale === "en" ? "Set a trigger" : "Поставить триггер",
        detail: locale === "en" ? "Revisit when the signal affects cost, quality, risk, or demand." : "Вернуться, когда сигнал затронет стоимость, качество, риск или спрос.",
      },
      {
        kind: "IGNORE",
        title: locale === "en" ? "Ignore deliberately" : "Осознанно отложить",
        detail: locale === "en" ? "Do not start work if no process owner or measurable effect can be named." : "Не начинать работу, если нельзя назвать владельца процесса или измеримый эффект.",
      },
    ],
    artifact,
    acceptanceCriterion: locale === "en"
      ? "A named owner chooses ACT, VERIFY, WATCH, or IGNORE and records the next trigger."
      : "Названный владелец выбирает ACT, VERIFY, WATCH или IGNORE и фиксирует следующий триггер.",
  };
}

export function buildLocalPilotConfig(
  answers: VagueIntentAnswers,
  signal: PilotSignal,
  locale: PilotLocale,
  usefulness: UsefulnessChoice,
  now = new Date(),
): LocalPilotConfigV1 {
  const snapshot = buildSampleRun(signal, answers, locale);
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    schemaVersion: "1.0",
    pilotId: `local-pilot-${suffix}`,
    createdAt: now.toISOString(),
    locale,
    answers,
    source: { id: signal.id, reportDate: signal.reportDate },
    snapshot: { signalTitle: signal.title, artifact: snapshot.artifact, acceptanceCriterion: snapshot.acceptanceCriterion },
    usefulness,
  };
}

export function readLocalPilots(storage: Pick<Storage, "getItem">): LocalPilotConfigV1[] {
  try {
    const value = JSON.parse(storage.getItem(LOCAL_PILOTS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is LocalPilotConfigV1 => item?.schemaVersion === "1.0"
      && typeof item?.pilotId === "string"
      && typeof item?.source?.id === "string"
      && typeof item?.snapshot?.signalTitle === "string"
      && typeof item?.snapshot?.artifact === "string"
      && typeof item?.snapshot?.acceptanceCriterion === "string");
  } catch {
    return [];
  }
}

export function saveLocalPilot(storage: Pick<Storage, "getItem" | "setItem">, pilot: LocalPilotConfigV1) {
  const pilots = [pilot, ...readLocalPilots(storage).filter((item) => item.pilotId !== pilot.pilotId)].slice(0, 20);
  storage.setItem(LOCAL_PILOTS_KEY, JSON.stringify(pilots));
  return pilots;
}

export function sampleRunToMarkdown(run: SampleRun, locale: PilotLocale) {
  return [
    `# ${locale === "en" ? "AI signal pilot" : "Пилот по AI-сигналу"}`,
    "",
    `**${locale === "en" ? "Signal" : "Сигнал"}:** ${run.signal.title}`,
    `**${locale === "en" ? "Observation" : "Наблюдение"}:** ${run.observation || "—"}`,
    `**${locale === "en" ? "Result" : "Результат"}:** ${run.artifact}`,
    "",
    ...run.lanes.flatMap((lane) => [`## ${lane.kind} · ${lane.title}`, lane.detail, ""]),
    `**${locale === "en" ? "Acceptance" : "Приёмка"}:** ${run.acceptanceCriterion}`,
  ].join("\n");
}
