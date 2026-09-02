import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = await mkdtemp(path.join(tmpdir(), "news-share-pages-"));

try {
  const existingDir = path.join(root, "share", "v3", "news", "previous-token");
  await mkdir(existingDir, { recursive: true });
  await writeFile(path.join(existingDir, "index.html"), "permanent old share page");

  const reportPath = path.join(root, "latest-report.json");
  await writeFile(reportPath, JSON.stringify({
    date: "2026-09-02",
    srt_levels: [{
      level: 3,
      events: [{
        title: "Новая тестовая новость",
        description: "Описание новой тестовой новости",
        sources: ["https://example.com/source"],
      }],
    }],
  }));

  await execFileAsync(process.execPath, [
    path.resolve("scripts/generate-news-share-pages.mjs"),
    reportPath,
    root,
    "https://verkhovskiy.ai",
  ]);

  assert.equal(
    await readFile(path.join(existingDir, "index.html"), "utf8"),
    "permanent old share page",
    "previously published share page must survive regeneration",
  );

  const generatedRoot = path.join(root, "share", "v3", "news");
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(generatedRoot);
  assert.ok(entries.some(entry => entry !== "previous-token" && entry !== ".report-digest"));
  assert.match(await readFile(path.join(generatedRoot, ".report-digest"), "utf8"), /^[a-f0-9]{64}\n$/);

  console.log("News share pages preserve previously published URLs");
} finally {
  await rm(root, { recursive: true, force: true });
}
