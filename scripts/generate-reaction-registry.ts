import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { registryEntriesFromReport } from "../server/reactions/registry";

const root = path.resolve(import.meta.dirname, "..");
const report = JSON.parse(await readFile(path.join(root, "data", "latest-report.json"), "utf8"));
const unique = registryEntriesFromReport(report);
await writeFile(
  path.join(root, "server", "reactions", "news-registry.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), entries: unique }, null, 2)}\n`,
);
console.log(`reaction registry: ${unique.length} news versions`);
