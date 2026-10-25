import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CODEX = "/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex";
const DISABLED_FEATURES = [
  "apps",
  "browser_use",
  "browser_use_external",
  "browser_use_full_cdp_access",
  "computer_use",
  "hooks",
  "image_generation",
  "in_app_browser",
  "memories",
  "multi_agent",
  "plugins",
  "remote_plugin",
  "shell_tool",
  "skill_search",
  "standalone_web_search",
  "unified_exec",
];

function runProcess(command, args, { cwd, input = "", timeoutMs = 120_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", error => { clearTimeout(timer); reject(error); });
    child.on("close", code => {
      clearTimeout(timer);
      if (timedOut) return reject(new Error(`provider timeout after ${timeoutMs}ms`));
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(input);
  });
}

export async function codexMetadata(codexBin = process.env.CODEX_BIN || DEFAULT_CODEX) {
  const version = await runProcess(codexBin, ["--version"], { timeoutMs: 10_000 });
  const auth = await runProcess(codexBin, ["login", "status"], { timeoutMs: 10_000 });
  return {
    command: codexBin,
    version: version.stdout.trim(),
    auth_status: `${auth.stdout}\n${auth.stderr}`.split("\n").find(line => line.includes("Logged in")) || "unconfirmed",
  };
}

export async function invokeCodex({ prompt, schemaPath, runDir, batchId, timeoutMs = 120_000, model = process.env.EXECUTIVE_MODEL || "gpt-6.1-sol" }) {
  const codexBin = process.env.CODEX_BIN || DEFAULT_CODEX;
  await mkdir(runDir, { recursive: true });
  const outputPath = path.join(runDir, `${batchId}.provider-output.json`);
  const eventsPath = path.join(runDir, `${batchId}.provider-events.jsonl`);
  const stderrPath = path.join(runDir, `${batchId}.provider-stderr.log`);
  const args = [
    "exec",
    "--ephemeral",
    "--ignore-user-config",
    "--ignore-rules",
    "--sandbox", "read-only",
    "--skip-git-repo-check",
    "--model", model,
    "--output-schema", schemaPath,
    "--output-last-message", outputPath,
    "--json",
    ...DISABLED_FEATURES.flatMap(feature => ["--disable", feature]),
    "-",
  ];
  const startedAt = new Date().toISOString();
  const result = await runProcess(codexBin, args, { cwd: runDir, input: prompt, timeoutMs });
  const stoppedAt = new Date().toISOString();
  await writeFile(eventsPath, result.stdout);
  await writeFile(stderrPath, result.stderr);
  if (result.code !== 0) throw new Error(`provider exited ${result.code}; see ${stderrPath}`);
  const providerEvents = result.stdout.split("\n").filter(Boolean).map(line => {
    try { return JSON.parse(line); } catch { return { type: "unparseable_event" }; }
  });
  const toolEvents = providerEvents.filter(event => {
    const kinds = [event.type, event.item?.type, event.item?.tool_name].filter(Boolean).join(" ");
    return /(tool|command|shell|mcp|browser|web_search|computer)/i.test(kinds);
  });
  if (toolEvents.length) throw new Error(`provider attempted ${toolEvents.length} tool call(s); generation rejected`);
  const usage = providerEvents.find(event => event.type === "turn.completed")?.usage || null;
  const response = JSON.parse(await readFile(outputPath, "utf8"));
  return {
    response,
    receipt: {
      provider: "codex-cli-chatgpt-subscription",
      command: codexBin,
      args,
      model_requested: model,
      started_at: startedAt,
      stopped_at: stoppedAt,
      exit_code: result.code,
      hard_disabled_features: DISABLED_FEATURES,
      tool_call_count: 0,
      usage,
      isolation_note: "User config/rules ignored; tools disabled by supported CLI feature flags; model cwd contains only run evidence. Host read isolation was not separately proven.",
      output_path: outputPath,
      events_path: eventsPath,
      stderr_path: stderrPath,
    },
  };
}
