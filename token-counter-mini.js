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
    .tcw-mini {\n\
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;\n\
      background: #1c2127;\n\
      border: 1px solid #252c33;\n\
      border-radius: 14px;\n\
      padding: 20px 22px 16px;\n\
      box-sizing: border-box;\n\
      width: 100%;\n\
      min-width: 0;\n\
    }\n\
    .tcw-mini * { box-sizing: border-box; }\n\
    .tcw-mini-header {\n\
      display: flex; align-items: center; justify-content: space-between;\n\
      margin-bottom: 14px;\n\
    }\n\
    .tcw-mini-title {\n\
      font-size: 10px; font-weight: 600;\n\
      text-transform: uppercase; letter-spacing: 1.2px;\n\
      color: #6b7a8d;\n\
    }\n\
    .tcw-mini-live {\n\
      display: flex; align-items: center; gap: 5px;\n\
      font-size: 10px; color: #00e5a0; font-weight: 500;\n\
    }\n\
    .tcw-mini-live-dot {\n\
      width: 6px; height: 6px; border-radius: 50%;\n\
      background: #00e5a0;\n\
      animation: tcw-mini-pulse 2s ease-in-out infinite;\n\
    }\n\
    @keyframes tcw-mini-pulse {\n\
      0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)}\n\
    }\n\
    .tcw-mini-grid {\n\
      display: grid;\n\
      grid-template-columns: 1fr 1fr;\n\
      gap: 10px 16px;\n\
    }\n\
    .tcw-mini-cell {}\n\
    .tcw-mini-label {\n\
      font-size: 9.5px; font-weight: 500;\n\
      text-transform: uppercase; letter-spacing: 0.7px;\n\
      color: #6b7a8d; margin-bottom: 2px;\n\
    }\n\
    .tcw-mini-value {\n\
      font-family: 'JetBrains Mono', monospace;\n\
      font-weight: 700; line-height: 1.2;\n\
    }\n\
    .tcw-mini-value.cyan {\n\
      font-size: 22px; color: #00d4ff;\n\
      text-shadow: 0 0 12px rgba(0,212,255,0.4);\n\
    }\n\
    .tcw-mini-value.green {\n\
      font-size: 18px; color: #00e5a0;\n\
      text-shadow: 0 0 12px rgba(0,229,160,0.35);\n\
    }\n\
    .tcw-mini-value.gold {\n\
      font-size: 20px; color: #ffd700;\n\
      text-shadow: 0 0 12px rgba(255,215,0,0.4);\n\
    }\n\
    .tcw-mini-value.gold-sm {\n\
      font-size: 16px; color: #ffd700;\n\
      text-shadow: 0 0 10px rgba(255,215,0,0.35);\n\
    }\n\
    .tcw-mini-unit {\n\
      font-size: 11px; font-weight: 400;\n\
      color: #6b7a8d; margin-left: 3px;\n\
    }\n\
    .tcw-mini-footer {\n\
      margin-top: 12px;\n\
      text-align: right;\n\
    }\n\
    .tcw-mini-link {\n\
      font-size: 11px; color: #00e5a0; text-decoration: none;\n\
      font-weight: 500; transition: color .2s;\n\
    }\n\
    .tcw-mini-link:hover { color: #00c8d7; text-decoration: underline; }\n\
    @media (max-width: 360px) {\n\
      .tcw-mini-grid { grid-template-columns: 1fr; }\n\
      .tcw-mini-value.cyan { font-size: 18px; }\n\
      .tcw-mini-value.gold { font-size: 16px; }\n\
    }\n\
  ";

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function formatTokens(num) {
    if (num >= 1e15) return (num / 1e15).toFixed(3) + " Q";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " T";
    if (num >= 1e9)  return (num / 1e9).toFixed(2) + " B";
    if (num >= 1e6)  return (num / 1e6).toFixed(1) + " M";
    return Math.floor(num).toLocaleString("en-US");
  }

  function formatDollar(n) {
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
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
      <div class="tcw-mini">\
        <div class="tcw-mini-header">\
          <span class="tcw-mini-title">Global AI Token Monitor</span>\
          <span class="tcw-mini-live"><span class="tcw-mini-live-dot"></span>Live</span>\
        </div>\
        <div class="tcw-mini-grid">\
          <div class="tcw-mini-cell">\
            <div class="tcw-mini-label">Tokens today</div>\
            <div class="tcw-mini-value cyan" id="tcw-m-tok-today">—</div>\
          </div>\
          <div class="tcw-mini-cell">\
            <div class="tcw-mini-label">Spend today</div>\
            <div class="tcw-mini-value gold" id="tcw-m-usd-today">—</div>\
          </div>\
          <div class="tcw-mini-cell">\
            <div class="tcw-mini-label">Tokens this year</div>\
            <div class="tcw-mini-value green" id="tcw-m-tok-year">—</div>\
          </div>\
          <div class="tcw-mini-cell">\
            <div class="tcw-mini-label">Spend this year</div>\
            <div class="tcw-mini-value gold-sm" id="tcw-m-usd-year">—</div>\
          </div>\
        </div>\
        <div class="tcw-mini-footer">\
          <a href="/llm-map/" class="tcw-mini-link">See full monitor \u2192</a>\
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

      elTokToday.innerHTML = formatTokens(msToday * tokensPerMs) + '<span class="tcw-mini-unit">tokens</span>';
      elUsdToday.textContent = formatDollar(msToday * dollarPerMs);
      elTokYear.innerHTML  = formatTokens(msYear * tokensPerMs) + '<span class="tcw-mini-unit">tokens</span>';
      elUsdYear.textContent  = formatDollar(msYear * dollarPerMs);
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

  // ─── Find first-screen grid (same heuristic as models-news-widget) ──────────
  function findTargetGrid() {
    var allEls = document.querySelectorAll('h3, h4, span');
    var headingEl = null;
    for (var i = 0; i < allEls.length; i++) {
      var text = allEls[i].textContent.trim();
      if (text === 'Главные события' || text === 'Top Events' ||
          text === 'Ключевые события' || text === 'Key Events') {
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

  // ─── SPA-aware injection (same pattern as other widgets) ─────────────────────
  function tryInject() {
    var path = window.location.pathname;
    if (path !== "/" && path !== "" && path !== "/index.html") return false;

    // If container already exists, just init
    if (document.getElementById(WIDGET_ID)) {
      if (!document.getElementById(WIDGET_ID).getAttribute('data-tcw-init')) initWidget();
      return true;
    }

    // Create container inside the first-screen grid
    var grid = findTargetGrid();
    if (!grid) return false;

    var container = document.createElement('div');
    container.id = WIDGET_ID;
    // Insert as the first child of the grid so it appears at the top-left
    grid.insertBefore(container, grid.firstChild);
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
