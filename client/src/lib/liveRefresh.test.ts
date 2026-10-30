import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acceptLiveReport, LIVE_REFRESH_MS, startLiveRefresh } from "./liveRefresh";

function browser() {
  const win = Object.assign(new EventTarget(), {
    navigator: { onLine: true },
    setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    setInterval: (...args: Parameters<typeof setInterval>) => setInterval(...args),
    clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
  });
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  return { win, doc, options: { window: win as unknown as Window, document: doc as unknown as Document } };
}

describe("read-only live refresh lifecycle", () => {
  let stop: (() => void) | undefined;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { stop?.(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it("loads immediately and polls at one minute without reloading the document", async () => {
    const b = browser(); const refresh = vi.fn(async () => {});
    stop = startLiveRefresh(refresh, b.options);
    expect(refresh).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(LIVE_REFRESH_MS);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("skips hidden polling and catches up on visibility, focus and online", async () => {
    const b = browser(); const refresh = vi.fn(async () => {});
    stop = startLiveRefresh(refresh, b.options);
    await vi.advanceTimersByTimeAsync(0);
    b.doc.visibilityState = "hidden";
    await vi.advanceTimersByTimeAsync(180_000);
    b.win.dispatchEvent(new Event("focus"));
    expect(refresh).toHaveBeenCalledTimes(1);
    b.doc.visibilityState = "visible";
    b.doc.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    b.win.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(0);
    b.win.dispatchEvent(new Event("online"));
    expect(refresh).toHaveBeenCalledTimes(4);
  });

  it("waits while offline, including initial mount, then recovers", async () => {
    const b = browser(); b.win.navigator.onLine = false;
    const refresh = vi.fn(async () => {}); stop = startLiveRefresh(refresh, b.options);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(refresh).not.toHaveBeenCalled();
    b.win.navigator.onLine = true; b.win.dispatchEvent(new Event("online"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("serializes a burst of resume events and interval checks", async () => {
    const b = browser(); let resolve!: () => void;
    const refresh = vi.fn(() => new Promise<void>(done => { resolve = done; }));
    stop = startLiveRefresh(refresh, { ...b.options, timeoutMs: 180_000 });
    b.win.dispatchEvent(new Event("focus")); b.win.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refresh).toHaveBeenCalledTimes(1);
    resolve(); await vi.advanceTimersByTimeAsync(0);
    b.win.dispatchEvent(new Event("focus"));
    expect(refresh).toHaveBeenCalledTimes(2); resolve();
  });

  it("aborts a timed-out fetch and retries on the next tick", async () => {
    const b = browser(); const signals: AbortSignal[] = [];
    const refresh = vi.fn((signal: AbortSignal) => new Promise<void>(resolve => {
      signals.push(signal); signal.addEventListener("abort", () => resolve());
    }));
    stop = startLiveRefresh(refresh, b.options);
    await vi.advanceTimersByTimeAsync(25_000); expect(signals[0].aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(35_000); expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("retries after a rejected request instead of latching failure", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const b = browser(); const refresh = vi.fn().mockRejectedValueOnce(new Error("HTTP 503")).mockResolvedValue(undefined);
    stop = startLiveRefresh(refresh, b.options);
    await vi.advanceTimersByTimeAsync(60_000); expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("cleanup cancels old work, removes listeners/timers and permits a fresh locale loop", async () => {
    const b = browser(); let signal!: AbortSignal;
    const refresh = vi.fn(async (s: AbortSignal) => { signal = s; });
    stop = startLiveRefresh(refresh, b.options); stop();
    expect(signal.aborted).toBe(true);
    b.win.dispatchEvent(new Event("focus")); b.doc.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(120_000); expect(refresh).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    stop = startLiveRefresh(refresh, b.options); expect(refresh).toHaveBeenCalledTimes(2);
  });
});

const report = (date = "2026-10-30T05:02:56.723Z", title = "Fresh source fact") => ({
  date: "2026-10-30", generated_at: date,
  srt_levels: [{ level: 9, events: [{ title, description: "Verified source fact" }] }],
});
describe("refresh acceptance protects last-known-good data", () => {
  it("accepts initial and later releases including two releases on one date", () => {
    const old = report(); expect(acceptLiveReport(old, null)).toBe(true);
    expect(acceptLiveReport(report("2026-10-30T17:03:00Z"), old)).toBe(true);
  });
  it("does not replace unchanged data or downgrade to an older cached release", () => {
    const old = report(); expect(acceptLiveReport(structuredClone(old), old)).toBe(false);
    expect(acceptLiveReport(report("2026-10-29T17:03:00Z"), old)).toBe(false);
  });
  it("accepts corrections at the same generation time", () => {
    expect(acceptLiveReport(report(undefined, "Corrected fact"), report())).toBe(true);
  });
  it.each([null, {}, { ...report(), generated_at: "bad" }, { ...report(), date: "bad" },
    { ...report(), srt_levels: [] }, { ...report(), srt_levels: [{ level: 1 }] },
    { ...report(), srt_levels: [{ level: 1, events: [{ title: 1 }] }] }])("rejects malformed report %j", value => {
    expect(() => acceptLiveReport(value as ReturnType<typeof report>, report())).toThrow("Invalid live report");
  });
});
