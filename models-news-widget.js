/**
 * Models News Widget (Новости моделей) — Standalone Injection Script v2
 * Injects a compact news feed of AI model updates into the first screen
 * of the dashboard, alongside "Главные события" and "Карта мест СРТ".
 *
 * Data source: /data/models-feed.json
 * Target: The grid/flex container holding the first-screen cards
 *
 * ─── ROLLBACK ───────────────────────────────────────────────────────────────
 * Tag: pre-models-news-widget
 * To rollback:
 *   git reset --hard pre-models-news-widget && git push --force origin gh-pages
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var WIDGET_ID = 'models-news-widget';
  var DATA_URL = '/data/models-feed.json';
  var MAP_URL = '/llm-map/';
  var CHRONICLE_URL = '/llm-map/#chronicle';

  /* ─── i18n ─────────────────────────────────────────────────────────────── */
  function isEN() {
    return (document.documentElement.lang || 'ru').toLowerCase() === 'en' ||
      window.location.pathname.includes('/en') ||
      window.location.search.includes('lang=en');
  }

  var MONTHS_RU = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  var MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function t(ru, en) { return isEN() ? en : ru; }

  /* ─── Fetch data ───────────────────────────────────────────────────────── */
  function fetchJSON(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* ─── Format date ──────────────────────────────────────────────────────── */
  function fmtDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || '';
    var months = isEN() ? MONTHS_EN : MONTHS_RU;
    return d.getDate() + ' ' + months[d.getMonth()];
  }

  /* ─── Escape HTML ──────────────────────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ─── Impact dot ───────────────────────────────────────────────────────── */
  function dot(impact) {
    if (impact === 'major') return '<span class="mnw-dot" title="Major">\uD83D\uDD34</span>';
    if (impact === 'patch') return '<span class="mnw-dot" title="Patch">\uD83D\uDFE2</span>';
    return '<span class="mnw-dot" title="Minor">\uD83D\uDFE1</span>';
  }

  /* ─── Build widget HTML ────────────────────────────────────────────────── */
  function buildWidget(events) {
    var items = (events || []).slice(0, 5);
    var rows = '';

    if (items.length === 0) {
      rows = '<div class="mnw-empty">' + t('Нет данных', 'No data') + '</div>';
    } else {
      rows = '<ul class="mnw-list">';
      for (var i = 0; i < items.length; i++) {
        var ev = items[i];
        rows += '<li class="mnw-item">' +
          '<span class="mnw-date">' + fmtDate(ev.date) + '</span>' +
          '<div class="mnw-content">' +
            '<div class="mnw-model">' + esc(ev.model) + '</div>' +
            '<div class="mnw-event">' + esc(ev.event) + '</div>' +
          '</div>' +
          dot(ev.impact) +
        '</li>';
      }
      rows += '</ul>';
    }

    return '<div id="' + WIDGET_ID + '">' +
      '<div class="mnw-header">' +
        '<h4 class="mnw-title">\u26A1 ' + t('Новости моделей', 'Models News') + '</h4>' +
        '<a href="' + MAP_URL + '" class="mnw-guide-btn">' + t('Гайд по моделям \u2192', 'Models Guide \u2192') + '</a>' +
      '</div>' +
      rows +
      '<div class="mnw-footer"><a href="' + CHRONICLE_URL + '">' + t('Все обновления \u2192', 'All updates \u2192') + '</a></div>' +
    '</div>';
  }

  /* ─── CSS ──────────────────────────────────────────────────────────────── */
  var CSS = [
    '#' + WIDGET_ID + '{background:rgba(26,27,46,0.95);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;font-family:"IBM Plex Sans",sans-serif;color:#e2e8f0;min-width:0;overflow:hidden;}',
    '.mnw-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:8px;flex-wrap:wrap;}',
    '.mnw-title{font-family:"Space Grotesk",sans-serif;font-size:15px;font-weight:700;color:#fff;margin:0;white-space:nowrap;}',
    '.mnw-guide-btn{display:inline-flex;align-items:center;padding:4px 12px;background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.3);border-radius:20px;color:#00d4ff;font-size:11px;font-weight:600;text-decoration:none;transition:all .2s;white-space:nowrap;}',
    '.mnw-guide-btn:hover{background:rgba(0,212,255,0.22);border-color:rgba(0,212,255,0.5);}',
    '.mnw-list{list-style:none;margin:0;padding:0;}',
    '.mnw-item{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:10px 8px;border-radius:8px;transition:background .15s;}',
    '.mnw-item:hover{background:rgba(255,255,255,0.03);}',
    '.mnw-item+.mnw-item{border-top:1px solid rgba(255,255,255,0.04);}',
    '.mnw-date{font-family:"IBM Plex Mono",monospace;font-size:11px;color:rgba(255,255,255,0.4);white-space:nowrap;padding-top:2px;}',
    '.mnw-content{min-width:0;}',
    '.mnw-model{font-weight:600;font-size:13px;color:#fff;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.mnw-event{font-size:11px;color:rgba(255,255,255,0.45);line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.mnw-dot{font-size:10px;padding-top:3px;}',
    '.mnw-footer{margin-top:14px;text-align:right;}',
    '.mnw-footer a{color:rgba(0,212,255,0.7);font-size:11px;font-weight:500;text-decoration:none;}',
    '.mnw-footer a:hover{color:#00d4ff;text-decoration:underline;}',
    '.mnw-empty{text-align:center;color:rgba(255,255,255,0.3);font-size:12px;padding:20px 0;}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('mnw-styles')) return;
    var s = document.createElement('style');
    s.id = 'mnw-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ─── Find injection point ─────────────────────────────────────────────── */
  function findFirstScreenGrid() {
    // Strategy: find the heading "Главные события" / "Top Events" / "Ключевые события" / "Key Events"
    var allEls = document.querySelectorAll('h2, h3, h4, span, p, div');
    var targetEl = null;

    for (var i = 0; i < allEls.length; i++) {
      var text = allEls[i].textContent.trim();
      // Match the exact heading (not a container that includes it in children)
      if (allEls[i].children.length > 3) continue; // skip containers
      if (/^(Главные событи|Top Events|Ключевые событи|Key Events)/i.test(text) ||
          text === 'Главные события' || text === 'Top Events' ||
          text === 'Ключевые события' || text === 'Key Events') {
        targetEl = allEls[i];
        break;
      }
    }

    if (!targetEl) return null;

    // Walk up to find the grid/flex parent that holds the two-column layout
    var el = targetEl;
    var attempts = 0;
    while (el && attempts < 15) {
      el = el.parentElement;
      if (!el) break;
      attempts++;
      var style = window.getComputedStyle(el);
      var display = style.display;
      // Look for grid or flex container with at least 2 direct children
      if ((display === 'grid' || display === 'flex') && el.children.length >= 2) {
        // Check if children are substantial (not just small inline elements)
        var hasLargeChildren = false;
        for (var c = 0; c < el.children.length; c++) {
          if (el.children[c].offsetHeight > 80) {
            hasLargeChildren = true;
            break;
          }
        }
        if (hasLargeChildren) return el;
      }
      // Also match by Tailwind class
      if (el.className && typeof el.className === 'string' &&
          (el.className.indexOf('grid') >= 0) &&
          el.children.length >= 2) {
        return el;
      }
    }

    // Fallback: find the rounded card container and return its parent
    el = targetEl;
    attempts = 0;
    while (el && attempts < 10) {
      if (el.className && typeof el.className === 'string' &&
          el.className.indexOf('rounded') >= 0 && el.offsetHeight > 100) {
        return el.parentElement;
      }
      el = el.parentElement;
      attempts++;
    }

    return null;
  }

  /* ─── Main injection ───────────────────────────────────────────────────── */
  function inject() {
    // Only run on main page
    var path = window.location.pathname;
    if (path !== '/' && path !== '' && path !== '/index.html') return false;

    // Don't inject twice
    if (document.getElementById(WIDGET_ID)) return true;

    var grid = findFirstScreenGrid();
    if (!grid) return false;

    // Fetch data then inject
    fetchJSON(DATA_URL).then(function (data) {
      if (document.getElementById(WIDGET_ID)) return; // race check

      var events = data && data.events ? data.events : [];
      injectStyles();

      // Create the widget element
      var widgetWrapper = document.createElement('div');
      widgetWrapper.innerHTML = buildWidget(events);
      var widgetEl = widgetWrapper.firstElementChild;

      // Append as a new child of the grid container
      grid.appendChild(widgetEl);

      // Adjust grid to accommodate 3 columns if it's currently 2-col
      var style = window.getComputedStyle(grid);
      if (style.display === 'grid') {
        var currentCols = style.gridTemplateColumns;
        // Only modify if it looks like a 2-column layout
        var colCount = currentCols ? currentCols.split(/\s+/).length : 0;
        if (colCount <= 2) {
          grid.style.gridTemplateColumns = '1.4fr 1fr 1fr';
        }
      } else if (style.display === 'flex') {
        // For flex: widget will naturally flow as third item
        if (!grid.style.flexWrap || grid.style.flexWrap === 'wrap') {
          grid.style.flexWrap = 'nowrap';
        }
      }
    });

    return true;
  }

  /* ─── Observer: wait for React to render ───────────────────────────────── */
  function waitAndInject() {
    var path = window.location.pathname;
    if (path !== '/' && path !== '' && path !== '/index.html') return;

    // Try immediately
    if (inject()) return;

    // Use MutationObserver
    var attempts = 0;
    var observer = new MutationObserver(function () {
      attempts++;
      if (document.getElementById(WIDGET_ID)) {
        observer.disconnect();
        return;
      }
      if (inject() || attempts > 150) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Safety timeout
    setTimeout(function () { observer.disconnect(); }, 30000);
  }

  /* ─── SPA navigation support ───────────────────────────────────────────── */
  var origPushState = history.pushState;
  history.pushState = function () {
    origPushState.apply(this, arguments);
    setTimeout(waitAndInject, 200);
  };
  window.addEventListener('popstate', function () {
    setTimeout(waitAndInject, 200);
  });

  /* ─── Bootstrap ────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInject);
  } else {
    waitAndInject();
  }
})();
