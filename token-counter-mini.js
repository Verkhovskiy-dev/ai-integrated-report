(function () {
  "use strict";

  // ─── Defaults (overridden by /data/token-monitor.json if available) ──────────
  var DEFAULTS = {
    tokensPerDay: 60e12,
    blendedCostPerM: 0.50,
  };

  var WIDGET_ID = "token-counter-mini";
  var DATA_URL = "/data/token-monitor.json";
  var YEAR_START = new Date("2026-01-01T00:00:00Z");

  // ─── Styles ──────────────────────────────────────────────────────────────────
  var STYLES_ID = "tcw-mini-styles";
  var CSS = "\n\
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');\n\
    #token-counter-mini {\n\
      width: 100%;\n\
      margin-bottom: 16px;\n\
    }\n\
    .tcw-bar {\n\
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;\n\
      background: #141820;\n\
      border: 1px solid #1e2429;\n\
      border-radius: 10px;\n\
      padding: 12px 20px;\n\
      display: flex;\n\
      align-items: center;\n\
      gap: 8px;\n\
      box-sizing: border-box;\n\
      width: 100%;\n\
    }\n\
    .tcw-bar * { box-sizing: border-box; }\n\
    .tcw-bar-live {\n\
      display: flex; align-items: center; gap: 5px;\n\
      margin-right: 12px; flex-shrink: 0;\n\
    }\n\
    .tcw-bar-live-dot {\n\
      width: 6px; height: 6px; border-radius: 50%;\n\
      background: #00e5a0;\n\
      animation: tcw-bar-pulse 2s ease-in-out infinite;\n\
    }\n\
    @keyframes tcw-bar-pulse {\n\
      0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)}\n\
    }\n\
    .tcw-bar-live-text {\n\
      font-size: 9px; font-weight: 600;\n\
      text-transform: uppercase; letter-spacing: 1px;\n\
      color: #00e5a0;\n\
    }\n\
    .tcw-bar-counters {\n\
      display: flex;\n\
      align-items: center;\n\
      gap: 0;\n\
      flex: 1;\n\
      min-width: 0;\n\
    }\n\
    .tcw-bar-item {\n\
      display: flex; align-items: baseline; gap: 6px;\n\
      padding: 0 16px;\n\
      border-right: 1px solid #252c33;\n\
      white-space: nowrap;\n\
    }\n\
    .tcw-bar-item:last-child { border-right: none; }\n\
    .tcw-bar-label {\n\
      font-size: 9px; font-weight: 500;\n\
      text-transform: uppercase; letter-spacing: 0.5px;\n\
      color: #6b7a8d;\n\
    }\n\
    .tcw-bar-value {\n\
      font-family: 'JetBrains Mono', monospace;\n\
      font-weight: 700; font-size: 17px;\n\
      line-height: 1;\n\
    }\n\
    .tcw-bar-value.cyan {\n\
      color: #00d4ff;\n\
      text-shadow: 0 0 8px rgba(0,212,255,0.3);\n\
    }\n\
    .tcw-bar-value.green {\n\
      color: #00e5a0;\n\
      text-shadow: 0 0 8px rgba(0,229,160,0.25);\n\
    }\n\
    .tcw-bar-value.gold {\n\
      color: #ffd700;\n\
      text-shadow: 0 0 8px rgba(255,215,0,0.3);\n\
    }\n\
    .tcw-bar-unit {\n\
      font-size: 10px; font-weight: 400;\n\
      color: #6b7a8d; margin-left: 2px;\n\
    }\n\
    .tcw-bar-title {\n\
      font-size: 9px; font-weight: 600;\n\
      text-transform: uppercase; letter-spacing: 1px;\n\
      color: #4a5568; margin-right: 8px; flex-shrink: 0;\n\
    }\n\
\n\
    /* Tablet: 2x2 grid */\n\
    @media (max-width: 1024px) {\n\
      .tcw-bar {\n\
        flex-wrap: wrap;\n\
        padding: 14px 16px;\n\
      }\n\
      .tcw-bar-live { width: 100%; margin-bottom: 8px; margin-right: 0; }\n\
      .tcw-bar-title { display: none; }\n\
      .tcw-bar-counters {\n\
        display: grid;\n\
        grid-template-columns: 1fr 1fr;\n\
        gap: 8px 0;\n\
        width: 100%;\n\
      }\n\
      .tcw-bar-item {\n\
        border-right: none;\n\
        padding: 0 8px;\n\
        flex-direction: column;\n\
        gap: 2px;\n\
      }\n\
      .tcw-bar-item:nth-child(odd) { border-right: 1px solid #252c33; }\n\
    }\n\
\n\
    /* Mobile: same 2x2 but tighter */\n\
    @media (max-width: 768px) {\n\
      .tcw-bar { padding: 12px 12px; border-radius: 8px; }\n\
      .tcw-bar-value { font-size: 15px; }\n\
      .tcw-bar-label { font-size: 8px; }\n\
    }\n\
  ";

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function formatTokens(num) {
    if (num >= 1e15) return (num / 1e15).toFixed(3) + "<span class='tcw-bar-unit'>Q</span>";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "<span class='tcw-bar-unit'>T</span>";
    if (num >= 1e9)  return (num / 1e9).toFixed(1) + "<span class='tcw-bar-unit'>B</span>";
    if (num >= 1e6)  return (num / 1e6).toFixed(0) + "<span class='tcw-bar-unit'>M</span>";
    return Math.floor(num).toLocaleString("en-US");
  }

  function formatDollar(n) {
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "<span class='tcw-bar-unit'>B</span>";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "<span class='tcw-bar-unit'>M</span>";
    return "$" + Math.floor(n).toLocaleString("en-US");
  }

  // ─── Widget builder ──────────────────────────────────────────────────────────
  function buildAndStart(cfg) {
    var tokensPerMs = cfg.tokensPerDay / 86400 / 1000;
    var dollarPerMs = (cfg.tokensPerDay / 1e6 * cfg.blendedCostPerM) / 86400 / 1000;

    // Inject styles once
    if (!document.getElementById(STYLES_ID)) {
      var s = document.createElement("style");
      s.id = STYLES_ID;
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    // Find or create container
    var container = document.getElementById(WIDGET_ID);
    if (!container) return false;
    if (container.getAttribute("data-tcw-init")) return true;
    container.setAttribute("data-tcw-init", "1");

    container.innerHTML = '\
      <div class="tcw-bar">\
        <div class="tcw-bar-live">\
          <span class="tcw-bar-live-dot"></span>\
          <span class="tcw-bar-live-text">Live</span>\
        </div>\
        <span class="tcw-bar-title">Global AI Tokens</span>\
        <div class="tcw-bar-counters">\
          <div class="tcw-bar-item">\
            <span class="tcw-bar-label">Today</span>\
            <span class="tcw-bar-value cyan" id="tcw-m-tok-today">\u2014</span>\
          </div>\
          <div class="tcw-bar-item">\
            <span class="tcw-bar-label">This year</span>\
            <span class="tcw-bar-value green" id="tcw-m-tok-year">\u2014</span>\
          </div>\
          <div class="tcw-bar-item">\
            <span class="tcw-bar-label">$ Today</span>\
            <span class="tcw-bar-value gold" id="tcw-m-usd-today">\u2014</span>\
          </div>\
          <div class="tcw-bar-item">\
            <span class="tcw-bar-label">$ This year</span>\
            <span class="tcw-bar-value gold" id="tcw-m-usd-year">\u2014</span>\
          </div>\
        </div>\
      </div>\
    ';

    var elTokToday = document.getElementById("tcw-m-tok-today");
    var elUsdToday = document.getElementById("tcw-m-usd-today");
    var elTokYear  = document.getElementById("tcw-m-tok-year");
    var elUsdYear  = document.getElementById("tcw-m-usd-year");

    function update() {
      var now = new Date();
      var midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      var msToday = now - midnight;
      var msYear  = now - YEAR_START;

      elTokToday.innerHTML = formatTokens(msToday * tokensPerMs);
      elUsdToday.innerHTML = formatDollar(msToday * dollarPerMs);
      elTokYear.innerHTML  = formatTokens(msYear * tokensPerMs);
      elUsdYear.innerHTML  = formatDollar(msYear * dollarPerMs);
    }

    update();
    setInterval(update, 100);
    return true;
  }

  // ─── Data fetch + init ───────────────────────────────────────────────────────
  function initWidget() {
    var cfg = { tokensPerDay: DEFAULTS.tokensPerDay, blendedCostPerM: DEFAULTS.blendedCostPerM };

    fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (data) {
      if (data && data.tokensPerDay) cfg.tokensPerDay = data.tokensPerDay;
      if (data && data.blendedCostPerM) cfg.blendedCostPerM = data.blendedCostPerM;
    }).catch(function () {}).finally(function () {
      buildAndStart(cfg);
    });
  }

  // ─── Find the first-screen grid container ────────────────────────────────────
  function findTargetGrid() {
    var allEls = document.querySelectorAll('h3, h4, span');
    var headingEl = null;
    for (var i = 0; i < allEls.length; i++) {
      var text = allEls[i].textContent.trim();
      if (text === '\u0413\u043b\u0430\u0432\u043d\u044b\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u044f' || text === 'Top Events' ||
          text === '\u041a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u044f' || text === 'Key Events') {
        headingEl = allEls[i]; break;
      }
    }
    if (!headingEl) return null;
    var el = headingEl;
    var attempts = 0;
    while (el && attempts < 20) {
      el = el.parentElement;
      if (!el) break;
      attempts++;
      var cls = el.className;
      if (cls && typeof cls === 'string' && cls.indexOf('grid-cols') >= 0) return el;
    }
    return null;
  }

  // ─── Injection: insert BAR BEFORE the grid (as a sibling, not inside) ────────
  function tryInject() {
    var path = window.location.pathname;
    if (path !== "/" && path !== "" && path !== "/index.html") return false;

    // If already initialized, skip
    var existing = document.getElementById(WIDGET_ID);
    if (existing && existing.getAttribute("data-tcw-init")) return true;

    // If container already exists (shouldn't normally), just init
    if (existing) {
      initWidget();
      return true;
    }

    // Find the grid and insert BEFORE it
    var grid = findTargetGrid();
    if (!grid) return false;

    var container = document.createElement("div");
    container.id = WIDGET_ID;
    grid.parentNode.insertBefore(container, grid);
    initWidget();
    return true;
  }

  function waitAndInject() {
    var path = window.location.pathname;
    if (path !== "/" && path !== "" && path !== "/index.html") return;

    if (tryInject()) return;

    var attempts = 0;
    var observer = new MutationObserver(function () {
      attempts++;
      if (tryInject() || attempts > 150) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 30000);
  }

  // SPA navigation support
  var origPush = history.pushState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    setTimeout(waitAndInject, 200);
  };
  window.addEventListener("popstate", function () {
    setTimeout(waitAndInject, 200);
  });

  // Bootstrap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitAndInject);
  } else {
    waitAndInject();
  }
})();
