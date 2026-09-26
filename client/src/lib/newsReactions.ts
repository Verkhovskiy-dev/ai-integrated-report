export type NewsReaction = "useful" | "more" | "unclear";

export interface BrowserIdentity {
  browserId: string;
  persistent: boolean;
}

export interface ReactionState {
  browserId: string;
  newsId: string;
  contentVersion: string;
  reaction: NewsReaction | null;
  revision: number;
  updatedAt: string | null;
  lastEventId: string | null;
}

export interface ReactionIntent {
  eventId: string;
  browserId: string;
  newsId: string;
  contentVersion: string;
  reaction: NewsReaction | null;
  operation: "set" | "remove";
  expectedRevision: number;
}

const STORAGE_KEY = "verkhovskiy.news-reactions.browser.v1";
let ephemeralBrowserId: string | undefined;

export function createBrowserIdentity(
  storage: Pick<Storage, "getItem" | "setItem"> | undefined,
  uuid = () => crypto.randomUUID(),
): BrowserIdentity {
  try {
    const existing = storage?.getItem(STORAGE_KEY);
    if (existing) return { browserId: existing, persistent: true };
    const browserId = `br_${uuid()}`;
    storage?.setItem(STORAGE_KEY, browserId);
    if (storage?.getItem(STORAGE_KEY) !== browserId) throw new Error("storage_write_failed");
    return { browserId, persistent: true };
  } catch {
    ephemeralBrowserId ??= `br_${uuid()}`;
    return { browserId: ephemeralBrowserId, persistent: false };
  }
}

export function getBrowserIdentity() {
  return createBrowserIdentity(typeof window === "undefined" ? undefined : window.localStorage);
}

export function reactionApiBase() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const configured = env?.VITE_REACTIONS_API_BASE;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && ["verkhovskiy.ai", "www.verkhovskiy.ai"].includes(window.location.hostname)) {
    return "https://claw.verkhovskiy.ai/news-feedback";
  }
  return "";
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 8_000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${reactionApiBase()}/api/reactions${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error ?? `reaction_http_${response.status}`) as Error & {
        status?: number;
        current?: ReactionState;
      };
      error.status = response.status;
      error.current = payload.current;
      throw error;
    }
    return payload as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function loadReaction(browserId: string, newsId: string, contentVersion: string) {
  const query = new URLSearchParams({ browserId, newsId, contentVersion });
  const result = await request<{ ok: true; state: ReactionState }>(`/current?${query}`);
  return result.state;
}

export async function saveReaction(intent: ReactionIntent) {
  const result = await request<{ ok: true; state: ReactionState; duplicate: boolean; serverTimestamp: string }>("/events", {
    method: "POST",
    body: JSON.stringify(intent),
  });
  return result;
}

export interface EditorSummary {
  namespace: string;
  period: { from: string; to: string; timezone: string; semantics: string };
  operationCount: number;
  activeReactionCountAtEnd: number;
  newsVersions: Array<{
    newsId: string;
    contentVersion: string;
    title: string;
    url: string;
    sourceUrl?: string;
    useful: number;
    more: number;
    unclear: number;
    activeReactions: number;
  }>;
  interpretation: string[];
}

export function loadEditorSummary(token: string, from: string, to: string) {
  const query = new URLSearchParams({ from, to });
  return request<EditorSummary>(`/editor/summary?${query}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function newReactionIntent(
  identity: Pick<ReactionIntent, "browserId" | "newsId" | "contentVersion">,
  reaction: NewsReaction | null,
  expectedRevision: number,
  uuid = () => crypto.randomUUID(),
): ReactionIntent {
  return {
    ...identity,
    eventId: uuid(),
    reaction,
    operation: reaction === null ? "remove" : "set",
    expectedRevision,
  };
}
