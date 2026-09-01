// n8n Code node: fail closed when insights are ungrounded or incomplete.
const response = $input.first().json;
const archive = $items('Fetch Archive from GitHub')[0].json;
const sourceIndex = archive.source_index || {};
const content = response.choices?.[0]?.message?.content || response.data?.choices?.[0]?.message?.content;
if (!content) throw new Error('OpenAI response has no message content');

let parsed;
try {
  parsed = JSON.parse(content);
} catch (error) {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`OpenAI returned invalid JSON: ${error.message}`);
  parsed = JSON.parse(match[0]);
}

if (!Array.isArray(parsed.insights) || parsed.insights.length < 5 || parsed.insights.length > 7) {
  throw new Error(`Expected 5–7 insights, received ${parsed.insights?.length || 0}`);
}

const ICONS = ['Building', 'Bot', 'Landmark', 'Brain', 'ShieldAlert', 'Layers', 'GraduationCap', 'Zap', 'Globe', 'Shield', 'TrendingUp', 'Database'];
const COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316', '#ec4899'];
const PROGRAMS = ['aiShift', 'intensiveAI', 'intensiveAgents', 'dataDriven', 'ubnd', 'aiMarketing'];
const DIRECTIONS = ['strengthening', 'weakening', 'emerging', 'stable'];
const ROLES = ['entrepreneur', 'ceo', 'manager', 'cto', 'product', 'hr', 'cdo'];
const requiredText = (value, field, min = 12) => {
  const result = String(value || '').trim();
  if (result.length < min) throw new Error(`${field} is missing or too short`);
  return result;
};
const clampMinutes = (value) => Math.min(240, Math.max(15, Math.round(Number(value) || 60)));
const slug = (value, index) => String(value || `insight-${index + 1}`)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 64) || `insight-${index + 1}`;

const seenKeys = new Set();
const seenTitles = new Set();
const insights = parsed.insights.map((raw, index) => {
  const insightKey = slug(raw.insightKey || raw.title, index);
  const title = requiredText(raw.title, `insights[${index}].title`, 6);
  if (seenKeys.has(insightKey)) throw new Error(`Duplicate insightKey: ${insightKey}`);
  if (seenTitles.has(title.toLowerCase())) throw new Error(`Duplicate insight title: ${title}`);
  seenKeys.add(insightKey);
  seenTitles.add(title.toLowerCase());

  const evidenceSourceIds = [...new Set(Array.isArray(raw.evidenceSourceIds) ? raw.evidenceSourceIds : [])]
    .filter((eventId) => sourceIndex[eventId]);
  if (evidenceSourceIds.length < 3 || evidenceSourceIds.length > 5) {
    throw new Error(`${insightKey} must cite 3–5 valid eventIds; received ${evidenceSourceIds.length}`);
  }
  const sourceEvents = evidenceSourceIds.map((eventId) => sourceIndex[eventId]);
  const sourceDates = new Set(sourceEvents.map((event) => event.date));
  if (sourceDates.size < 2) throw new Error(`${insightKey} cites fewer than two report dates`);

  const evidence = (Array.isArray(raw.evidence) ? raw.evidence : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 5);
  if (evidence.length < 3) throw new Error(`${insightKey} has fewer than three evidence statements`);

  const roleRecommendations = {};
  for (const role of ROLES) {
    const recommendation = raw.roleRecommendations?.[role];
    if (!recommendation) throw new Error(`${insightKey} has no recommendation for ${role}`);
    roleRecommendations[role] = {
      relevance: Math.min(100, Math.max(0, Math.round(Number(recommendation.relevance) || 0))),
      action: requiredText(recommendation.action, `${insightKey}.${role}.action`, 12),
      expectedArtifact: requiredText(recommendation.expectedArtifact, `${insightKey}.${role}.expectedArtifact`, 5),
      estimatedMinutes: clampMinutes(recommendation.estimatedMinutes),
    };
  }

  const brief = raw.ekenBrief || {};
  const ekenBrief = {
    objective: requiredText(brief.objective, `${insightKey}.ekenBrief.objective`),
    firstAction: requiredText(brief.firstAction, `${insightKey}.ekenBrief.firstAction`),
    expectedArtifact: requiredText(brief.expectedArtifact, `${insightKey}.ekenBrief.expectedArtifact`, 5),
    acceptanceCriterion: requiredText(brief.acceptanceCriterion, `${insightKey}.ekenBrief.acceptanceCriterion`),
    estimatedMinutes: clampMinutes(brief.estimatedMinutes),
  };

  const domains = new Set(sourceEvents.flatMap((event) => event.urls).map((url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  }).filter(Boolean));
  const confidence = domains.size >= 3 && sourceDates.size >= 3 ? 'high'
    : domains.size >= 2 ? 'medium'
    : 'low';

  return {
    id: index + 1,
    insightKey,
    title,
    subtitle: requiredText(raw.subtitle, `${insightKey}.subtitle`, 5),
    icon: ICONS.includes(raw.icon) ? raw.icon : ICONS[index % ICONS.length],
    accentColor: COLORS.includes(raw.accentColor) ? raw.accentColor : COLORS[index % COLORS.length],
    summary: requiredText(raw.summary, `${insightKey}.summary`, 40),
    evidence,
    evidenceSourceIds,
    sourceEvents,
    confidence,
    nonObviousConclusion: requiredText(raw.nonObviousConclusion, `${insightKey}.nonObviousConclusion`, 30),
    educationImplication: requiredText(raw.educationImplication, `${insightKey}.educationImplication`, 20),
    relevantPrograms: [...new Set(Array.isArray(raw.relevantPrograms) ? raw.relevantPrograms : [])]
      .filter((program) => PROGRAMS.includes(program)).slice(0, 3),
    srtLevels: [...new Set(Array.isArray(raw.srtLevels) ? raw.srtLevels.map(Number) : [])]
      .filter((level) => Number.isInteger(level) && level >= 1 && level <= 9),
    trendDirection: DIRECTIONS.includes(raw.trendDirection) ? raw.trendDirection : 'stable',
    roleRecommendations,
    ekenBrief,
  };
});

const result = {
  contractVersion: '2.0',
  generated_at: new Date().toISOString(),
  period: archive.date_range,
  insights_count: insights.length,
  quality: {
    status: 'passed',
    validatorVersion: '2.0',
    sourceReportCount: archive.report_count,
    sourceEventCount: archive.source_count,
    groundedInsightCount: insights.length,
  },
  insights,
};
const jsonString = JSON.stringify(result, null, 2);
return [{ json: { report: result, jsonString, contentBase64: Buffer.from(jsonString).toString('base64') } }];
