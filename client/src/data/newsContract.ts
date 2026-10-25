export type ImportanceLevel = "critical" | "high" | "medium" | "low";

export interface NewsImportance {
  level: ImportanceLevel;
  rationale: string;
}

export interface ContractNewsEvent {
  news_id?: string;
  content_version?: string;
  importance?: NewsImportance | null;
  title?: string;
  description?: string;
  fact?: string;
  why_important?: string;
  related_levels?: number[];
  sources?: string[];
}

export interface ExecutiveExplanation {
  news_id: string;
  content_version: string;
  status: "available" | "unavailable";
  unavailable_reason?: "not_generated" | "missing" | "stale_or_unbound";
  what_happened?: string;
  why_important?: string;
  business_impact?: string;
  uncertainty?: string;
}

export interface ExecutiveNewsData {
  schema_version?: string;
  report_content_version?: string;
  executive_events: ExecutiveExplanation[];
}

export interface ContractNewsReport {
  content_version?: string;
  srt_levels?: Array<{ events?: ContractNewsEvent[] }>;
}

export type ExecutiveLookup =
  | { status: "available"; explanation: ExecutiveExplanation }
  | { status: "unavailable"; reason: "missing_contract" | "missing" | "stale" | "not_generated" };

/**
 * A rejected pair must not expose generated interpretation through description.
 * The fact (or, if absent, the source title) is the only executive-mode fallback.
 */
export function executiveSafeDescription(
  event: ContractNewsEvent,
  lookup: ExecutiveLookup | undefined,
  isExecutive: boolean,
): string {
  if (isExecutive && lookup?.status === "unavailable") {
    return String(event.fact || event.title || "").trim();
  }
  return String(event.description || event.fact || "").trim();
}

export function importanceLabel(importance: NewsImportance | null | undefined, isEn: boolean): string {
  if (!isValidImportance(importance)) return isEn ? "Importance: unknown" : "Важность: не оценена";
  const labels: Record<ImportanceLevel, [string, string]> = {
    critical: ["Importance: critical", "Важность: критическая"],
    high: ["Importance: high", "Важность: высокая"],
    medium: ["Importance: medium", "Важность: средняя"],
    low: ["Importance: low", "Важность: низкая"],
  };
  return labels[importance.level][isEn ? 0 : 1];
}

const importanceLevels = new Set<ImportanceLevel>(["critical", "high", "medium", "low"]);
const canonicalUrl = (value: unknown) => String(value || "").trim().replace(/\/$/, "");

export function isValidImportance(value: unknown): value is NewsImportance {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NewsImportance>;
  return importanceLevels.has(candidate.level as ImportanceLevel)
    && typeof candidate.rationale === "string"
    && candidate.rationale.trim().length > 0;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function computeContentVersion(event: ContractNewsEvent, newsId: string): Promise<string> {
  const importance = event.importance == null
    ? null
    : isValidImportance(event.importance)
      ? { level: event.importance.level, rationale: event.importance.rationale.trim() }
      : (() => { throw new Error(`invalid importance: ${newsId}`); })();
  const digest = await sha256(JSON.stringify({
    news_id: newsId,
    title: event.title || "",
    description: event.description || "",
    fact: event.fact || "",
    why_important: event.why_important || "",
    related_levels: [...(event.related_levels || [])].sort(),
    sources: [...(event.sources || [])].map(canonicalUrl).sort(),
    importance,
  }));
  return `cv_${digest.slice(0, 20)}`;
}

export async function computeReportContentVersion(events: ContractNewsEvent[]): Promise<string> {
  const digest = await sha256(JSON.stringify(events.map(event => [event.news_id, event.content_version])));
  return `report_${digest.slice(0, 20)}`;
}

/**
 * Fail-closed runtime gate for the independently fetched executive dataset.
 * It verifies the loaded report itself before trusting any explanation.
 */
export async function validateExecutiveNewsData(
  report: ContractNewsReport | null,
  value: unknown,
): Promise<ExecutiveNewsData> {
  if (!report || !Array.isArray(report.srt_levels)) throw new Error("Loaded report has no news contract");
  const events = report.srt_levels.flatMap(level => Array.isArray(level.events) ? level.events : []);
  const byId = new Map<string, ContractNewsEvent>();
  for (const event of events) {
    if (typeof event.news_id !== "string" || !/^news_[a-f0-9]{16,64}$/.test(event.news_id)) throw new Error("Report event has invalid news_id");
    if (byId.has(event.news_id)) throw new Error(`Duplicate report news_id: ${event.news_id}`);
    if (event.importance != null && !isValidImportance(event.importance)) throw new Error(`Invalid report importance: ${event.news_id}`);
    if (event.content_version !== await computeContentVersion(event, event.news_id)) throw new Error(`Report content hash mismatch: ${event.news_id}`);
    byId.set(event.news_id, event);
  }
  if (report.content_version !== await computeReportContentVersion(events)) throw new Error("Report root content version mismatch");

  if (!value || typeof value !== "object") throw new Error("Executive payload is not an object");
  const executive = value as ExecutiveNewsData;
  if (executive.schema_version !== "news-executive/v1") throw new Error("Unsupported executive schema version");
  if (executive.report_content_version !== report.content_version) throw new Error("Executive/report root version mismatch");
  if (!Array.isArray(executive.executive_events)) throw new Error("Executive events must be an array");

  const seen = new Set<string>();
  for (const entry of executive.executive_events) {
    if (!entry || typeof entry !== "object" || typeof entry.news_id !== "string") throw new Error("Malformed executive entry");
    if (seen.has(entry.news_id)) throw new Error(`Duplicate executive news_id: ${entry.news_id}`);
    seen.add(entry.news_id);
    const event = byId.get(entry.news_id);
    if (!event) throw new Error(`Orphan executive entry: ${entry.news_id}`);
    if (entry.content_version !== event.content_version) throw new Error(`Stale executive entry: ${entry.news_id}`);
    if (entry.status === "available") {
      for (const field of ["what_happened", "why_important", "business_impact"] as const) {
        if (typeof entry[field] !== "string" || !entry[field]!.trim()) throw new Error(`Empty executive ${field}: ${entry.news_id}`);
      }
      if (entry.uncertainty != null && (typeof entry.uncertainty !== "string" || !entry.uncertainty.trim())) throw new Error(`Empty executive uncertainty: ${entry.news_id}`);
    } else if (entry.status === "unavailable") {
      if (!["not_generated", "missing", "stale_or_unbound"].includes(String(entry.unavailable_reason))) throw new Error(`Invalid unavailable reason: ${entry.news_id}`);
    } else {
      throw new Error(`Invalid executive status: ${entry.news_id}`);
    }
  }
  if (seen.size !== byId.size) throw new Error("Missing explicit executive availability entries");
  return executive;
}

/** Never fall back to title matching: a title is presentation, not identity. */
export function findExecutiveExplanation(
  event: ContractNewsEvent,
  data: ExecutiveNewsData | null,
): ExecutiveLookup {
  if (!event.news_id || !event.content_version) return { status: "unavailable", reason: "missing_contract" };
  const entry = data?.executive_events.find((item) => item.news_id === event.news_id);
  if (!entry) return { status: "unavailable", reason: "missing" };
  if (entry.content_version !== event.content_version) return { status: "unavailable", reason: "stale" };
  if (entry.status !== "available") return { status: "unavailable", reason: "not_generated" };
  return { status: "available", explanation: entry };
}
