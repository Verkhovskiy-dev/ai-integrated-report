import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const routes = JSON.parse(fs.readFileSync(new URL('../client/src/data/seoRoutes.json', import.meta.url), 'utf8'));
const base = 'https://verkhovskiy.ai';
const escape = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export function prepareSeo(site) {
  const source = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  for (const [route, [title, description]] of Object.entries(routes)) {
    let html = source
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(title)}</title>`)
      .replace(/<meta\b[^>]*name=["']description["'][^>]*>\n?/gi, '')
      .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\n?/gi, '')
      .replace(/<meta\b[^>]*name=["']robots["'][^>]*>\n?/gi, '')
      .replace(/<nav\b[^>]*id="seo-navigation"[\s\S]*?<\/nav>\n?/gi, '');
    if (!html.includes('href="/favicon.png"')) html = html.replace('</head>', '<link rel="icon" type="image/png" sizes="192x192" href="/favicon.png">\n</head>');
    html = html.replace('</head>', `<meta name="description" content="${escape(description)}">\n<link rel="canonical" href="${base}${route}">\n</head>`);
    // Ordinary, visible crawlable navigation, independent of React/data requests.
    html = html.replace('</body>', '<nav id="seo-navigation" aria-label="Разделы сайта" style="padding:24px;text-align:center;font:14px system-ui"><a href="/">Дашборд</a> · <a href="/reports/">Архив ежедневных отчётов</a> · <a href="/programs/">Программы</a></nav>\n</body>');
    const output = path.join(site, route, 'index.html');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, html);
  }
  const fallback = source.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\n?/gi, '').replace(/<meta\b[^>]*name=["']robots["'][^>]*>\n?/gi, '').replace('</head>', '<meta name="robots" content="noindex,follow">\n</head>');
  fs.writeFileSync(path.join(site, '404.html'), fallback);
  const publicDir = fileURLToPath(new URL('../client/public/', import.meta.url));
  for (const name of ['favicon.svg', 'favicon.png']) fs.copyFileSync(path.join(publicDir, name), path.join(site, name));
  const sitemap = path.join(site, 'sitemap.xml');
  if (fs.existsSync(sitemap)) {
    const xml = fs.readFileSync(sitemap, 'utf8').replaceAll('<loc>https://verkhovskiy.ai/programs</loc>', '<loc>https://verkhovskiy.ai/programs/</loc>');
    fs.writeFileSync(sitemap, xml);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) prepareSeo(path.resolve(process.argv[2] || 'dist/public'));
