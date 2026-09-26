import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { refreshRegistrySetFromFiles } from "./registry";
import { ReactionStore } from "./store";

function report(title: string, source: string) {
  return { srt_levels: [{ events: [{ title, description: `${title} description`, sources: [source] }] }] };
}

test("atomic RU+EN refresh expires disappeared versions without deleting history", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "reactions-registry-"));
  const store = new ReactionStore(path.join(directory, "test.sqlite"), "synthetic");
  const paths = ["ru-a.json", "en-a.json", "ru-b.json", "en-b.json"].map((name) => path.join(directory, name));
  try {
    writeFileSync(paths[0], JSON.stringify(report("RU old", "https://example.com/ru-old")));
    writeFileSync(paths[1], JSON.stringify(report("EN old", "https://example.com/en-old")));
    writeFileSync(paths[2], JSON.stringify(report("RU current", "https://example.com/ru-current")));
    writeFileSync(paths[3], JSON.stringify(report("EN current", "https://example.com/en-current")));
    const first = await refreshRegistrySetFromFiles(store, paths[0], paths[1], "https://verkhovskiy.ai", "2026-09-26T00:00:00.000Z", 24);
    const oldRow = store.db.prepare("SELECT news_id AS newsId, content_version AS contentVersion FROM news_registry WHERE last_snapshot_id = ? LIMIT 1").get(first.snapshotId) as { newsId: string; contentVersion: string };
    await refreshRegistrySetFromFiles(store, paths[2], paths[3], "https://verkhovskiy.ai", "2026-09-26T01:00:00.000Z", 24);
    assert.equal(store.resolveRegisteredNews(oldRow.newsId, oldRow.contentVersion, "2026-09-26T23:59:59.000Z").status, "active");
    assert.equal(store.resolveRegisteredNews(oldRow.newsId, oldRow.contentVersion, "2026-09-27T00:00:00.000Z").status, "expired");
    assert.equal(store.db.prepare("SELECT COUNT(*) AS count FROM news_registry WHERE news_id = ? AND content_version = ?").get(oldRow.newsId, oldRow.contentVersion)?.count, 1);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("invalid second locale cannot partially replace registry state", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "reactions-registry-"));
  const store = new ReactionStore(path.join(directory, "test.sqlite"), "synthetic");
  const ru = path.join(directory, "ru.json");
  const en = path.join(directory, "en.json");
  try {
    writeFileSync(ru, JSON.stringify(report("RU valid", "https://example.com/ru")));
    writeFileSync(en, JSON.stringify(report("EN valid", "https://example.com/en")));
    const initial = await refreshRegistrySetFromFiles(store, ru, en, "https://verkhovskiy.ai", "2026-09-26T00:00:00.000Z", 24);
    writeFileSync(ru, JSON.stringify(report("RU replacement", "https://example.com/ru-new")));
    writeFileSync(en, JSON.stringify({ srt_levels: "invalid" }));
    await assert.rejects(refreshRegistrySetFromFiles(store, ru, en, "https://verkhovskiy.ai", "2026-09-26T01:00:00.000Z", 24), /invalid_report_levels/);
    assert.equal(store.getRegistryState()?.snapshotId, initial.snapshotId);
    assert.equal((store.db.prepare("SELECT COUNT(*) AS count FROM news_registry").get() as { count: number }).count, initial.uniqueCount);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
