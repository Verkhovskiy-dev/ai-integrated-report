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
  const payload = api.buildToolPracticeRoute(tool, practice);

  if (!practice.id) errors.push(`${tool.name}: отсутствует стабильный id`);
  if (ids.has(practice.id)) errors.push(`${tool.name}: дублируется id ${practice.id}`);
  ids.add(practice.id);

  if (!practice.promise || !practice.artifact || !practice.duration) {
    errors.push(`${tool.name}: неполный контракт результата`);
  }
  if (!practice.starterInputs?.length || !practice.successCriteria?.length) {
    errors.push(`${tool.name}: нет стартовых данных или критериев успеха`);
  }
  if (payload.place.id !== `tool:${practice.id}`) {
    errors.push(`${tool.name}: неверный place.id`);
  }
  if (!payload.firstAction.acceptanceCriterion || !payload.resourceGap.artifact) {
    errors.push(`${tool.name}: Eken payload не содержит критерия или артефакта`);
  }
  if (payload.practice) {
    errors.push(`${tool.name}: автоматически созданный маршрут не должен использовать специализированный UI Browser Use`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`LLM → Eken routes valid: ${tools.length} tools, ${ids.size} unique routes`);
