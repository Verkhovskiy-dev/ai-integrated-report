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

test("HTTP E2E: admin registry-refresh with dual locales", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "reactions-e2e-"));
  const dbPath = path.join(directory, "test.sqlite");
  const store = new ReactionStore(dbPath, "synthetic");
  const app = express();
  
  const mockReports = express();
  mockReports.get("/ru.json", (_req, res) => {
    res.json({
      srt_levels: [{
        events: [{
          title: "RU news",
          description: "RU description",
          sources: ["https://example.com/ru"],
        }],
      }],
    });
  });
  mockReports.get("/en.json", (_req, res) => {
    res.json({
      srt_levels: [{
        events: [{
          title: "EN news",
          description: "EN description",
          sources: ["https://example.com/en"],
        }],
      }],
    });
  });
  
  const mockServer = createServer(mockReports);
  await new Promise<void>((resolve) => mockServer.listen(0, "127.0.0.1", resolve));
  const mockAddress = mockServer.address();
  if (!mockAddress || typeof mockAddress === "string") throw new Error("missing mock address");
  const mockBase = `http://127.0.0.1:${mockAddress.port}`;
  
  app.use("/api/reactions", express.json(), createReactionRouter({
    store,
    allowedOrigins: ["http://127.0.0.1"],
    adminToken: "test-editor-token",
    allowRuOnly: false,
  }));
  
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing test address");
  const base = `http://127.0.0.1:${address.port}/api/reactions`;
  
  try {
    const unauthResponse = await fetch(`${base}/editor/registry-refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ruUrl: `${mockBase}/ru.json`, enUrl: `${mockBase}/en.json` }),
    });
    assert.equal(unauthResponse.status, 401);
    
    const refreshResponse = await fetch(`${base}/editor/registry-refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer test-editor-token" },
      body: JSON.stringify({ ruUrl: `${mockBase}/ru.json`, enUrl: `${mockBase}/en.json` }),
    });
    assert.equal(refreshResponse.status, 200);
    const refreshResult = await refreshResponse.json();
    assert.equal(refreshResult.ok, true);
    assert.equal(refreshResult.ruCount, 1);
    assert.equal(refreshResult.enCount, 1);
    assert.equal(refreshResult.uniqueCount, 2);
    assert.ok(refreshResult.snapshotId);
    assert.ok(refreshResult.expiresAt);
  } finally {
    if (mockServer.listening) await new Promise<void>((resolve) => mockServer.close(() => resolve()));
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("HTTP E2E: admin registry-refresh with RU-only when allowed", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "reactions-e2e-"));
  const dbPath = path.join(directory, "test.sqlite");
  const store = new ReactionStore(dbPath, "synthetic");
  const app = express();
  
  const mockReports = express();
  mockReports.get("/ru.json", (_req, res) => {
    res.json({
      srt_levels: [{
        events: [{
          title: "RU only",
          description: "RU description",
          sources: ["https://example.com/ru"],
        }],
      }],
    });
  });
  
  const mockServer = createServer(mockReports);
  await new Promise<void>((resolve) => mockServer.listen(0, "127.0.0.1", resolve));
  const mockAddress = mockServer.address();
  if (!mockAddress || typeof mockAddress === "string") throw new Error("missing mock address");
  const mockBase = `http://127.0.0.1:${mockAddress.port}`;
  
  app.use("/api/reactions", express.json(), createReactionRouter({
    store,
    allowedOrigins: ["http://127.0.0.1"],
    adminToken: "test-editor-token",
    allowRuOnly: true,
  }));
  
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing test address");
  const base = `http://127.0.0.1:${address.port}/api/reactions`;
  
  try {
    const refreshResponse = await fetch(`${base}/editor/registry-refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer test-editor-token" },
      body: JSON.stringify({ ruUrl: `${mockBase}/ru.json` }),
    });
    assert.equal(refreshResponse.status, 200);
    const refreshResult = await refreshResponse.json();
    assert.equal(refreshResult.ok, true);
    assert.equal(refreshResult.ruCount, 1);
    assert.equal(refreshResult.enCount, 1);
    assert.equal(refreshResult.uniqueCount, 1);
  } finally {
    if (mockServer.listening) await new Promise<void>((resolve) => mockServer.close(() => resolve()));
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("HTTP E2E: admin registry-refresh rejects invalid report", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "reactions-e2e-"));
  const dbPath = path.join(directory, "test.sqlite");
  const store = new ReactionStore(dbPath, "synthetic");
  const app = express();
  
  const mockReports = express();
  mockReports.get("/invalid.json", (_req, res) => {
    res.json({ srt_levels: "invalid" });
  });
  
  const mockServer = createServer(mockReports);
  await new Promise<void>((resolve) => mockServer.listen(0, "127.0.0.1", resolve));
  const mockAddress = mockServer.address();
  if (!mockAddress || typeof mockAddress === "string") throw new Error("missing mock address");
  const mockBase = `http://127.0.0.1:${mockAddress.port}`;
  
  app.use("/api/reactions", express.json(), createReactionRouter({
    store,
    allowedOrigins: ["http://127.0.0.1"],
    adminToken: "test-editor-token",
    allowRuOnly: true,
  }));
  
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing test address");
  const base = `http://127.0.0.1:${address.port}/api/reactions`;
  
  try {
    const refreshResponse = await fetch(`${base}/editor/registry-refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer test-editor-token" },
      body: JSON.stringify({ ruUrl: `${mockBase}/invalid.json` }),
    });
    assert.equal(refreshResponse.status, 400);
    const result = await refreshResponse.json();
    assert.equal(result.error, "invalid_report_levels");
  } finally {
    if (mockServer.listening) await new Promise<void>((resolve) => mockServer.close(() => resolve()));
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
