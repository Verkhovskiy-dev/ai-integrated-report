import { describe, expect, it } from "vitest";
import {
  buildLocalPilotConfig,
  buildSampleRun,
  LOCAL_PILOTS_KEY,
  readLocalPilots,
  sampleRunToMarkdown,
  saveLocalPilot,
  type PilotSignal,
} from "./vagueIntentPilot";

const signal: PilotSignal = { id: "news:1", title: "AI agents enter operations", description: "A current dashboard event", reportDate: "2026-08-21" };
const answers = { jobFamily: "operations", intent: "decision", frequency: "weekly" } as const;

describe("vague intent pilot", () => {
  it("builds the default news-to-decision sample with four explicit choices", () => {
    const run = buildSampleRun(signal, answers, "en");
    expect(run.lanes.map((lane) => lane.kind)).toEqual(["ACT", "VERIFY", "WATCH", "IGNORE"]);
    expect(run.artifact).toContain("decision brief");
    expect(run.signal).toBe(signal);
  });

  it("localizes the useful output", () => {
    const run = buildSampleRun(signal, { ...answers, intent: "pilot" }, "ru");
    expect(run.artifact).toContain("пилота");
    expect(sampleRunToMarkdown(run, "ru")).toContain("Приёмка");
  });

  it("stores a versioned public-value snapshot without the full source description", () => {
    const pilot = buildLocalPilotConfig(answers, signal, "ru", "useful", new Date("2026-08-21T10:00:00.000Z"));
    expect(pilot.schemaVersion).toBe("1.0");
    expect(pilot.source).toEqual({ id: "news:1", reportDate: "2026-08-21" });
    expect(JSON.stringify(pilot)).not.toContain(signal.description);
    expect(pilot.snapshot.signalTitle).toBe(signal.title);
    expect(pilot.snapshot.artifact).toContain("decision brief");
  });

  it("recovers from invalid storage and keeps the latest twenty pilots", () => {
    const values = new Map<string, string>([[LOCAL_PILOTS_KEY, "not-json"]]);
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    expect(readLocalPilots(storage)).toEqual([]);
    for (let index = 0; index < 22; index += 1) {
      const pilot = { ...buildLocalPilotConfig(answers, signal, "en", "adjust"), pilotId: `pilot-${index}` };
      saveLocalPilot(storage, pilot);
    }
    expect(readLocalPilots(storage)).toHaveLength(20);
    expect(readLocalPilots(storage)[0].pilotId).toBe("pilot-21");
  });
});
