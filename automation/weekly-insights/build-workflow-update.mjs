import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const [currentPath, outputPath] = process.argv.slice(2);
if (!currentPath || !outputPath) {
  throw new Error('Usage: node build-workflow-update.mjs CURRENT_WORKFLOW_JSON OUTPUT_JSON');
}

const base = path.dirname(new URL(import.meta.url).pathname);
const current = JSON.parse(await readFile(currentPath, 'utf8'));
const replacements = new Map([
  ['Fetch Archive from GitHub', await readFile(path.join(base, 'fetch-archive.js'), 'utf8')],
  ['Prepare OpenAI Request', await readFile(path.join(base, 'prepare-openai-request.js'), 'utf8')],
  ['Parse OpenAI Response', await readFile(path.join(base, 'parse-openai-response.js'), 'utf8')],
]);

const nodes = current.nodes.map((node) => replacements.has(node.name)
  ? { ...node, parameters: { ...node.parameters, jsCode: replacements.get(node.name) } }
  : node);
const payload = {
  name: current.name,
  nodes,
  connections: current.connections,
  settings: current.settings,
};
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ workflowId: current.id, replacedNodes: [...replacements.keys()], outputPath }));
