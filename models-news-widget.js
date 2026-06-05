/**
 * Models News Widget (Новости моделей) — Standalone Injection Script v3
 * Injects a compact news feed into the first-screen 2-column grid
 * (class "grid grid-cols-1 lg:grid-cols-2 gap-4") that contains
 * "Главные события" and "Радар изменений" / SRT widget.
 *
 * Data source: /data/models-feed.json
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
  function t(ru, en) { return isEN() ? en : ru; }

  var MONTHS_RU = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  var MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* ─── Helpers ──────────────────────────────────────────────────────────── */
  function fetchJSON(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function fmtDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || '';
    var months = isEN() ? MONTHS_EN : MONTHS_RU;
    return d.getDate() + ' ' + months[d.getMonth()];
  }

  function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

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

    return '<div id="' + WIDGET_ID + '" class="mnw-card">' +
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
    '.mnw-card{background:rgba(26,27,46,0.95);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;font-family:"IBM Plex Sans",sans-serif;color:#e2e8f0;min-width:0;overflow:hidden;align-self:start;}',
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

  /* ─── Find the specific 2-col grid on the first screen ─────────────────── */
  function findTargetGrid() {
    // Strategy: find the heading "Главные события" / "Top Events", then walk up
    // to find the parent grid with class containing "grid-cols"
    var allEls = document.querySelectorAll('h3, h4, span');
    var headingEl = null;

    for (var i = 0; i < allEls.length; i++) {
      var text = allEls[i].textContent.trim();
      if (text === 'Главные события' || text === 'Top Events' ||
          text === 'Ключевые события' || text === 'Key Events') {
        headingEl = allEls[i];
        break;
      }
    }

    if (!headingEl) return null;

    // Walk up to find the grid container with "grid-cols" in its class
    var el = headingEl;
    var attempts = 0;
    while (el && attempts < 20) {
      el = el.parentElement;
      if (!el) break;
      attempts++;

      var cls = el.className;
      if (cls && typeof cls === 'string' && cls.indexOf('grid-cols') >= 0) {
        // Found a grid-cols container. Verify it's the right one
        // (should contain the heading we found)
        return el;
      }
    }

    return null;
  }

  /* ─── Main injection ───────────────────────────────────────────────────── */
  function inject() {
    var path = window.location.pathname;
    if (path !== '/' && path !== '' && path !== '/index.html') return false;
    if (document.getElementById(WIDGET_ID)) return true;

    var grid = findTargetGrid();
    if (!grid) return false;

    fetchJSON(DATA_URL).then(function (data) {
      if (document.getElementById(WIDGET_ID)) return;

      var events = data && data.events ? data.events : [];
      injectStyles();

      // Create widget element
      var wrapper = document.createElement('div');
      wrapper.innerHTML = buildWidget(events);
      var widgetEl = wrapper.firstElementChild;

      // Insert as the SECOND child (between "Главные события" and "Радар изменений"/SRT)
      // Actually better: insert as the LAST child of this specific grid
      // and change the grid to 3 columns
      grid.appendChild(widgetEl);

      // Modify the grid class: replace "lg:grid-cols-2" with "lg:grid-cols-3"
      var cls = grid.className;
      if (cls.indexOf('lg:grid-cols-2') >= 0) {
        grid.className = cls.replace('lg:grid-cols-2', 'lg:grid-cols-3');
      } else if (cls.indexOf('grid-cols-2') >= 0) {
        grid.className = cls.replace('grid-cols-2', 'grid-cols-3');
      } else {
        // Fallback: force 3 columns via inline style
        grid.style.gridTemplateColumns = '1.4fr 1fr 1fr';
      }
    });

    return true;
  }

  /* ─── Observer ─────────────────────────────────────────────────────────── */
  function waitAndInject() {
    var path = window.location.pathname;
    if (path !== '/' && path !== '' && path !== '/index.html') return;

    if (inject()) return;

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
    setTimeout(function () { observer.disconnect(); }, 30000);
  }

  /* ─── SPA support ──────────────────────────────────────────────────────── */
  var origPush = history.pushState;
  history.pushState = function () {
    origPush.apply(this, arguments);
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
