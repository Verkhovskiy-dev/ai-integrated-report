(function () {
  "use strict";

  // ─── Configuration ───────────────────────────────────────────────────────────
  let TOKENS_PER_DAY = 60e12;   // 60 trillion tokens/day
  let BLENDED_COST_PER_M = 0.50; // $0.50 per 1M tokens
  const YEAR_START = new Date("2026-01-01T00:00:00Z");
  const UPDATE_INTERVAL = 100;
  const DATA_URL = "/data/token-monitor.json";
  const LINK_URL = "/analytics/";

  let tokensPerMs = TOKENS_PER_DAY / 86400 / 1000;
  let dollarPerMs = (TOKENS_PER_DAY / 1e6 * BLENDED_COST_PER_M) / 86400 / 1000;

  function applyConfig(data) {
    if (data && data.tokensPerDay) {
      TOKENS_PER_DAY = data.tokensPerDay;
      tokensPerMs = TOKENS_PER_DAY / 86400 / 1000;
    }
    if (data && data.blendedCostPerM) {
      BLENDED_COST_PER_M = data.blendedCostPerM;
    }
    dollarPerMs = (TOKENS_PER_DAY / 1e6 * BLENDED_COST_PER_M) / 86400 / 1000;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function getTokensToday() {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return (now - midnight) * tokensPerMs;
  }
  function getTokensYear() {
    return (Date.now() - YEAR_START.getTime()) * tokensPerMs;
  }
  function getDollarToday() {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return (now - midnight) * dollarPerMs;
  }
  function getDollarYear() {
    return (Date.now() - YEAR_START.getTime()) * dollarPerMs;
  }

  function fmtTokens(n) {
    if (n >= 1e15) return (n / 1e15).toFixed(2) + " Q";
    if (n >= 1e12) return (n / 1e12).toFixed(2) + " T";
    if (n >= 1e9)  return (n / 1e9).toFixed(1) + " B";
    return Math.floor(n).toLocaleString("en-US");
  }
  function fmtDollar(n) {
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    return "$" + Math.floor(n).toLocaleString("en-US");
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

    .tkb-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: #141820;
      border: 1px solid #252c33;
      border-radius: 10px;
      padding: 10px 20px;
      margin-bottom: 16px;
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.2s, background 0.2s;
      min-height: 56px;
    }
    .tkb-banner:hover {
      border-color: #00e5a0;
      background: #181e28;
    }

    .tkb-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .tkb-live {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .tkb-live-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #00e5a0;
      animation: tkb-pulse 2s ease-in-out infinite;
    }
    @keyframes tkb-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.5); }
    }
    .tkb-live-text {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #00e5a0;
    }
    .tkb-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #6b7a8d;
      white-space: nowrap;
    }

    .tkb-counters {
      display: flex;
      align-items: center;
      gap: 0;
      flex: 1;
      justify-content: center;
    }
    .tkb-counter-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 16px;
      border-right: 1px solid #252c33;
    }
    .tkb-counter-item:last-child { border-right: none; }
    .tkb-counter-title {
      font-size: 9px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7a8d;
      margin-bottom: 2px;
      white-space: nowrap;
    }
    .tkb-counter-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
    .tkb-counter-value.cyan {
      color: #00d4ff;
      text-shadow: 0 0 8px rgba(0,212,255,0.35);
    }
    .tkb-counter-value.green {
      color: #00e5a0;
      text-shadow: 0 0 8px rgba(0,229,160,0.3);
    }
    .tkb-counter-value.gold {
      color: #ffd700;
      text-shadow: 0 0 8px rgba(255,215,0,0.35);
    }

    .tkb-arrow {
      font-size: 14px;
      color: #6b7a8d;
      flex-shrink: 0;
      transition: transform 0.2s, color 0.2s;
    }
    .tkb-banner:hover .tkb-arrow {
      color: #00e5a0;
      transform: translateX(3px);
    }

    /* Responsive */
    @media (max-width: 900px) {
      .tkb-label { display: none; }
      .tkb-counter-item { padding: 0 10px; }
      .tkb-counter-value { font-size: 14px; }
    }
    @media (max-width: 600px) {
      .tkb-banner { flex-wrap: wrap; padding: 8px 12px; gap: 6px; }
      .tkb-counters { flex-wrap: wrap; gap: 4px; }
      .tkb-counter-item { border-right: none; padding: 2px 8px; }
      .tkb-counter-value { font-size: 13px; }
      .tkb-left { width: 100%; justify-content: space-between; }
      .tkb-arrow { display: none; }
    }
  `;

  // ─── Injection ───────────────────────────────────────────────────────────────
  function findTargetGrid() {
    // Look for the main grid container on the first screen
    // Strategy: find heading containing "Главные события" or "Models Pulse"
    // and walk up to the grid parent, then insert before it
    const allEls = document.querySelectorAll("h2, h3, [class*='grid']");
    
    // Method 1: Find by heading text
    for (const el of document.querySelectorAll("h2, h3, span, div")) {
      const text = el.textContent.trim();
      if (text === "Главные события" || text === "Key Events" || text === "Models Pulse") {
        // Walk up to find a grid container
        let parent = el.parentElement;
        for (let i = 0; i < 8; i++) {
          if (!parent) break;
          if (parent.className && (
            parent.className.includes("grid-cols") ||
            parent.className.includes("grid ")
          )) {
            return parent;
          }
          parent = parent.parentElement;
        }
      }
    }

    // Method 2: Find any element with grid-cols-2 or grid-cols-3 class
    const grids = document.querySelectorAll("[class*='grid-cols']");
    if (grids.length > 0) return grids[0];

    return null;
  }

  function inject() {
    // Only inject on the main page
    const path = window.location.pathname;
    if (path !== "/" && path !== "/index.html" && path !== "") return;

    // Don't double-inject
    if (document.getElementById("tkb-banner")) return;

    const grid = findTargetGrid();
    if (!grid) return;

    // Inject styles
    if (!document.getElementById("tkb-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "tkb-styles";
      styleEl.textContent = STYLES;
      document.head.appendChild(styleEl);
    }

    // Create banner
    const banner = document.createElement("a");
    banner.id = "tkb-banner";
    banner.className = "tkb-banner";
    banner.href = LINK_URL;
    banner.innerHTML = `
      <div class="tkb-left">
        <div class="tkb-live">
          <div class="tkb-live-dot"></div>
          <span class="tkb-live-text">Live</span>
        </div>
        <span class="tkb-label">Global AI Tokens</span>
      </div>
      <div class="tkb-counters">
        <div class="tkb-counter-item">
          <div class="tkb-counter-title">Today</div>
          <div class="tkb-counter-value cyan" id="tkb-tokens-today">—</div>
        </div>
        <div class="tkb-counter-item">
          <div class="tkb-counter-title">This year</div>
          <div class="tkb-counter-value green" id="tkb-tokens-year">—</div>
        </div>
        <div class="tkb-counter-item">
          <div class="tkb-counter-title">$ Today</div>
          <div class="tkb-counter-value gold" id="tkb-spend-today">—</div>
        </div>
        <div class="tkb-counter-item">
          <div class="tkb-counter-title">$ This year</div>
          <div class="tkb-counter-value gold" id="tkb-spend-year">—</div>
        </div>
      </div>
      <div class="tkb-arrow">→</div>
    `;

    // Insert before the grid
    grid.parentNode.insertBefore(banner, grid);

    // Start counter animation
    const elToday = document.getElementById("tkb-tokens-today");
    const elYear  = document.getElementById("tkb-tokens-year");
    const elSpendToday = document.getElementById("tkb-spend-today");
    const elSpendYear  = document.getElementById("tkb-spend-year");

    function update() {
      elToday.textContent = fmtTokens(getTokensToday());
      elYear.textContent  = fmtTokens(getTokensYear());
      elSpendToday.textContent = fmtDollar(getDollarToday());
      elSpendYear.textContent  = fmtDollar(getDollarYear());
    }
    update();
    setInterval(update, UPDATE_INTERVAL);
  }

  // ─── Bootstrap ───────────────────────────────────────────────────────────────
  function bootstrap() {
    // Try to load dynamic config
    fetch(DATA_URL).then(r => r.json()).then(data => {
      applyConfig(data);
    }).catch(() => {}).finally(() => {
      waitAndInject();
    });
  }

  function waitAndInject() {
    // The SPA may not have rendered yet, use MutationObserver
    if (findTargetGrid()) {
      inject();
      return;
    }

    let attempts = 0;
    const maxAttempts = 80; // 8 seconds max
    const observer = new MutationObserver(() => {
      attempts++;
      if (findTargetGrid()) {
        observer.disconnect();
        inject();
      } else if (attempts >= maxAttempts) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also try with a timer as fallback
    const interval = setInterval(() => {
      attempts++;
      if (findTargetGrid()) {
        clearInterval(interval);
        inject();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
