import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const [dataPath, siteRoot, publicOrigin = "https://verkhovskiy.ai"] = process.argv.slice(2);
if (!dataPath || !siteRoot) {
  throw new Error("Usage: generate-place-share-pages <places_data.json> <site-root> [origin]");
}

const placesSource = await readFile(dataPath, "utf8");
const placesData = JSON.parse(placesSource);
if (!Array.isArray(placesData.places)) throw new Error("places_data.json must contain a places array");

const resolvedSiteRoot = path.resolve(siteRoot);
const outputRoot = path.resolve(resolvedSiteRoot, "share", "v1", "places");
if (!outputRoot.startsWith(resolvedSiteRoot + path.sep)) throw new Error("Unsafe output path");
await rm(outputRoot, { recursive: true, force: true });

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

const wrap = (value, maxCharacters, maxLines) => {
  const words = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  let consumed = 0;
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharacters && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
    consumed += 1;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (consumed < words.length && lines.length) lines[lines.length - 1] = `${lines.at(-1).replace(/[.…]*$/, "")}…`;
  return lines;
};

const textLines = (lines, x, y, size, lineHeight, color, weight = 500) => lines
  .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeHtml(line)}</text>`)
  .join("");

const levelColors = {
  1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#84cc16", 5: "#22c55e",
  6: "#06b6d4", 7: "#3b82f6", 8: "#8b5cf6", 9: "#ec4899",
};
const capacityLabels = { large: "Крупная ёмкость", medium: "Средняя ёмкость", small: "Малая ёмкость" };
const windowLabels = { open: "Окно открыто", narrowing: "Окно сужается", closing: "Окно закрывается" };

for (const place of placesData.places) {
  if (!/^[a-z0-9-]+$/.test(place.id)) throw new Error(`Unsafe place id: ${place.id}`);
  const directory = path.join(outputRoot, place.id);
  await mkdir(directory, { recursive: true });

  const pageUrl = `${publicOrigin}/share/v1/places/${place.id}/`;
  const imageUrl = `${pageUrl}card.png`;
  const dashboardUrl = `${publicOrigin}/places.html?place=${encodeURIComponent(place.id)}`;
  const accent = levelColors[place.srt_level] || "#31c7d9";
  const capacity = capacityLabels[place.capacity?.category] || "Ёмкость оценивается";
  const windowLabel = windowLabels[place.window?.category] || "Окно оценивается";
  const metaDescription = `${place.description} СРТ-${place.srt_level} · ${capacity} · ${windowLabel}`.slice(0, 520);
  const titleLines = wrap(place.name, 42, 4);
  const descriptionLines = wrap(place.description, 82, 3);

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07111b"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><rect x="52" y="48" width="1096" height="534" rx="28" fill="#111620" stroke="${accent}" stroke-opacity=".42"/><rect x="52" y="48" width="8" height="534" rx="4" fill="${accent}"/><text x="92" y="105" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#31c7d9">VERKHOVSKIY AI · КАРТА МЕСТ</text><text x="1105" y="105" text-anchor="end" font-family="Arial,sans-serif" font-size="20" fill="${accent}">СРТ-${place.srt_level}</text>${textLines(titleLines, 92, 175, 42, 52, "#f3f7f9", 700)}${textLines(descriptionLines, 92, 420, 22, 32, "#9bb0bc", 400)}<line x1="92" y1="530" x2="1105" y2="530" stroke="#28404d"/><text x="92" y="562" font-family="Arial,sans-serif" font-size="18" fill="#8ea4b0">${escapeHtml(capacity)} · ${escapeHtml(windowLabel)}</text><text x="1105" y="562" text-anchor="end" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#31c7d9">ОТКРЫТЬ МЕСТО →</text></svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  await writeFile(path.join(directory, "card.png"), png);

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(place.name)} — Карта мест · Verkhovskiy AI</title><meta name="description" content="${escapeHtml(metaDescription)}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(place.name)}"><meta property="og:description" content="${escapeHtml(metaDescription)}"><meta property="og:url" content="${escapeHtml(pageUrl)}"><meta property="og:image" content="${escapeHtml(imageUrl)}"><meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(place.name)}"><meta name="twitter:description" content="${escapeHtml(metaDescription)}"><meta name="twitter:image" content="${escapeHtml(imageUrl)}"><link rel="canonical" href="${escapeHtml(pageUrl)}"><style>*{box-sizing:border-box}body{margin:0;background:#07111b;color:#f3f7f9;font-family:Arial,sans-serif}.shell{max-width:1040px;margin:auto;padding:32px 20px 64px}.brand{color:#31c7d9;font-weight:700;letter-spacing:.08em;margin:12px 0 24px}.card{background:#111620;border:1px solid ${accent}66;border-radius:22px;overflow:hidden}.card img{display:block;width:100%;height:auto}.content{padding:28px 34px 34px}.level{color:${accent};font-weight:700;font-size:14px;letter-spacing:.08em;text-transform:uppercase}h1{font-size:clamp(28px,5vw,48px);line-height:1.08;margin:10px 0 18px}p{color:#a9bac4;font-size:18px;line-height:1.65;margin:0}.meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.meta span{border:1px solid #315363;border-radius:999px;padding:7px 11px;color:#b9c8d0}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.actions a{padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700}.dashboard{background:#31c7d9;color:#041016}@media(max-width:600px){.shell{padding:18px 12px 40px}.content{padding:22px 20px}p{font-size:16px}}</style><script>if(!new URLSearchParams(location.search).has("preview"))setTimeout(()=>location.replace(${JSON.stringify(dashboardUrl)}),250)</script></head><body><main class="shell"><div class="brand">VERKHOVSKIY AI · МЕСТО В СРТ</div><article class="card"><img src="card.png" width="1200" height="630" alt="${escapeHtml(place.name)}"><div class="content"><div class="level">СРТ-${place.srt_level} · ${escapeHtml(place.srt_level_name)}</div><h1>${escapeHtml(place.name)}</h1><p>${escapeHtml(place.description)}</p><div class="meta"><span>${escapeHtml(capacity)}</span><span>${escapeHtml(windowLabel)}</span></div><div class="actions"><a class="dashboard" href="${escapeHtml(dashboardUrl)}">Открыть место на карте →</a></div></div></article></main></body></html>`;
  await writeFile(path.join(directory, "index.html"), html);
}

await writeFile(path.join(outputRoot, ".places-digest"), `${createHash("sha256").update(placesSource).digest("hex")}\n`);
console.log(`Generated ${placesData.places.length} place share pages in ${outputRoot}`);
