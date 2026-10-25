import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyParserPatch, execute } from "../../automation/news-contract/actual-n8n-run.mjs";
import { buildPairedPayload, expectedContentVersion, validatePairedPayload } from "../news-contract/build-paired-news-data.mjs";
import { buildGenerationPrompt, hashJson, readBatches, validateGenerationResponse } from "./contracts.mjs";
import { codexMetadata, invokeCodex } from "./providers/codex-cli.mjs";
import { createRecordedResponseProvider } from "./providers/recorded-response.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const readJson = async file => JSON.parse(await readFile(file, "utf8"));
const writeJson = async (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`);

function identity(event) {
  return String(event.source_event_id || event.canonical_url || event.sources?.[0] || "").trim().replace(/\/$/, "");
}

export function mergeSourceBatch(baseline, batch, reportDate = "2026-10-25") {
  const report = structuredClone(baseline);
  report.date = reportDate;
  if (!Array.isArray(report.srt_levels)) throw new Error("baseline report has no srt_levels");
  const targets = new Set(batch.items.map(item => item.source_event_id));
  for (const level of report.srt_levels) {
    level.events = (level.events || []).filter(event => !targets.has(event.source_event_id) && !batch.items.some(item => identity(event) === identity(item)));
  }
  for (const item of batch.items) {
    const level = report.srt_levels.find(candidate => Number(candidate.level) === item.srt_level);
    if (!level) throw new Error(`baseline has no SRT level ${item.srt_level}`);
    level.events.push({
      title: item.title,
      fact: item.fact,
      why_important: "",
      related_levels: item.related_levels,
      sources: item.sources,
      source_event_id: item.source_event_id,
      canonical_url: item.canonical_url,
      news_id: item.news_id,
      importance: null,
    });
  }
  return report;
}

async function actualParserAndValidator(rawReport, nodesPath) {
  const nodes = await readJson(nodesPath);
  const parserCode = nodes["Parse Report to JSON"]?.parameters?.jsCode;
  const validatorCode = nodes["Validate Report"]?.parameters?.jsCode;
  if (!parserCode || !validatorCode) throw new Error("actual producer parser/validator code is missing");
  const parsed = await execute(applyParserPatch(parserCode), { output: JSON.stringify(rawReport) });
  const validated = await execute(validatorCode, parsed);
  if (!validated?._validation?.passed) throw new Error(`actual producer validation failed: ${(validated?._validation?.errors || []).join("; ")}`);
  return {
    parsed,
    validated,
    provenance: {
      parser_sha256: sha256(parserCode),
      validator_sha256: sha256(validatorCode),
      parser_patch: "pass-through only: source_event_id, canonical_url, news_id, importance, executive_explanation",
      network: "mocked HEAD=HTTP 200; no live source request",
      clock: "fixed 2026-10-25T12:00:00.000Z",
    },
  };
}

async function atomicWritePair(outDir, pair) {
  const stage = path.join(outDir, `.pair-stage-${process.pid}`);
  const target = path.join(outDir, "pair");
  await rm(stage, { recursive: true, force: true });
  await mkdir(stage, { recursive: true });
  try {
    await writeJson(path.join(stage, "latest-report.json"), pair.report);
    await writeJson(path.join(stage, "executive_data_ru.json"), pair.executive);
    validatePairedPayload(
      await readJson(path.join(stage, "latest-report.json")),
      await readJson(path.join(stage, "executive_data_ru.json")),
    );
    await rename(stage, target);
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
  return target;
}

export async function runGenerationBatch({
  editorialInput,
  batchIndex = 0,
  srtMapping,
  baselineReport,
  outDir,
  provider = invokeCodex,
  schemaPath = path.join(root, "automation/executive-generation/output.schema.json"),
  nodesPath = path.join(root, "automation/news-contract/producer-nodes-sanitized.json"),
  reportDate = "2026-10-25",
  timeoutMs,
}) {
  const batches = readBatches(editorialInput, srtMapping.items || srtMapping);
  const batch = batches[batchIndex];
  if (!batch) throw new Error(`batch index ${batchIndex} is unavailable`);
  await mkdir(outDir, { recursive: true });
  const rawReport = mergeSourceBatch(baselineReport, batch, reportDate);
  const producer = await actualParserAndValidator(rawReport, nodesPath);
  await writeJson(path.join(outDir, "01-actual-parser-report.json"), producer.parsed.report);
  await writeJson(path.join(outDir, "02-actual-validator.json"), producer.validated._validation);

  const prompt = buildGenerationPrompt(batch);
  await writeFile(path.join(outDir, "03-prompt.txt"), prompt);
  await writeJson(path.join(outDir, "04-generation-input.json"), { batch_id: batch.batch_id, items: batch.items });
  const invocation = await provider({ prompt, schemaPath, runDir: outDir, batchId: batch.batch_id, timeoutMs });
  await writeJson(path.join(outDir, "05-provider-response.json"), invocation.response);
  const accepted = validateGenerationResponse(batch, invocation.response);
  const acceptedById = new Map(accepted.map(item => [item.news_id, item]));
  const targetIds = new Set(batch.items.map(item => item.news_id));
  let matched = 0;
  for (const level of producer.parsed.report.srt_levels) {
    for (const event of level.events || []) {
      if (!targetIds.has(event.news_id)) continue;
      const generated = acceptedById.get(event.news_id);
      if (!generated) throw new Error(`accepted response missing ${event.news_id}`);
      event.importance = generated.importance;
      event.why_important = generated.executive_explanation.why_important;
      // Keep source fact and generated interpretation in separate fields. The UI
      // can safely render `fact` when the executive pair is rejected.
      event.description = event.fact;
      const version = expectedContentVersion(event, event.news_id, generated.importance);
      event.executive_explanation = { ...generated.executive_explanation, content_version: version };
      matched += 1;
    }
  }
  if (matched !== batch.items.length) throw new Error(`parsed report matched ${matched}/${batch.items.length} generated items`);
  const pair = buildPairedPayload(producer.parsed.report);
  const pairStats = validatePairedPayload(pair.report, pair.executive);
  for (const item of batch.items) {
    const entry = pair.executive.executive_events.find(candidate => candidate.news_id === item.news_id);
    if (entry?.status !== "available") throw new Error(`generated item is unavailable after binding: ${item.news_id}`);
  }
  const pairPath = await atomicWritePair(outDir, pair);
  const metadata = invocation.receipt?.provider === "codex-cli-chatgpt-subscription"
    ? await codexMetadata().catch(error => ({ unavailable: String(error) }))
    : { provider_metadata: "not requested for injected test provider" };
  const manifest = {
    schema_version: "executive-generation-run/v1",
    batch_id: batch.batch_id,
    input_sha256: hashJson(editorialInput),
    prompt_sha256: sha256(prompt),
    response_sha256: hashJson(invocation.response),
    source_item_count: batch.items.length,
    pair_stats: pairStats,
    generated_available_count: batch.items.length,
    producer: producer.provenance,
    provider: { ...metadata, ...invocation.receipt },
    pair_path: pairPath,
    boundaries: { production_write: false, n8n_execution: false, publish: false, analytics: false },
  };
  await writeJson(path.join(outDir, "RUN-MANIFEST.json"), manifest);
  return { batch, pair, manifest };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) result[argv[index].replace(/^--/, "")] = argv[index + 1];
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  for (const key of ["input", "srt-map", "baseline", "out"]) if (!args[key]) throw new Error(`missing --${key}`);
  if (Boolean(args["response-file"]) !== Boolean(args["receipt-manifest"])) {
    throw new Error("--response-file and --receipt-manifest must be provided together");
  }
  const provider = args["response-file"]
    ? await createRecordedResponseProvider(args["response-file"], args["receipt-manifest"])
    : invokeCodex;
  const result = await runGenerationBatch({
    editorialInput: await readJson(args.input),
    batchIndex: Number(args["batch-index"] || 0),
    srtMapping: await readJson(args["srt-map"]),
    baselineReport: await readJson(args.baseline),
    outDir: args.out,
    provider,
    reportDate: args["report-date"] || "2026-10-25",
    timeoutMs: Number(args["timeout-ms"] || 120_000),
  });
  console.log(JSON.stringify({ batch_id: result.batch.batch_id, report_content_version: result.pair.report.content_version, generated: result.manifest.generated_available_count }));
}
