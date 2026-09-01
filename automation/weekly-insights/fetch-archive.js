// n8n Code node: build a grounded 14-report corpus and a source index.
// Public archive reads intentionally use raw.githubusercontent.com and do not require a PAT.
const RAW_BASE = 'https://raw.githubusercontent.com/Verkhovskiy-dev/ai-integrated-report/gh-pages/data/archive';

const manifest = await this.helpers.httpRequest({
  method: 'GET',
  url: `${RAW_BASE}/manifest.json`,
  json: true,
});

const recentFiles = (Array.isArray(manifest) ? manifest : [])
  .filter((name) => typeof name === 'string' && /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
  .sort()
  .slice(-14);

if (recentFiles.length < 7) {
  throw new Error(`Not enough archive reports: ${recentFiles.length}`);
}

const clean = (value, maxLength) => String(value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);
const validUrls = (event) => {
  const candidates = Array.isArray(event.sources)
    ? event.sources
    : [event.source_url, event.url, event.source];
  return [...new Set(candidates
    .filter((value) => typeof value === 'string' && /^https?:\/\//i.test(value)))]
    .slice(0, 2);
};
const levelNumber = (level) => {
  const direct = Number(level.level);
  if (Number.isInteger(direct)) return direct;
  const match = String(level.level_name || level.name || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const reports = [];
const sourceIndex = {};

for (const filename of recentFiles) {
  try {
    const report = await this.helpers.httpRequest({
      method: 'GET',
      url: `${RAW_BASE}/${filename}`,
      json: true,
    });
    const date = clean(report.date || filename.replace('.json', ''), 10);
    const lines = [`\n===== ОТЧЁТ: ${date} =====`];
    let reportEventIndex = 0;

    for (const level of Array.isArray(report.srt_levels) ? report.srt_levels : []) {
      const srtLevel = levelNumber(level);
      let acceptedInLevel = 0;
      for (const event of Array.isArray(level.events) ? level.events : []) {
        reportEventIndex += 1;
        const eventId = `${date}-l${srtLevel}-e${String(reportEventIndex).padStart(2, '0')}`;
        const title = clean(event.title || event.headline, 240);
        const fact = clean(event.fact || event.description || event.analysis || event.summary, 520);
        const whyImportant = clean(event.why_important || event.whyImportant, 300);
        const urls = validUrls(event);
        if (!title || !fact || urls.length === 0) continue;
        if (acceptedInLevel >= 2) continue;
        acceptedInLevel += 1;

        sourceIndex[eventId] = { eventId, date, title, srtLevel, urls };
        lines.push(
          `[${eventId}] СРТ-${srtLevel} · ${title}\n` +
          `Факт: ${fact}\n` +
          (whyImportant ? `Почему важно: ${whyImportant}\n` : '') +
          `Источники: ${urls.join(' | ')}`,
        );
      }
    }

    const appendAnalyticalSection = (label, items) => {
      if (!Array.isArray(items) || items.length === 0) return;
      lines.push(`\n${label}:`);
      for (const item of items.slice(0, 12)) {
        const title = clean(item.title || item.from || item.name, 240);
        const description = clean(item.description || item.to || item.rationale, 500);
        if (title || description) lines.push(`- ${title}${description ? `: ${description}` : ''}`);
      }
    };
    appendAnalyticalSection('МЕЖУРОВНЕВЫЕ СВЯЗИ', report.cross_level_links);
    appendAnalyticalSection('СТРУКТУРНЫЕ СДВИГИ', report.structural_shifts);
    appendAnalyticalSection('СИГНАЛЫ РАДАРА', report.radar_signals);

    reports.push({ date, filename, text: lines.join('\n') });
  } catch (error) {
    console.log(`Archive warning for ${filename}: ${error.message}`);
  }
}

if (reports.length < 7) throw new Error(`Only ${reports.length} archive reports were readable`);
const sourceCount = Object.keys(sourceIndex).length;
if (sourceCount < 30) throw new Error(`Grounded source corpus is too small: ${sourceCount} events`);

return [{
  json: {
    contract_version: '2.0',
    combined_archive: reports.map((report) => report.text).join('\n\n---\n\n'),
    source_index: sourceIndex,
    source_count: sourceCount,
    report_count: reports.length,
    date_range: `${reports[0].date} — ${reports[reports.length - 1].date}`,
  },
}];
