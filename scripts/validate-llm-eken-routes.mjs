import fs from "node:fs";

const htmlPath = new URL("../llm-map/index.html", import.meta.url);
const toolsPath = new URL("../llm-map/data/llm-tools.json", import.meta.url);
const html = fs.readFileSync(htmlPath, "utf8");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((source) => source.trim() && !source.trim().startsWith("{"));
const source = scripts.at(-1);

if (!source) throw new Error("Не найден исполняемый script карты LLM");

const documentStub = { addEventListener() {} };
const windowStub = { location: { href: "https://verkhovskiy.ai/llm-map/" } };
const api = new Function(
  "document",
  "window",
  "crypto",
  `${source}; return { createDefaultToolPractice, buildToolPracticeRoute, stableToolId };`,
)(documentStub, windowStub, globalThis.crypto);

const data = JSON.parse(fs.readFileSync(toolsPath, "utf8"));
const tools = [];
for (const level of data.levels ?? []) {
  for (const category of level.categories ?? []) {
    for (const tool of category.tools ?? []) {
      tools.push({ ...tool, level: level.id, category: category.name });
    }
  }
}

const ids = new Set();
const errors = [];
for (const tool of tools) {
  const practice = api.createDefaultToolPractice(tool);
  const brief = {
    objective: practice.promise,
    realInput: `Тестовый материал для ${tool.name}`,
    successCriterion: practice.successCriteria.join("; "),
  };
  const payload = api.buildToolPracticeRoute(tool, practice, brief);

  if (!practice.id) errors.push(`${tool.name}: отсутствует стабильный id`);
  if (ids.has(practice.id)) errors.push(`${tool.name}: дублируется id ${practice.id}`);
  ids.add(practice.id);

  if (!practice.promise || !practice.artifact || !practice.duration) {
    errors.push(`${tool.name}: неполный контракт результата`);
  }
  if (!practice.starterInputs?.length || !practice.successCriteria?.length) {
    errors.push(`${tool.name}: нет стартовых данных или критериев успеха`);
  }
  if (payload.schemaVersion !== "2.0") {
    errors.push(`${tool.name}: ожидается контракт Eken 2.0`);
  }
  if (payload.source.id !== `tool:${practice.id}`) {
    errors.push(`${tool.name}: неверный source.id`);
  }
  if (payload.brief.realInput !== brief.realInput || !payload.brief.successCriterion) {
    errors.push(`${tool.name}: короткий бриф не передан в Eken payload`);
  }
  if (payload.instrument.existingTool !== tool.name || !payload.instrument.expectedArtifact) {
    errors.push(`${tool.name}: не передан выбранный инструмент или ожидаемый артефакт`);
  }
  if (!payload.learning.estimatedMinutes || !payload.learning.evidence) {
    errors.push(`${tool.name}: не задано обучение или доказательство результата`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`LLM → Eken routes valid: ${tools.length} tools, ${ids.size} unique routes`);
