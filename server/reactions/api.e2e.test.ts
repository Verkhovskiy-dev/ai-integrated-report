import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import express from "express";
import { createReactionRouter } from "./api";
import type { RegisteredNews } from "./registry";
import { ReactionStore } from "./store";

const registered: RegisteredNews = {
  newsId: "news_12345678",
  contentVersion: "cv_12345678",
  title: "Synthetic news",
  url: "https://verkhovskiy.ai/?share=news-synthetic#news-synthetic",
  sourceUrl: "https://example.com/news",
};

test("HTTP E2E: auth, registered news, duplicate, two-tab conflict, remove, summary and restart", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "reactions-e2e-"));
  const dbPath = path.join(directory, "test.sqlite");
  let store = new ReactionStore(dbPath, "synthetic");
  store.replaceRegistrySnapshot([registered], [registered], "test", "2026-09-26T00:00:00.000Z", 24);
  let currentTime = new Date("2026-09-26T01:00:00.000Z");
  const app = express();
  app.use("/api/reactions", express.json(), createReactionRouter({
    store,
    allowedOrigins: ["http://127.0.0.1"],
    adminToken: "test-editor-token",
    now: () => currentTime,
  }));
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing test address");
  const base = `http://127.0.0.1:${address.port}/api/reactions`;
  const browserId = "br_12345678";
  const payload = {
    eventId: "00000000-0000-4000-8000-000000000011",
    browserId,
    newsId: registered.newsId,
    contentVersion: registered.contentVersion,
    reaction: "important",
    operation: "set",
    expectedRevision: 0,
  };
  const post = (body: unknown) => fetch(`${base}/events`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1" },
    body: JSON.stringify(body),
  });

  try {
    assert.equal((await post({ ...payload, newsId: "news_unknown1" })).status, 400);
    const created = await post(payload);
    assert.equal(created.status, 201);
    assert.equal((await created.json()).state.reaction, "important");
    assert.equal((await post(payload)).status, 200);

    const tabTwoConflict = await post({ ...payload, eventId: "00000000-0000-4000-8000-000000000012", reaction: "more" });
    assert.equal(tabTwoConflict.status, 409);
    const conflictBody = await tabTwoConflict.json();
    assert.equal(conflictBody.current.revision, 1);
    const changed = await post({ ...payload, eventId: "00000000-0000-4000-8000-000000000012", reaction: "more", expectedRevision: 1 });
    assert.equal(changed.status, 201);
    currentTime = new Date("2026-09-27T01:00:00.000Z");
    const expiredSet = await post({ ...payload, eventId: "00000000-0000-4000-8000-000000000014", reaction: "unclear", expectedRevision: 2 });
    assert.equal(expiredSet.status, 410);
    assert.equal((await expiredSet.json()).error, "expired_news_version");
    const removed = await post({ ...payload, eventId: "00000000-0000-4000-8000-000000000013", reaction: null, operation: "remove", expectedRevision: 2 });
    assert.equal(removed.status, 201);

    assert.equal((await fetch(`${base}/editor/summary?from=2000-01-01T00:00:00.000Z&to=2100-01-01T00:00:00.000Z`)).status, 401);
    const summaryResponse = await fetch(`${base}/editor/summary?from=2000-01-01T00:00:00.000Z&to=2100-01-01T00:00:00.000Z`, {
      headers: { authorization: "Bearer test-editor-token" },
    });
    assert.equal(summaryResponse.status, 200);
    const summary = await summaryResponse.json();
    assert.equal(summary.operationCount, 3);
    assert.equal(summary.activeReactionCountAtEnd, 0);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    store = new ReactionStore(dbPath, "synthetic");
    assert.equal(store.getCurrent({ browserId, newsId: registered.newsId, contentVersion: registered.contentVersion }).revision, 3);
  } finally {
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
