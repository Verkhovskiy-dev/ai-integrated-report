import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve(import.meta.dirname, "../..");
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 20);
function fixture(release: "A" | "B", locale: "ru" | "en") {
  const events = Array.from({ length: 10 }, (_, i) => {
    // One unchanged event exercises root-version protection across releases.
    const title = `${locale} News ${i} ${i === 0 ? "Shared" : release}`;
    const event = { news_id: `news_${String(i).padStart(16, "0")}`, title,
      description: `Source fact ${title}`, fact: `Source fact ${title}`, why_important: "",
      related_levels: [9], sources: [`https://example.invalid/source-${i}`], importance: null };
    return { ...event, content_version: `cv_${hash(event)}` };
  });
  const content_version = `report_${hash(events.map(e => [e.news_id, e.content_version]))}`;
  const report = { date: "2026-10-30", generated_at: release === "A" ? "2026-10-30T05:00:00Z" : "2026-10-30T17:00:00Z", content_version,
    srt_levels: [{ level: 9, name: "Капитал", events, event_count: events.length }], key_focus: "Isolated refresh",
    cross_level_links: [], structural_shifts: [], radar_signals: [], metrics: { total_events: 10 } };
  const executive = { schema_version: "news-executive/v1", report_content_version: content_version,
    executive_events: events.map(e => ({ news_id: e.news_id, content_version: e.content_version, status: "available",
      what_happened: `Explanation ${release} ${locale} ${e.title}`, why_important: "Test importance", business_impact: "Test impact" })) };
  return { report, executive };
}

let mode = "A";
const counts: Record<string, number> = {};
export default defineConfig({
  root: import.meta.dirname, base: "/", plugins: [react(), tailwindcss(), {
    name: "isolated-release-fixtures",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0];
        if (url.startsWith("/__fixture/") && req.method === "POST") {
          const nextMode = url.slice("/__fixture/".length);
          if (!["A", "B-stale-executive", "B", "error", "malformed", "older"].includes(nextMode)) { res.statusCode = 400; res.end(); return; }
          mode = nextMode; res.end(mode); return;
        }
        if (url === "/__receipt") { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ mode, counts })); return; }
        if (!url.startsWith("/data/") && !url.startsWith("/api/")) return next();
        counts[url] = (counts[url] || 0) + 1;
        res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-cache");
        if (url.startsWith("/api/")) { res.statusCode = 503; res.end('{"error":"isolated_no_reactions"}'); return; }
        if (mode === "error") { res.statusCode = 503; res.end('{}'); return; }
        const locale = /\.en\.json$|_en\.json$/.test(url) ? "en" : "ru";
        const release = mode.startsWith("B") ? "B" : "A";
        if (url.includes("latest-report")) { res.end(mode === "malformed" ? '{"bad":true}' : JSON.stringify(fixture(release, locale).report)); return; }
        if (url.includes("executive_data")) { res.end(JSON.stringify(fixture(mode === "B-stale-executive" ? "A" : release, locale).executive)); return; }
        res.end("[]");
      });
    },
  }],
  resolve: { alias: { "@": path.join(root, "client/src"), "@shared": path.join(root, "shared") } },
  server: { host: "127.0.0.1", port: 4198, strictPort: true, fs: { allow: [root] } },
});
