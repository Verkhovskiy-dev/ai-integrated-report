import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ReactionStore, RevisionConflict, type ReactionWrite } from "./store";

const base: ReactionWrite = {
  eventId: "00000000-0000-4000-8000-000000000001",
  browserId: "br_12345678",
  newsId: "news_12345678",
  contentVersion: "cv_12345678",
  reaction: "useful",
  operation: "set",
  expectedRevision: 0,
  title: "Synthetic news",
  url: "https://verkhovskiy.ai/",
  sourceUrl: "https://example.com/news",
};

test("legacy migration preserves records, supports important, retry, restart and removal", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "reactions-migrate-"));
  const dbPath = path.join(directory, "test.sqlite");
  let store: ReactionStore | undefined;
  try {
    const legacy = new DatabaseSync(dbPath);
    legacy.exec(readFileSync(new URL("./fixtures/legacy-schema.sql", import.meta.url), "utf8"));
    legacy.prepare("INSERT INTO reaction_events VALUES (1, ?, 'synthetic', ?, ?, ?, 'useful', 'set', 0, 1, ?, ?, ?, ?)").run(base.eventId, base.browserId, base.newsId, base.contentVersion, base.title, base.url, base.sourceUrl!, "2026-09-26T00:00:00Z");
    legacy.prepare("INSERT INTO reaction_state VALUES ('synthetic', ?, ?, ?, 'useful', 1, ?, ?, ?, ?, ?)").run(base.browserId, base.newsId, base.contentVersion, base.title, base.url, base.sourceUrl!, "2026-09-26T00:00:00Z", base.eventId);
    const oldEvents = legacy.prepare("SELECT * FROM reaction_events").all();
    const oldState = legacy.prepare("SELECT * FROM reaction_state").all();
    legacy.close();
    store = new ReactionStore(dbPath, "synthetic");
    assert.deepEqual(store.db.prepare("SELECT * FROM reaction_events").all(), oldEvents);
    assert.deepEqual(store.db.prepare("SELECT * FROM reaction_state").all(), oldState);
    const important: ReactionWrite = { ...base, eventId: "00000000-0000-4000-8000-000000000021", reaction: "important", expectedRevision: 1 };
    assert.equal(store.apply(important).state.reaction, "important");
    assert.equal(store.apply(important).duplicate, true);
    const summary = store.summary("2000-01-01T00:00:00Z", "2100-01-01T00:00:00Z");
    assert.equal((summary.newsVersions[0] as { important: number }).important, 1);
    assert.equal(summary.operationCount, 2);
    store.close(); store = undefined;
    store = new ReactionStore(dbPath, "synthetic");
    assert.equal(store.getCurrent(base).reaction, "important");
    assert.equal(store.apply({ ...important, eventId: "00000000-0000-4000-8000-000000000022", reaction: null, operation: "remove", expectedRevision: 2 }).state.reaction, null);
    assert.equal(store.summary("2000-01-01T00:00:00Z", "2100-01-01T00:00:00Z").activeReactionCountAtEnd, 0);
    assert.equal((store.db.prepare("PRAGMA integrity_check").get() as Record<string, string>).integrity_check, "ok");
    assert.equal(store.db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'reaction_events_%'").all().length, 2);
  } finally {
    store?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("durable log, idempotency, revision conflict and restart", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "reactions-store-"));
  const dbPath = path.join(directory, "test.sqlite");
  try {
    let store = new ReactionStore(dbPath, "synthetic");
    const first = store.apply(base);
    assert.equal(first.state.reaction, "useful");
    assert.equal(first.state.revision, 1);
    assert.equal(store.apply(base).duplicate, true);
    assert.equal(store.listEvents("2000-01-01T00:00:00.000Z", "2100-01-01T00:00:00.000Z").length, 1);
    assert.throws(() => store.apply({ ...base, eventId: "00000000-0000-4000-8000-000000000002", reaction: "more" }), RevisionConflict);
    store.close();

    store = new ReactionStore(dbPath, "synthetic");
    assert.equal(store.getCurrent(base).reaction, "useful");
    const changed = store.apply({ ...base, eventId: "00000000-0000-4000-8000-000000000003", reaction: "more", expectedRevision: 1 });
    assert.equal(changed.state.reaction, "more");
    const removed = store.apply({ ...base, eventId: "00000000-0000-4000-8000-000000000004", reaction: null, operation: "remove", expectedRevision: 2 });
    assert.equal(removed.state.reaction, null);
    assert.equal(removed.state.revision, 3);
    const summary = store.summary("2000-01-01T00:00:00.000Z", "2100-01-01T00:00:00.000Z");
    assert.equal(summary.operationCount, 3);
    assert.equal(summary.activeReactionCountAtEnd, 0);
    assert.deepEqual(store.deleteBrowser(base.browserId), { eventsDeleted: 3, statesDeleted: 1 });
    store.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
