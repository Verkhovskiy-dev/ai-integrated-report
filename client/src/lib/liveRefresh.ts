/** Read-only refresh loop. No navigation, app remount, writes or analytics events. */
export const LIVE_REFRESH_MS = 60_000;
export const LIVE_REQUEST_TIMEOUT_MS = 25_000;

export function startLiveRefresh(
  refresh: (signal: AbortSignal) => Promise<void>,
  options: {
    window?: Window;
    document?: Document;
    intervalMs?: number;
    timeoutMs?: number;
  } = {},
): () => void {
  const win = options.window ?? window;
  const doc = options.document ?? document;
  let disposed = false;
  let active: AbortController | null = null;

  const run = async () => {
    if (disposed || active || doc.visibilityState === "hidden" || win.navigator.onLine === false) return;
    const controller = new AbortController();
    active = controller;
    const timeout = win.setTimeout(() => controller.abort(), options.timeoutMs ?? LIVE_REQUEST_TIMEOUT_MS);
    try {
      await refresh(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) console.warn("Live refresh failed; retaining current data", error);
    } finally {
      win.clearTimeout(timeout);
      if (active === controller) active = null;
    }
  };
  const onResume = () => { void run(); };
  const interval = win.setInterval(onResume, options.intervalMs ?? LIVE_REFRESH_MS);
  win.addEventListener("focus", onResume);
  win.addEventListener("online", onResume);
  doc.addEventListener("visibilitychange", onResume);
  void run();

  return () => {
    disposed = true;
    win.clearInterval(interval);
    win.removeEventListener("focus", onResume);
    win.removeEventListener("online", onResume);
    doc.removeEventListener("visibilitychange", onResume);
    active?.abort();
  };
}

/** Reject malformed/older responses instead of replacing a usable release. */
export function acceptLiveReport<T extends { date: string; generated_at: string; srt_levels: unknown[] }>(
  value: T,
  previous: T | null,
): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)
    || !Number.isFinite(Date.parse(value.generated_at)) || !Array.isArray(value.srt_levels)
    || value.srt_levels.length === 0 || !value.srt_levels.every((raw) => {
      const level = raw as { level?: unknown; events?: unknown } | null;
      return level && Number.isInteger(level.level) && Array.isArray(level.events)
        && level.events.every(event => event && typeof event.title === "string" && typeof event.description === "string");
    })) throw new Error("Invalid live report payload");
  if (previous && Date.parse(value.generated_at) < Date.parse(previous.generated_at)) return false;
  return !previous || JSON.stringify(value) !== JSON.stringify(previous);
}
