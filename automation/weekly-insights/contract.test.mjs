import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const base = path.join(root, 'automation/weekly-insights');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const loadNode = async (name, parameters = []) => new AsyncFunction(
  ...parameters,
  await readFile(path.join(base, name), 'utf8'),
);

const githubArchiveRequest = async ({ url }) => {
  const parsed = new URL(url);
  const marker = '/gh-pages/';
  const markerIndex = parsed.pathname.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Unexpected test URL: ${url}`);
  const repositoryPath = parsed.pathname.slice(markerIndex + marker.length);
  const text = execFileSync('git', ['show', `origin/gh-pages:${repositoryPath}`], {
    cwd: root,
    encoding: 'utf8',
  });
  return JSON.parse(text);
};

const fetchNode = await loadNode('fetch-archive.js');
const fetchResult = await fetchNode.call({ helpers: { httpRequest: githubArchiveRequest } });
const archive = fetchResult[0].json;

if (!archive.combined_archive.includes('Факт:') || !archive.combined_archive.includes('Почему важно:')) {
  throw new Error('The weekly corpus does not contain grounded fact/importance fields');
}
if (archive.report_count !== 14 || archive.source_count < 30) {
  throw new Error(`Unexpected corpus size: ${archive.report_count} reports, ${archive.source_count} events`);
}

const prepareNode = await loadNode('prepare-openai-request.js', ['$input']);
const prepared = await prepareNode({ first: () => ({ json: archive }) });
if (!prepared[0].json.requestBody.response_format || prepared[0].json.requestBody.temperature !== 0.2) {
  throw new Error('The OpenAI request is missing deterministic JSON settings');
}

const events = Object.values(archive.source_index);
const byDate = new Map();
for (const event of events) {
  if (!byDate.has(event.date)) byDate.set(event.date, []);
  byDate.get(event.date).push(event);
}
const dates = [...byDate.keys()];
const cited = [byDate.get(dates[0])[0], byDate.get(dates[1])[0], byDate.get(dates[2])[0]];
const roles = ['entrepreneur', 'ceo', 'manager', 'cto', 'product', 'hr', 'cdo'];
const roleRecommendations = Object.fromEntries(roles.map((role, index) => [role, {
  relevance: 85 - index,
  action: `Проверить влияние сигнала и принять одно решение для роли ${role}`,
  expectedArtifact: `Decision brief для ${role}`,
  estimatedMinutes: 45,
}]));
const insights = Array.from({ length: 5 }, (_, index) => ({
  insightKey: `grounded-insight-${index + 1}`,
  title: `Проверяемый стратегический инсайт ${index + 1}`,
  subtitle: 'Синтез нескольких независимых событий периода',
  icon: 'TrendingUp',
  accentColor: '#22d3ee',
  summary: 'Несколько событий периода складываются в устойчивый структурный сдвиг. Он требует конкретного решения, а не дальнейшего наблюдения.',
  evidence: cited.map((event) => `${event.title}: подтверждённый факт`),
  evidenceSourceIds: cited.map((event) => event.eventId),
  nonObviousConclusion: 'Совокупность сигналов показывает изменение механизма создания ценности, которое не видно из одного события.',
  educationImplication: 'Нужно развивать способность связывать факты с проверяемым управленческим действием.',
  relevantPrograms: ['aiShift'],
  srtLevels: [3, 5, 9],
  trendDirection: 'strengthening',
  roleRecommendations,
  ekenBrief: {
    objective: 'Принять одно решение по обнаруженному структурному сдвигу',
    firstAction: 'Проверить влияние на одном действующем процессе',
    expectedArtifact: 'Одностраничный decision brief',
    acceptanceCriterion: 'Назначен владелец и первый шаг принят в работу',
    estimatedMinutes: 45,
  },
}));

const parseNode = await loadNode('parse-openai-response.js', ['$input', '$items']);
const parseInput = { first: () => ({ json: { choices: [{ message: { content: JSON.stringify({ insights }) } }] } }) };
const items = (name) => {
  if (name !== 'Fetch Archive from GitHub') throw new Error(`Unexpected upstream node: ${name}`);
  return [{ json: archive }];
};
const parsed = await parseNode(parseInput, items);
const report = parsed[0].json.report;
if (report.contractVersion !== '2.0' || report.quality.status !== 'passed') {
  throw new Error('The parser did not produce a validated v2 package');
}
if (!report.insights.every((insight) => insight.sourceEvents.length === 3 && insight.roleRecommendations.ceo && insight.ekenBrief)) {
  throw new Error('Grounding, role advice, or Eken brief was lost during parsing');
}

const invalid = structuredClone(insights);
invalid[0].evidenceSourceIds[0] = 'invented-event-id';
let rejected = false;
try {
  await parseNode(
    { first: () => ({ json: { choices: [{ message: { content: JSON.stringify({ insights: invalid }) } }] } }) },
    items,
  );
} catch {
  rejected = true;
}
if (!rejected) throw new Error('The validator accepted a fabricated event reference');

console.log(JSON.stringify({
  status: 'passed',
  reports: archive.report_count,
  sourceEvents: archive.source_count,
  groundedInsights: report.insights_count,
}));
