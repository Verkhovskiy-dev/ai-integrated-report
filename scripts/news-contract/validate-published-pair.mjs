#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { validatePairedPayload } from "./build-paired-news-data.mjs";

export function validatePublishedPair(report, executive) {
  const reportVersioned = typeof report?.content_version === "string" && report.content_version.startsWith("report_");
  const executiveVersioned = executive?.schema_version === "news-executive/v1";
  if (!reportVersioned && !executiveVersioned) return { mode: "legacy", validated: false };
  if (!reportVersioned || !executiveVersioned) throw new Error("one-sided versioned news pair");
  const stats = validatePairedPayload(report, executive);
  return { mode: "versioned", validated: true, ...stats, report_content_version: report.content_version };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [reportPath, executivePath] = process.argv.slice(2);
  if (!reportPath || !executivePath) throw new Error("Usage: validate-published-pair.mjs <latest-report.json> <executive_data_ru.json>");
  const [report, executive] = await Promise.all([
    readFile(reportPath, "utf8").then(JSON.parse),
    readFile(executivePath, "utf8").then(JSON.parse),
  ]);
  console.log(JSON.stringify(validatePublishedPair(report, executive)));
}
