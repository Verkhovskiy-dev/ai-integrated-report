import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  const indexTemplate = await readFile(path.join(staticPath, "index.html"), "utf8");

  const shareMeta: Record<string, { ru: [string, string]; en: [string, string] }> = {
    "hero-summary": { ru: ["Главное за неделю", "Ключевые события и изменения в AI-индустрии."], en: ["Executive summary", "The key events and changes shaping the AI industry."] },
    news: { ru: ["Последние события в AI", "Новости AI-индустрии с оценкой значимости и источниками."], en: ["Latest AI events", "AI industry events with impact assessment and sources."] },
    trends: { ru: ["Динамика AI-трендов", "Какие AI-тренды ускоряются, а какие теряют моментум."], en: ["AI trend dynamics", "The AI trends gaining and losing momentum."] },
    heatmap: { ru: ["Карта активности AI", "Интенсивность событий по уровням Структуры Разделения Труда."], en: ["AI activity heatmap", "Event intensity across the Structure of Labor Division."] },
    insights: { ru: ["Стратегические инсайты", "Ключевые структурные выводы для руководителей и команд."], en: ["Strategic insights", "Key structural insights for leaders and teams."] },
    takeaways: { ru: ["Практические выводы", "Рекомендуемые действия на основе сигналов недели."], en: ["Practical takeaways", "Recommended actions based on this week's signals."] },
    themes: { ru: ["Ключевые темы и компании", "Частотный анализ тем и игроков AI-индустрии."], en: ["Key themes and companies", "Frequency analysis of AI industry themes and players."] },
    shifts: { ru: ["Структурные сдвиги", "Устойчивые трансформации, меняющие AI-экономику."], en: ["Structural shifts", "Persistent transformations reshaping the AI economy."] },
    connections: { ru: ["Межуровневые связи", "Причинно-следственные цепочки между уровнями AI-экономики."], en: ["Cross-level connections", "Causal chains across layers of the AI economy."] },
    signals: { ru: ["Радар слабых сигналов", "Ранние индикаторы будущих структурных изменений."], en: ["Weak signals radar", "Early indicators of future structural change."] },
    wow: { ru: ["Сравнение недель", "Как изменилась AI-повестка относительно прошлой недели."], en: ["Week-over-week", "How the AI landscape changed from last week."] },
    forecasts: { ru: ["Прогнозы AI", "Прогнозы на основе динамики отраслевых сигналов."], en: ["AI forecasts", "Forecasts based on industry signal dynamics."] },
  };

  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

  app.set("trust proxy", true);
  app.use(express.static(staticPath, { index: false }));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (req, res) => {
    const block = typeof req.query.share === "string" ? shareMeta[req.query.share] : undefined;
    if (!block) return res.type("html").send(indexTemplate);

    const locale = req.query.lang === "en" ? "en" : "ru";
    const [title, description] = block[locale];
    const pageTitle = `${title} — AI Integrated Report`;
    const pageUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const socialMeta = [
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
      `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
      `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    ].join("\n    ");
    const html = indexTemplate
      .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(description)}" />`)
      .replace("</head>", `    ${socialMeta}\n  </head>`);
    res.type("html").send(html);
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
