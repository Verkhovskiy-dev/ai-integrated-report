import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const importanceLevels = new Set(["critical", "high", "medium", "low"]);
const hash = value => createHash("sha256").update(value).digest("hex");
const stableJson = value => JSON.stringify(value);
const canonicalUrl = value => String(value || "").trim().replace(/\/$/, "");
const allEvents = report => (report.srt_levels || []).flatMap(level => (level.events || []).map(event => ({ level, event })));

export function normaliseImportance(raw) {
  if (raw == null) return null;
  if (typeof raw !== "object" || !importanceLevels.has(raw.level) || typeof raw.rationale !== "string" || !raw.rationale.trim()) {
    throw new Error("importance must be null or { level: critical|high|medium|low, rationale: non-empty string }");
  }
  return { level: raw.level, rationale: raw.rationale.trim() };
}

export function expectedNewsId(event) {
  if (typeof event.news_id === "string" && /^news_[a-f0-9]{16,64}$/.test(event.news_id)) return event.news_id;
  const sources = (event.sources || []).map(canonicalUrl).filter(Boolean).sort();
  const sourceIdentity = String(event.source_event_id || event.canonical_url || sources[0] || "");
  if (!sourceIdentity) throw new Error(`event has no durable identity: ${event.title || "untitled"}`);
  return `news_${hash(sourceIdentity).slice(0, 20)}`;
}

export function expectedContentVersion(event, newsId, importance = normaliseImportance(event.importance)) {
  return `cv_${hash(stableJson({
    news_id: newsId,
    title: event.title || "",
    description: event.description || "",
    fact: event.fact || "",
    why_important: event.why_important || "",
    related_levels: [...(event.related_levels || [])].sort(),
    sources: [...(event.sources || [])].map(canonicalUrl).sort(),
    importance,
  })).slice(0, 20)}`;
}

function explanationFor(event, newsId, version) {
  const x = event.executive_explanation;
  if (!x) return { news_id: newsId, content_version: version, status: "unavailable", unavailable_reason: "not_generated" };
  // Explanations are producer output for one exact factual input.  Never attach
  // an unversioned (or old-version) inline explanation to freshly hashed facts.
  if (x.content_version !== version) {
    return { news_id: newsId, content_version: version, status: "unavailable", unavailable_reason: "stale_or_unbound" };
  }
  for (const field of ["what_happened", "why_important", "business_impact"]) {
    if (typeof x[field] !== "string" || !x[field].trim()) throw new Error(`executive_explanation.${field} must be non-empty for ${newsId}`);
  }
  const uncertainty = typeof x.uncertainty === "string" && x.uncertainty.trim() ? x.uncertainty.trim() : undefined;
  return { news_id: newsId, content_version: version, status: "available", what_happened: x.what_happened.trim(), why_important: x.why_important.trim(), business_impact: x.business_impact.trim(), ...(uncertainty ? { uncertainty } : {}) };
}

export function buildPairedPayload(rawReport) {
  const report = structuredClone(rawReport);
  const seen = new Set();
  const executiveEvents = [];
  for (const { event } of allEvents(report)) {
    const importance = normaliseImportance(event.importance);
    const newsId = expectedNewsId(event);
    if (seen.has(newsId)) throw new Error(`duplicate news_id: ${newsId}`);
    seen.add(newsId);
    const version = expectedContentVersion(event, newsId, importance);
    event.news_id = newsId;
    event.content_version = version;
    event.importance = importance;
    executiveEvents.push(explanationFor(event, newsId, version));
    delete event.executive_explanation;
  }
  const reportContentVersion = `report_${hash(stableJson(executiveEvents.map(x => [x.news_id, x.content_version]))).slice(0, 20)}`;
  report.content_version = reportContentVersion;
  const executive = { schema_version: "news-executive/v1", report_content_version: reportContentVersion, executive_events: executiveEvents };
  validatePairedPayload(report, executive);
  return { report, executive };
}

export function validatePairedPayload(report, executive) {
  if (executive?.schema_version !== "news-executive/v1") throw new Error("unsupported executive schema_version");
  if (!Array.isArray(executive?.executive_events)) throw new Error("executive_events must be an array");
  const events = allEvents(report).map(x => x.event);
  const ids = new Map();
  for (const event of events) {
    if (!event.news_id || !event.content_version) throw new Error("report event missing news contract");
    if (event.content_version !== expectedContentVersion(event, event.news_id)) throw new Error(`report content_version does not match content: ${event.news_id}`);
    if (ids.has(event.news_id)) throw new Error(`duplicate report news_id: ${event.news_id}`);
    ids.set(event.news_id, event);
    normaliseImportance(event.importance);
  }
  const seenExecutive = new Set();
  for (const entry of executive.executive_events) {
    if (seenExecutive.has(entry.news_id)) throw new Error(`duplicate executive news_id: ${entry.news_id}`);
    seenExecutive.add(entry.news_id);
    const event = ids.get(entry.news_id);
    if (!event) throw new Error(`orphan executive explanation: ${entry.news_id}`);
    if (entry.content_version !== event.content_version) throw new Error(`stale executive explanation: ${entry.news_id}`);
    if (entry.status === "available") {
      for (const key of ["what_happened", "why_important", "business_impact"]) if (!String(entry[key] || "").trim()) throw new Error(`empty executive ${key}: ${entry.news_id}`);
      if (entry.uncertainty != null && !String(entry.uncertainty).trim()) throw new Error(`empty executive uncertainty: ${entry.news_id}`);
    } else if (entry.status === "unavailable") {
      if (!["not_generated", "missing", "stale_or_unbound"].includes(entry.unavailable_reason)) throw new Error(`invalid unavailable reason: ${entry.news_id}`);
    } else throw new Error(`invalid executive status: ${entry.news_id}`);
  }
  if (seenExecutive.size !== ids.size) throw new Error("missing explicit executive availability entries");
  if (executive.report_content_version !== report.content_version) throw new Error("report/executive version mismatch");
  return { events: events.length, available: executive.executive_events.filter(x => x.status === "available").length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [input, outputDir] = process.argv.slice(2);
  if (!input || !outputDir) throw new Error("Usage: build-paired-news-data.mjs <report.json> <output-dir>");
  const result = buildPairedPayload(JSON.parse(await readFile(input, "utf8")));
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "latest-report.json"), `${JSON.stringify(result.report, null, 2)}\n`);
  await writeFile(path.join(outputDir, "executive_data_ru.json"), `${JSON.stringify(result.executive, null, 2)}\n`);
  console.log(JSON.stringify(validatePairedPayload(result.report, result.executive)));
}
