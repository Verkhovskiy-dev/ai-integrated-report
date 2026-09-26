import registryJson from "./news-registry.json";
import { readFile } from "node:fs/promises";
import { buildNewsIdentity } from "../../shared/newsIdentity";
import { buildShareId } from "../../client/src/lib/share";
import type { ReactionStore } from "./store";

export interface RegisteredNews {
  newsId: string;
  contentVersion: string;
  title: string;
  url: string;
  sourceUrl?: string;
}

export function createNewsRegistry(entries: RegisteredNews[] = registryJson.entries) {
  return new Map(entries.map((entry) => [`${entry.newsId}:${entry.contentVersion}`, entry]));
}

export function registryEntriesFromReport(report: unknown, siteOrigin = "https://verkhovskiy.ai"): RegisteredNews[] {
  const levels = (report as { srt_levels?: Array<{ events?: Array<{ title?: unknown; description?: unknown; sources?: unknown }> }> }).srt_levels;
  if (!Array.isArray(levels)) throw new Error("invalid_report_levels");
  const entries: RegisteredNews[] = [];
  for (const level of levels) {
    if (!Array.isArray(level.events)) continue;
    for (const event of level.events) {
      if (typeof event.title !== "string" || !event.title.trim()) throw new Error("invalid_report_event_title");
      const description = typeof event.description === "string" ? event.description : "";
      const sources = Array.isArray(event.sources) && event.sources.every((source) => typeof source === "string") ? event.sources as string[] : [];
      if (sources.length === 0 || sources.some((source) => !source.startsWith("https://"))) throw new Error("invalid_report_event_sources");
      const identity = buildNewsIdentity({ title: event.title, description, sources });
      const shareId = buildShareId("news", event.title);
      entries.push({
        ...identity,
        title: event.title,
        url: `${siteOrigin.replace(/\/$/, "")}/?share=${encodeURIComponent(shareId)}#${encodeURIComponent(shareId)}`,
      });
    }
  }
  const unique = [...new Map(entries.map((entry) => [`${entry.newsId}:${entry.contentVersion}`, entry])).values()];
  if (unique.length === 0 || unique.length > 500) throw new Error("invalid_report_event_count");
  return unique;
}

export async function registryEntriesFromFile(reportPath: string, siteOrigin?: string) {
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  return registryEntriesFromReport(report, siteOrigin);
}

export async function refreshRegistrySetFromFiles(
  store: ReactionStore,
  ruReportPath: string,
  enReportPath: string,
  siteOrigin = "https://verkhovskiy.ai",
  refreshedAt = new Date().toISOString(),
  ttlHours = 24,
) {
  // Both trusted inputs are completely read and validated before the SQLite
  // transaction starts, so a missing/invalid locale can never partially refresh.
  const [ruEntries, enEntries] = await Promise.all([
    registryEntriesFromFile(ruReportPath, siteOrigin),
    registryEntriesFromFile(enReportPath, siteOrigin),
  ]);
  return store.replaceRegistrySnapshot(ruEntries, enEntries, siteOrigin, refreshedAt, ttlHours);
}
