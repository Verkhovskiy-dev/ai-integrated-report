import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
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
