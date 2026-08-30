import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const [dataPath, siteRoot, publicOrigin = "https://verkhovskiy.ai"] = process.argv.slice(2);
if (!dataPath || !siteRoot) throw new Error("Usage: generate-news-share-pages <latest-report.json> <site-root> [origin]");

const report = JSON.parse(await readFile(dataPath, "utf8"));
const outputRoot = path.resolve(siteRoot, "share", "news");
if (!outputRoot.startsWith(path.resolve(siteRoot) + path.sep)) throw new Error("Unsafe output path");
await rm(outputRoot, { recursive: true, force: true });

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
const escapeXml = escapeHtml;
const shareId = (prefix, key) => {
  const normalized = String(key).toLowerCase().normalize("NFKD").replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "").slice(0, 42);
  let hash = 2166136261;
  for (const char of String(key)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${prefix}-${normalized || "item"}-${(hash >>> 0).toString(36)}`;
};
const wrap = (text, max, lines) => {
  const words = String(text ?? "").split(/\s+/); const out = []; let line = "";
  for (const word of words) { const next = line ? `${line} ${word}` : word; if (next.length > max && line) { out.push(line); line = word; } else line = next; if (out.length === lines - 1) break; }
  if (line && out.length < lines) out.push(line);
  if (words.join(" ").length > out.join(" ").length) out[out.length - 1] = out[out.length - 1].replace(/[.…]*$/, "…");
  return out;
};
const textLines = (lines, x, y, size, gap, color, weight = 500) => lines.map((line, i) => `<text x="${x}" y="${y + i * gap}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXml(line)}</text>`).join("");

const events = (report.srt_levels ?? []).flatMap(level => (level.events ?? []).map(event => ({ ...event, level: level.level })));
for (const event of events) {
  const id = shareId("news", event.title);
  const dir = path.join(outputRoot, id); await mkdir(dir, { recursive: true });
  const pageUrl = `${publicOrigin}/share/news/${id}/`;
  const dashboardUrl = `${publicOrigin}/?share=${encodeURIComponent(id)}#${encodeURIComponent(id)}`;
  const imageUrl = `${pageUrl}card.png`;
  const titleLines = wrap(event.title, 43, 4);
  const descLines = wrap(event.description, 83, 3);
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07131d"/><stop offset="1" stop-color="#0d2330"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><rect x="52" y="48" width="1096" height="534" rx="28" fill="#0b1924" stroke="#31c7d9" stroke-opacity=".28"/><rect x="52" y="48" width="8" height="534" rx="4" fill="#31c7d9"/><text x="92" y="105" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#31c7d9">VERKHOVSKIY AI · НОВОСТЬ</text><text x="1060" y="105" text-anchor="end" font-family="Arial,sans-serif" font-size="20" fill="#7b98a8">УРОВЕНЬ ${event.level}</text>${textLines(titleLines,92,175,42,52,"#f3f7f9",700)}${textLines(descLines,92,420,22,32,"#9bb0bc",400)}<line x1="92" y1="530" x2="1105" y2="530" stroke="#28404d"/><text x="92" y="562" font-family="Arial,sans-serif" font-size="18" fill="#6f8b99">${escapeXml(report.date ?? "AI Integrated Report")}</text><text x="1105" y="562" text-anchor="end" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#31c7d9">VERKHOVSKIY.AI →</text></svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  await writeFile(path.join(dir, "card.png"), png);
  const source = event.sources?.[0] ? `<a class="source" href="${escapeHtml(event.sources[0])}" target="_blank" rel="noopener">Первоисточник ↗</a>` : "";
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(event.title)} — Verkhovskiy AI</title><meta name="description" content="${escapeHtml(event.description)}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(event.title)}"><meta property="og:description" content="${escapeHtml(event.description)}"><meta property="og:url" content="${escapeHtml(pageUrl)}"><meta property="og:image" content="${escapeHtml(imageUrl)}"><meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(event.title)}"><meta name="twitter:description" content="${escapeHtml(event.description)}"><meta name="twitter:image" content="${escapeHtml(imageUrl)}"><link rel="canonical" href="${escapeHtml(pageUrl)}"><style>*{box-sizing:border-box}body{margin:0;background:#06111a;color:#f3f7f9;font-family:Arial,sans-serif}.shell{max-width:1040px;margin:auto;padding:32px 20px 64px}.brand{color:#31c7d9;font-weight:700;letter-spacing:.08em;margin:12px 0 24px}.card{background:#0b1924;border:1px solid #1c5261;border-radius:22px;overflow:hidden}.card img{display:block;width:100%;height:auto}.content{padding:28px 34px 34px}h1{font-size:clamp(28px,5vw,48px);line-height:1.08;margin:0 0 18px}p{color:#a9bac4;font-size:18px;line-height:1.65;margin:0}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.actions a{padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700}.dashboard{background:#31c7d9;color:#041016}.source{border:1px solid #315363;color:#b9c8d0}@media(max-width:600px){.shell{padding:18px 12px 40px}.content{padding:22px 20px}p{font-size:16px}}</style></head><body><main class="shell"><div class="brand">VERKHOVSKIY AI · НОВОСТЬ</div><article class="card"><img src="card.png" width="1200" height="630" alt="${escapeHtml(event.title)}"><div class="content"><h1>${escapeHtml(event.title)}</h1><p>${escapeHtml(event.description)}</p><div class="actions"><a class="dashboard" href="${escapeHtml(dashboardUrl)}">Открыть в дашборде →</a>${source}</div></div></article></main></body></html>`;
  await writeFile(path.join(dir, "index.html"), html);
}
console.log(`Generated ${events.length} news share pages in ${outputRoot}`);
