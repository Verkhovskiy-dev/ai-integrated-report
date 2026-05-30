(function () {
  "use strict";

  // ─── Configuration ───────────────────────────────────────────────────────────
  const CONFIG = {
    tokensPerDay: 60e12,   // 60 trillion tokens/day (revised, May 2026)
    updateInterval: 100,
    yearStart: new Date("2026-01-01T00:00:00Z"),
    colors: {
      bg: "#1a1a2e",
      cardBg: "#16213e",
      text: "#e0e0e0",
      textMuted: "#8892b0",
      accent: "#00d4ff",
      accentGreen: "#00ff88",
      accentPurple: "#7b68ee",
      glow: "rgba(0, 212, 255, 0.4)",
      glowGreen: "rgba(0, 255, 136, 0.3)",
      border: "rgba(255,255,255,0.06)",
      vendors: {
        openai: "#00ff88",
        anthropic: "#ff8c42",
        google: "#4da6ff",
        deepseek: "#c084fc",
      },
    },
  };

  let tokensPerMs = CONFIG.tokensPerDay / 86400 / 1000;

  // Dollar spend constants
  // $30M/day globally = $0.50/1M blended avg × 60T tokens/day
  let BLENDED_COST_PER_M = 0.50;
  let dollarPerMs = (CONFIG.tokensPerDay / 1e6 * BLENDED_COST_PER_M) / 86400 / 1000;

  const DATA_URL = "/data/token-monitor.json";

  function applyDynamicConfig(data) {
    if (data && data.tokensPerDay) {
      CONFIG.tokensPerDay = data.tokensPerDay;
      tokensPerMs = CONFIG.tokensPerDay / 86400 / 1000;
    }
    if (data && data.blendedCostPerM) {
      BLENDED_COST_PER_M = data.blendedCostPerM;
    }
    dollarPerMs = (CONFIG.tokensPerDay / 1e6 * BLENDED_COST_PER_M) / 86400 / 1000;
  }

  // ─── Price trend data ────────────────────────────────────────────────────────
  const priceTrend = [
    { label: "GPT-4",         date: "Mar 2023", price: 60 },
    { label: "GPT-4-Turbo",   date: "Nov 2023", price: 30 },
    { label: "GPT-4o",        date: "May 2024", price: 15 },
    { label: "GPT-4.1",       date: "Apr 2025", price: 8 },
    { label: "GPT-4.1-mini",  date: "2025",     price: 1.6 },
    { label: "GPT-5",         date: "2026",     price: 10 },
    { label: "Cheapest",      date: "2026",     price: 0.5 },
  ];

  // ─── Current prices ──────────────────────────────────────────────────────────
  const currentPrices = [
    { model: "GPT-5",           input: 10,   output: 30 },
    { model: "Claude Sonnet 4", input: 3,    output: 15 },
    { model: "Gemini 2.5 Pro",  input: 1.25, output: 10 },
    { model: "GPT-4.1-mini",    input: 0.4,  output: 1.6 },
    { model: "DeepSeek V3",     input: 0.27, output: 1.1 },
  ];

  // ─── Model Intelligence data ─────────────────────────────────────────────────
  const models = [
    { name: "GPT-5",            elo: 1350, score: 92, outputCost: 30,   vendor: "openai",    pop: 18 },
    { name: "Claude Sonnet 4",  elo: 1320, score: 88, outputCost: 15,   vendor: "anthropic", pop: 15 },
    { name: "Gemini 2.5 Pro",   elo: 1310, score: 86, outputCost: 10,   vendor: "google",    pop: 14 },
    { name: "GPT-4.1",          elo: 1280, score: 82, outputCost: 8,    vendor: "openai",    pop: 12 },
    { name: "Gemini 2.5 Flash", elo: 1240, score: 76, outputCost: 0.5,  vendor: "google",    pop: 13 },
    { name: "GPT-4.1-mini",     elo: 1220, score: 73, outputCost: 1.6,  vendor: "openai",    pop: 16 },
    { name: "DeepSeek V3",      elo: 1260, score: 79, outputCost: 1.1,  vendor: "deepseek",  pop: 11 },
    { name: "Claude Haiku 3.5", elo: 1180, score: 67, outputCost: 1.0,  vendor: "anthropic", pop: 9 },
    { name: "GPT-4.1-nano",     elo: 1150, score: 62, outputCost: 0.4,  vendor: "openai",    pop: 8 },
  ];

  // ─── Cost per Task data ────────────────────────────────────────────────────
  const taskData = [
    { name: "Write Python fn",      inputT: 200,  outputT: 300  },
    { name: "Translate page",       inputT: 800,  outputT: 800  },
    { name: "Summarize article",    inputT: 2000, outputT: 300  },
    { name: "Analyze contract",     inputT: 8000, outputT: 1000 },
    { name: "Social media post",    inputT: 100,  outputT: 200  },
    { name: "Code review 500L",     inputT: 3000, outputT: 500  },
  ];

  // Models reused from currentPrices (same order)
  // taskModels mirrors currentPrices for the heatmap columns
  const taskModels = [
    { short: "GPT-5",       input: 10,   output: 30  },
    { short: "Sonnet 4",    input: 3,    output: 15  },
    { short: "2.5 Pro",     input: 1.25, output: 10  },
    { short: "4.1-mini",    input: 0.4,  output: 1.6 },
    { short: "DeepSeek",    input: 0.27, output: 1.1 },
  ];

  function taskCost(task, model) {
    return (task.inputT * model.input / 1e6) + (task.outputT * model.output / 1e6);
  }

  function formatCost(c) {
    if (c < 0.0001) return "<$0.0001";
    if (c < 0.001)  return "$" + c.toFixed(4);
    if (c < 0.01)   return "$" + c.toFixed(4);
    if (c < 0.1)    return "$" + c.toFixed(4);
    return "$" + c.toFixed(3);
  }

  // Intelligence scale tiers
  const intelligenceTiers = [
    { min: 0,  max: 30,  label: "Basic",      color: "#4a5568" },
    { min: 30, max: 60,  label: "Advanced",   color: "#2d6a8f" },
    { min: 60, max: 80,  label: "Expert",     color: "#2d7a5f" },
    { min: 80, max: 95,  label: "Frontier",   color: "#1a6b4a" },
    { min: 95, max: 100, label: "Superhuman", color: "#7b68ee" },
  ];

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

    .tcw-root {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: ${CONFIG.colors.text};
      background: ${CONFIG.colors.bg};
      border-radius: 16px;
      padding: 28px;
      max-width: 560px;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      border: 1px solid ${CONFIG.colors.border};
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .tcw-root * { box-sizing: border-box; }

    .tcw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .tcw-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${CONFIG.colors.textMuted};
    }
    .tcw-info-btn {
      width: 22px; height: 22px;
      border-radius: 50%;
      border: 1px solid ${CONFIG.colors.textMuted};
      background: transparent;
      color: ${CONFIG.colors.textMuted};
      font-size: 12px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      position: relative;
      transition: all 0.2s;
    }
    .tcw-info-btn:hover { border-color: ${CONFIG.colors.accent}; color: ${CONFIG.colors.accent}; }
    .tcw-tooltip {
      display: none;
      position: absolute;
      top: 30px; right: 0;
      width: 280px;
      background: #0d1b2a;
      border: 1px solid ${CONFIG.colors.border};
      border-radius: 8px;
      padding: 12px;
      font-size: 11px; line-height: 1.5;
      color: ${CONFIG.colors.textMuted};
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .tcw-info-btn:hover .tcw-tooltip { display: block; }

    /* Counter */
    .tcw-counter-section { margin-bottom: 24px; }
    .tcw-counter-block { margin-bottom: 16px; }
    .tcw-counter-label {
      font-size: 11px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 1px;
      color: ${CONFIG.colors.textMuted}; margin-bottom: 4px;
    }
    .tcw-counter-value {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 32px; font-weight: 700;
      color: ${CONFIG.colors.accent};
      text-shadow: 0 0 20px ${CONFIG.colors.glow}, 0 0 40px ${CONFIG.colors.glow};
      line-height: 1.2;
    }
    .tcw-counter-value.green {
      color: ${CONFIG.colors.accentGreen};
      text-shadow: 0 0 20px ${CONFIG.colors.glowGreen}, 0 0 40px ${CONFIG.colors.glowGreen};
      font-size: 26px;
    }
    .tcw-counter-unit {
      font-size: 13px; font-weight: 400;
      color: ${CONFIG.colors.textMuted}; margin-left: 6px;
    }

    .tcw-counter-value.gold {
      color: #ffd700;
      text-shadow: 0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.25);
      font-size: 28px;
    }
    .tcw-counter-value.gold-sm {
      color: #ffd700;
      text-shadow: 0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.25);
      font-size: 22px;
    }

    .tcw-counter-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .tcw-counter-pair .tcw-counter-block {
      margin-bottom: 0;
    }

    @media (max-width: 440px) {
      .tcw-counter-pair { grid-template-columns: 1fr; }
    }

    .tcw-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${CONFIG.colors.border}, transparent);
      margin: 20px 0;
    }

    /* Sparkline */
    .tcw-sparkline-section { margin-bottom: 24px; }
    .tcw-section-title {
      font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1px;
      color: ${CONFIG.colors.textMuted}; margin-bottom: 12px;
    }
    .tcw-sparkline-container {
      background: rgba(255,255,255,0.02);
      border-radius: 8px; padding: 12px;
      border: 1px solid ${CONFIG.colors.border};
    }
    .tcw-sparkline-svg { width: 100%; height: 80px; display: block; }
    .tcw-sparkline-labels {
      display: flex; justify-content: space-between;
      margin-top: 6px; font-size: 9px; color: ${CONFIG.colors.textMuted};
    }

    /* Prices table */
    .tcw-prices-section { margin-top: 0; }
    .tcw-prices-table { width: 100%; border-collapse: collapse; }
    .tcw-prices-table th {
      font-size: 10px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.5px;
      color: ${CONFIG.colors.textMuted};
      text-align: left; padding: 6px 8px;
      border-bottom: 1px solid ${CONFIG.colors.border};
    }
    .tcw-prices-table th:not(:first-child) { text-align: right; }
    .tcw-prices-table td {
      font-size: 12px; padding: 7px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .tcw-prices-table td:first-child { font-weight: 500; color: ${CONFIG.colors.text}; }
    .tcw-prices-table td:not(:first-child) {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: ${CONFIG.colors.accentGreen};
    }
    .tcw-prices-table tr:last-child td { border-bottom: none; }
    .tcw-prices-table tr:hover td { background: rgba(255,255,255,0.02); }

    /* ── Model Intelligence section ─────────────────────────────────────── */
    .tcw-intel-section { margin-bottom: 4px; }

    .tcw-scatter-wrap {
      background: rgba(255,255,255,0.02);
      border-radius: 8px; padding: 12px 10px 8px;
      border: 1px solid ${CONFIG.colors.border};
      position: relative;
    }

    /* Tooltip for scatter */
    .tcw-scatter-tooltip {
      position: absolute;
      background: #0d1b2a;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 11px; line-height: 1.5;
      color: ${CONFIG.colors.text};
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 50;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }
    .tcw-scatter-tooltip.visible { opacity: 1; }

    /* Legend */
    .tcw-legend {
      display: flex; flex-wrap: wrap; gap: 10px;
      margin-top: 8px;
    }
    .tcw-legend-item {
      display: flex; align-items: center; gap: 5px;
      font-size: 10px; color: ${CONFIG.colors.textMuted};
    }
    .tcw-legend-dot {
      width: 8px; height: 8px; border-radius: 50%;
      flex-shrink: 0;
    }

    /* Intelligence scale bar */
    .tcw-intel-bar-wrap {
      margin-top: 14px;
    }
    .tcw-intel-bar-title {
      font-size: 10px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.8px;
      color: ${CONFIG.colors.textMuted}; margin-bottom: 6px;
    }
    .tcw-intel-bar-track {
      position: relative; height: 18px;
      border-radius: 9px; overflow: hidden;
      display: flex;
    }
    .tcw-intel-bar-segment {
      height: 100%; display: flex;
      align-items: center; justify-content: center;
      font-size: 8px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
      color: rgba(255,255,255,0.7);
      overflow: hidden;
      white-space: nowrap;
    }
    .tcw-intel-bar-indicator {
      position: absolute; top: -3px;
      width: 4px; height: 24px;
      border-radius: 2px;
      background: #ffffff;
      box-shadow: 0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.5);
      transform: translateX(-50%);
      transition: left 0.5s ease;
    }
    .tcw-intel-bar-labels {
      display: flex; justify-content: space-between;
      margin-top: 4px; font-size: 9px;
      color: ${CONFIG.colors.textMuted};
    }

    /* ── Cost per Task heatmap ──────────────────────────────────────────── */
    .tcw-task-section { margin-top: 0; }

    .tcw-task-wrap {
      background: rgba(255,255,255,0.02);
      border-radius: 8px;
      border: 1px solid ${CONFIG.colors.border};
      overflow: hidden;
    }

    .tcw-task-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }

    .tcw-task-table thead tr {
      background: rgba(255,255,255,0.04);
    }

    .tcw-task-table th {
      padding: 7px 6px;
      font-size: 9.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: ${CONFIG.colors.textMuted};
      text-align: center;
      border-bottom: 1px solid ${CONFIG.colors.border};
      white-space: nowrap;
    }

    .tcw-task-table th:first-child {
      text-align: left;
      padding-left: 10px;
      min-width: 110px;
    }

    .tcw-task-table td {
      padding: 6px 5px;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.025);
      transition: filter 0.15s;
    }

    .tcw-task-table td:first-child {
      text-align: left;
      padding-left: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: ${CONFIG.colors.text};
      white-space: nowrap;
    }

    .tcw-task-table tr:last-child td {
      border-bottom: none;
    }

    .tcw-task-table .tcw-daily-row td {
      background: rgba(255,255,255,0.035);
      font-size: 10px;
      color: ${CONFIG.colors.textMuted};
    }

    .tcw-task-table .tcw-daily-row td:first-child {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-style: italic;
      color: ${CONFIG.colors.textMuted};
    }

    .tcw-task-note {
      font-size: 9.5px;
      color: ${CONFIG.colors.textMuted};
      padding: 6px 10px 8px;
      font-style: italic;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .tcw-task-table th, .tcw-task-table td { padding: 5px 3px; font-size: 9px; }
      .tcw-task-table th:first-child, .tcw-task-table td:first-child { min-width: 80px; }
    }
    @media (max-width: 480px) {
      .tcw-root { padding: 20px; border-radius: 12px; }
      .tcw-counter-value { font-size: 24px; }
      .tcw-counter-value.green { font-size: 20px; }
    }
  `;

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function formatNumber(num) {
    if (num >= 1e15) return (num / 1e15).toFixed(3) + " Q";  // quadrillions
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " T";  // trillions
    if (num >= 1e9)  return (num / 1e9).toFixed(2) + " B";
    if (num >= 1e6)  return (num / 1e6).toFixed(2) + " M";
    return num.toLocaleString("en-US");
  }

  function getTokensToday() {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return (now - midnight) * tokensPerMs;
  }

  function getTokensThisYear() {
    return (Date.now() - CONFIG.yearStart.getTime()) * tokensPerMs;
  }

  function getDollarToday() {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return (now - midnight) * dollarPerMs;
  }

  function getDollarThisYear() {
    return (Date.now() - CONFIG.yearStart.getTime()) * dollarPerMs;
  }

  function formatDollar(n) {
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + " B";
    return "$" + Math.floor(n).toLocaleString("en-US");
  }

  // ─── Sparkline SVG ───────────────────────────────────────────────────────────
  function buildSparklineSVG() {
    const W = 440, H = 70, P = { t: 8, r: 10, b: 8, l: 10 };
    const cW = W - P.l - P.r, cH = H - P.t - P.b;
    const maxP = Math.max(...priceTrend.map(d => d.price));

    const pts = priceTrend.map((d, i) => ({
      x: P.l + (i / (priceTrend.length - 1)) * cW,
      y: P.t + (1 - d.price / maxP) * cH,
      ...d,
    }));

    const line = pts.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(" ");
    const area = line + ` L${pts[pts.length-1].x} ${H-P.b} L${pts[0].x} ${H-P.b} Z`;

    let s = `<svg class="tcw-sparkline-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
    s += `<defs><linearGradient id="tcw-sg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${CONFIG.colors.accentPurple}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${CONFIG.colors.accentPurple}" stop-opacity="0.02"/>
    </linearGradient></defs>`;
    s += `<path d="${area}" fill="url(#tcw-sg)"/>`;
    s += `<path d="${line}" fill="none" stroke="${CONFIG.colors.accentPurple}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach(p => {
      s += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${CONFIG.colors.accentPurple}" stroke="#1a1a2e" stroke-width="1.5"/>`;
      const ly = p.y - 8 < 12 ? p.y + 14 : p.y - 8;
      s += `<text x="${p.x}" y="${ly}" fill="${CONFIG.colors.textMuted}" font-size="8" font-family="Inter,sans-serif" text-anchor="middle">$${p.price}</text>`;
    });
    s += `</svg>`;
    return s;
  }

  // ─── Scatter plot SVG ────────────────────────────────────────────────────────
  function buildScatterSVG() {
    const W = 460, H = 200;
    const P = { t: 20, r: 20, b: 36, l: 42 };
    const cW = W - P.l - P.r, cH = H - P.t - P.b;

    // Log scale for X (cost): domain [0.3, 50]
    const xMin = Math.log10(0.3), xMax = Math.log10(50);
    const yMin = 55, yMax = 100;

    function xPos(cost) {
      return P.l + ((Math.log10(cost) - xMin) / (xMax - xMin)) * cW;
    }
    function yPos(score) {
      return P.t + (1 - (score - yMin) / (yMax - yMin)) * cH;
    }

    // Efficiency frontier: models with best score for their cost bracket
    // Sort by cost, pick Pareto-optimal (highest score for lowest cost)
    const sorted = [...models].sort((a, b) => a.outputCost - b.outputCost);
    let frontier = [];
    let maxScore = -Infinity;
    sorted.forEach(m => {
      if (m.score > maxScore) { maxScore = m.score; frontier.push(m); }
    });

    const vc = CONFIG.colors.vendors;
    const vendorColor = v => vc[v] || "#aaa";

    let s = `<svg id="tcw-scatter-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;overflow:visible;">`;

    // Defs: glow filters per vendor
    s += `<defs>
      ${["openai","anthropic","google","deepseek"].map(v =>
        `<filter id="tcw-glow-${v}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>`
      ).join("")}
    </defs>`;

    // Background grid lines (Y)
    const yTicks = [60, 70, 80, 90, 100];
    yTicks.forEach(v => {
      const y = yPos(v);
      s += `<line x1="${P.l}" y1="${y}" x2="${P.l+cW}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      s += `<text x="${P.l-5}" y="${y+3}" fill="${CONFIG.colors.textMuted}" font-size="8" font-family="Inter,sans-serif" text-anchor="end">${v}</text>`;
    });

    // X axis log ticks
    const xTicks = [0.3, 0.5, 1, 2, 5, 10, 30];
    xTicks.forEach(v => {
      const x = xPos(v);
      s += `<line x1="${x}" y1="${P.t}" x2="${x}" y2="${P.t+cH}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      s += `<text x="${x}" y="${P.t+cH+12}" fill="${CONFIG.colors.textMuted}" font-size="8" font-family="Inter,sans-serif" text-anchor="middle">$${v}</text>`;
    });

    // Axis lines
    s += `<line x1="${P.l}" y1="${P.t}" x2="${P.l}" y2="${P.t+cH}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>`;
    s += `<line x1="${P.l}" y1="${P.t+cH}" x2="${P.l+cW}" y2="${P.t+cH}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>`;

    // Axis labels
    s += `<text x="${P.l + cW/2}" y="${H-2}" fill="${CONFIG.colors.textMuted}" font-size="9" font-family="Inter,sans-serif" text-anchor="middle">Output cost per 1M tokens (log scale)</text>`;
    s += `<text x="10" y="${P.t + cH/2}" fill="${CONFIG.colors.textMuted}" font-size="9" font-family="Inter,sans-serif" text-anchor="middle" transform="rotate(-90,10,${P.t+cH/2})">Intelligence score</text>`;

    // Efficiency frontier line
    if (frontier.length > 1) {
      const fPath = frontier.map((m, i) => {
        const x = xPos(m.outputCost), y = yPos(m.score);
        return (i === 0 ? `M${x} ${y}` : `L${x} ${y}`);
      }).join(" ");
      s += `<path d="${fPath}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    }

    // Dots — render with data attributes for JS hover
    models.forEach((m, idx) => {
      const x = xPos(m.outputCost).toFixed(1);
      const y = yPos(m.score).toFixed(1);
      const r = 4 + (m.pop / 18) * 7; // radius 4–11
      const col = vendorColor(m.vendor);
      s += `<g class="tcw-model-dot" data-idx="${idx}" style="cursor:pointer;">
        <circle cx="${x}" cy="${y}" r="${r+4}" fill="transparent"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="${col}" fill-opacity="0.85"
          stroke="rgba(255,255,255,0.25)" stroke-width="1"
          filter="url(#tcw-glow-${m.vendor})"/>
      </g>`;
    });

    // Labels (offset to avoid overlap)
    const labelOffsets = {
      "GPT-5":            [6, -8],
      "Claude Sonnet 4":  [6, -8],
      "Gemini 2.5 Pro":   [6, 12],
      "GPT-4.1":          [6, -8],
      "Gemini 2.5 Flash": [-6, 12],
      "GPT-4.1-mini":     [6, -8],
      "DeepSeek V3":      [-6, -8],
      "Claude Haiku 3.5": [6, 12],
      "GPT-4.1-nano":     [-6, 12],
    };
    models.forEach(m => {
      const x = xPos(m.outputCost);
      const y = yPos(m.score);
      const r = 4 + (m.pop / 18) * 7;
      const [ox, oy] = labelOffsets[m.name] || [6, -8];
      const anchor = ox < 0 ? "end" : "start";
      s += `<text x="${(x + r * Math.sign(ox) + ox).toFixed(1)}" y="${(y + oy).toFixed(1)}"
        fill="${CONFIG.colors.text}" fill-opacity="0.85"
        font-size="9" font-family="Inter,sans-serif" text-anchor="${anchor}"
        pointer-events="none">${m.name}</text>`;
    });

    s += `</svg>`;
    return s;
  }

  // ─── Intelligence scale bar ──────────────────────────────────────────────────
  function buildIntelBar() {
    const topScore = Math.max(...models.map(m => m.score)); // 92
    const indicatorPct = topScore; // 0-100 scale

    const segments = intelligenceTiers.map(t => {
      const width = t.max - t.min;
      return `<div class="tcw-intel-bar-segment" style="width:${width}%;background:${t.color};">${t.label}</div>`;
    }).join("");

    return `
      <div class="tcw-intel-bar-wrap">
        <div class="tcw-intel-bar-title">Intelligence scale (normalized ELO, 0–100)</div>
        <div class="tcw-intel-bar-track" id="tcw-intel-track">
          ${segments}
          <div class="tcw-intel-bar-indicator" id="tcw-intel-indicator" style="left:${indicatorPct}%;"></div>
        </div>
        <div class="tcw-intel-bar-labels">
          <span>0 — GPT-3 era</span>
          <span>30 — GPT-3.5</span>
          <span>60 — GPT-4</span>
          <span>80 — Frontier</span>
          <span>100</span>
        </div>
      </div>`;
  }

  // ─── Legend ──────────────────────────────────────────────────────────────────
  function buildLegend() {
    const vendors = [
      { key: "openai",    label: "OpenAI" },
      { key: "anthropic", label: "Anthropic" },
      { key: "google",    label: "Google" },
      { key: "deepseek",  label: "DeepSeek" },
    ];
    return `<div class="tcw-legend">` +
      vendors.map(v =>
        `<div class="tcw-legend-item">
          <div class="tcw-legend-dot" style="background:${CONFIG.colors.vendors[v.key]};"></div>
          <span>${v.label}</span>
        </div>`
      ).join("") +
      `<div class="tcw-legend-item" style="margin-left:auto;">
        <div class="tcw-legend-dot" style="background:rgba(255,255,255,0.3);width:6px;height:6px;"></div>
        <span style="font-size:9px;">dot size = popularity</span>
      </div>` +
    `</div>`;
  }

  // ─── Cost per Task heatmap ──────────────────────────────────────────────────
  function buildTaskHeatmap() {
    // Compute all costs to find min/max for color scaling
    const allCosts = [];
    taskData.forEach(task => taskModels.forEach(model => allCosts.push(taskCost(task, model))));
    const minC = Math.min(...allCosts);
    const maxC = Math.max(...allCosts);

    // Color: green (cheap) → yellow → orange/red (expensive)
    function heatColor(cost) {
      const t = Math.pow((cost - minC) / (maxC - minC), 0.45); // power for better spread
      // green #00c97a → yellow #ffd700 → red #ff4444
      let r, g, b;
      if (t < 0.5) {
        const u = t * 2;
        r = Math.round(0   + u * 255);
        g = Math.round(201 + u * (215 - 201));
        b = Math.round(122 + u * (0   - 122));
      } else {
        const u = (t - 0.5) * 2;
        r = Math.round(255);
        g = Math.round(215 - u * (215 - 68));
        b = Math.round(0);
      }
      return `rgb(${r},${g},${b})`;
    }

    function textColor(cost) {
      const t = Math.pow((cost - minC) / (maxC - minC), 0.45);
      return t > 0.6 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
    }

    let html = `<div class="tcw-task-wrap">`;
    html += `<table class="tcw-task-table"><thead><tr>`;
    html += `<th>Task</th>`;
    taskModels.forEach(m => { html += `<th>${m.short}</th>`; });
    html += `</tr></thead><tbody>`;

    taskData.forEach(task => {
      html += `<tr><td>${task.name}</td>`;
      taskModels.forEach(model => {
        const c = taskCost(task, model);
        const bg = heatColor(c);
        const fg = textColor(c);
        html += `<td style="background:${bg};color:${fg};">${formatCost(c)}</td>`;
      });
      html += `</tr>`;
    });

    // Daily row (× 100 tasks)
    html += `<tr class="tcw-daily-row"><td>× 100 tasks / day</td>`;
    taskModels.forEach(model => {
      const total = taskData.reduce((sum, task) => sum + taskCost(task, model) * 100, 0);
      html += `<td>$${total.toFixed(2)}</td>`;
    });
    html += `</tr>`;

    html += `</tbody></table>`;
    html += `<div class="tcw-task-note">Based on average token usage per task type. Costs in USD.</div>`;
    html += `</div>`;
    return html;
  }

  // ─── Prices table ────────────────────────────────────────────────────────────
  function buildPricesTable() {
    let html = `<table class="tcw-prices-table">
      <thead><tr><th>Model</th><th>Input / 1M</th><th>Output / 1M</th></tr></thead><tbody>`;
    currentPrices.forEach(p => {
      html += `<tr><td>${p.model}</td><td>$${p.input.toFixed(2)}</td><td>$${p.output.toFixed(2)}</td></tr>`;
    });
    html += `</tbody></table>`;
    return html;
  }

  // ─── Widget init ─────────────────────────────────────────────────────────────
  function init() {
    const styleEl = document.createElement("style");
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    let container = document.getElementById("token-counter-widget");
    if (!container) {
      container = document.createElement("div");
      container.id = "token-counter-widget";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="tcw-root">

        <!-- Header -->
        <div class="tcw-header">
          <span class="tcw-title">Global AI Token Monitor</span>
          <button class="tcw-info-btn" aria-label="Methodology info">ℹ️
            <div class="tcw-tooltip">
              <strong style="color:#e0e0e0;">Methodology</strong><br><br>
              Estimates based on public data:<br>
              • OpenAI processes 6–8B tokens/min (DevDay, Oct 2025) = ~8.6T/day<br>
              • Global total ~60T tokens/day incl. Google, Anthropic, Meta, Chinese labs (Dr. A. Thompson, lifearchitect.ai, May 2026)<br>
              • Counter extrapolates from midnight UTC at 694M tokens/sec<br>
              • Intelligence scores: normalized Chatbot Arena ELO<br>
              • Dollar spend: blended rate ~$0.50/1M tokens (most volume on cheap models: Gemini Flash, DeepSeek, GPT-4.1-mini) = ~$30M/day, ~$347/sec<br><br>
              <em>Illustrative estimates only.</em>
            </div>
          </button>
        </div>

        <!-- Counters -->
        <div class="tcw-counter-section">
          <div class="tcw-counter-pair">
            <div class="tcw-counter-block">
              <div class="tcw-counter-label">Tokens today (UTC)</div>
              <div class="tcw-counter-value" id="tcw-today-counter">0</div>
            </div>
            <div class="tcw-counter-block">
              <div class="tcw-counter-label">Global spend today (USD)</div>
              <div class="tcw-counter-value gold" id="tcw-spend-today">$0</div>
            </div>
          </div>
          <div class="tcw-counter-pair">
            <div class="tcw-counter-block">
              <div class="tcw-counter-label">Tokens this year</div>
              <div class="tcw-counter-value green" id="tcw-year-counter">0</div>
            </div>
            <div class="tcw-counter-block">
              <div class="tcw-counter-label">Global spend this year (USD)</div>
              <div class="tcw-counter-value gold-sm" id="tcw-spend-year">$0</div>
            </div>
          </div>
        </div>

        <div class="tcw-divider"></div>

        <!-- Sparkline -->
        <div class="tcw-sparkline-section">
          <div class="tcw-section-title">Avg. cost per 1M tokens (frontier models)</div>
          <div class="tcw-sparkline-container">
            ${buildSparklineSVG()}
            <div class="tcw-sparkline-labels">${priceTrend.map(d => `<span>${d.date}</span>`).join("")}</div>
          </div>
        </div>

        <div class="tcw-divider"></div>

        <!-- Model Intelligence -->
        <div class="tcw-intel-section">
          <div class="tcw-section-title">Price vs Intelligence (Chatbot Arena ELO)</div>
          <div class="tcw-scatter-wrap" id="tcw-scatter-wrap">
            ${buildScatterSVG()}
            ${buildLegend()}
            ${buildIntelBar()}
            <div class="tcw-scatter-tooltip" id="tcw-scatter-tooltip"></div>
          </div>
        </div>

        <div class="tcw-divider"></div>

        <!-- Prices table -->
        <div class="tcw-prices-section">
          <div class="tcw-section-title">Current model pricing (per 1M tokens)</div>
          ${buildPricesTable()}
        </div>

        <div class="tcw-divider"></div>

        <!-- Cost per Task -->
        <div class="tcw-task-section">
          <div class="tcw-section-title">Cost per task (USD)</div>
          ${buildTaskHeatmap()}
        </div>

      </div>
    `;

    // ── Counter animation ──
    const todayEl     = document.getElementById("tcw-today-counter");
    const yearEl      = document.getElementById("tcw-year-counter");
    const spendTodayEl = document.getElementById("tcw-spend-today");
    const spendYearEl  = document.getElementById("tcw-spend-year");
    function updateCounters() {
      todayEl.innerHTML      = formatNumber(getTokensToday())     + `<span class="tcw-counter-unit">tokens</span>`;
      yearEl.innerHTML       = formatNumber(getTokensThisYear())  + `<span class="tcw-counter-unit">tokens</span>`;
      spendTodayEl.textContent = formatDollar(getDollarToday());
      spendYearEl.textContent  = formatDollar(getDollarThisYear());
    }
    updateCounters();
    setInterval(updateCounters, CONFIG.updateInterval);

    // ── Scatter hover tooltips ──
    const tooltip = document.getElementById("tcw-scatter-tooltip");
    const scatterWrap = document.getElementById("tcw-scatter-wrap");
    const dots = scatterWrap.querySelectorAll(".tcw-model-dot");

    dots.forEach(dot => {
      const idx = parseInt(dot.getAttribute("data-idx"), 10);
      const m = models[idx];

      dot.addEventListener("mouseenter", function (e) {
        tooltip.innerHTML =
          `<strong style="color:${CONFIG.colors.vendors[m.vendor]}">${m.name}</strong><br>` +
          `ELO: <strong>${m.elo}</strong> &nbsp;|&nbsp; Score: <strong>${m.score}/100</strong><br>` +
          `Output cost: <strong>$${m.outputCost}/1M</strong>`;
        tooltip.classList.add("visible");
      });

      dot.addEventListener("mousemove", function (e) {
        const rect = scatterWrap.getBoundingClientRect();
        let tx = e.clientX - rect.left + 12;
        let ty = e.clientY - rect.top - 10;
        // Keep tooltip inside container
        if (tx + 180 > rect.width) tx = e.clientX - rect.left - 190;
        tooltip.style.left = tx + "px";
        tooltip.style.top  = ty + "px";
      });

      dot.addEventListener("mouseleave", function () {
        tooltip.classList.remove("visible");
      });
    });
  }

  function bootstrap() {
    fetch(DATA_URL).then(r => r.json()).then(data => {
      applyDynamicConfig(data);
    }).catch(() => {}).finally(() => {
      init();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
