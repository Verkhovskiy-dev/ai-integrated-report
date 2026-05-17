/**
 * AI Models Pulse Widget v2
 * Injects a "Модели / Models" tab into the existing Тренды / Trends section.
 * No standalone block — fully native to the dashboard.
 */
(function () {
  'use strict';

  var FEED_URL = '/data/models-feed.json';
  var MAP_URL  = '/llm-map/#chronicle';

  /* ── i18n ─────────────────────────────────────────────── */
  var isRU = (document.documentElement.lang || 'ru').toLowerCase().startsWith('ru');
  var T = {
    tabTrends : isRU ? 'Тренды'  : 'Trends',
    tabModels : isRU ? 'Модели'  : 'Models',
    more      : isRU ? 'Все обновления моделей →' : 'All model updates →',
    loading   : isRU ? 'Загрузка…' : 'Loading…',
    noData    : isRU ? 'Нет данных' : 'No data',
    impact    : { major: '🔴', minor: '🟡', patch: '🟢' }
  };

  /* ── CSS (injected once) ──────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('amp-styles')) return;
    var s = document.createElement('style');
    s.id = 'amp-styles';
    s.textContent = [
      '.amp-tabs{display:flex;gap:4px;margin-bottom:16px;padding:3px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;width:fit-content;}',
      '.amp-tab{padding:5px 16px;border:none;border-radius:7px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;background:transparent;color:rgba(255,255,255,0.45);letter-spacing:.3px;}',
      '.amp-tab.active{background:rgba(0,212,255,0.12);color:#00d4ff;box-shadow:0 0 0 1px rgba(0,212,255,0.2);}',
      '.amp-tab:hover:not(.active){color:rgba(255,255,255,0.75);}',
      '.amp-feed{display:flex;flex-direction:column;gap:6px;}',
      '.amp-row{display:flex;align-items:baseline;gap:8px;padding:7px 10px;border-radius:8px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);transition:background .15s;text-decoration:none;color:inherit;}',
      '.amp-row:hover{background:rgba(255,255,255,0.05);}',
      '.amp-date{font-family:"IBM Plex Mono",monospace;font-size:11px;color:rgba(255,255,255,0.35);white-space:nowrap;min-width:44px;}',
      '.amp-model{font-family:"Space Grotesk",sans-serif;font-size:13px;font-weight:600;color:#e8e8f0;white-space:nowrap;}',
      '.amp-desc{font-size:12px;color:rgba(255,255,255,0.5);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.amp-dot{font-size:10px;flex-shrink:0;}',
      '.amp-footer{margin-top:10px;font-size:12px;}',
      '.amp-footer a{color:#00d4ff;text-decoration:none;opacity:.75;}',
      '.amp-footer a:hover{opacity:1;text-decoration:underline;}',
      '.amp-empty{font-size:13px;color:rgba(255,255,255,0.35);padding:12px 0;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── Find the Trends section heading ─────────────────── */
  function findTrendsHeading() {
    var headings = document.querySelectorAll('h3, h2');
    for (var i = 0; i < headings.length; i++) {
      var txt = headings[i].textContent.trim();
      if (/^(Тренды|Trends)(\s|$)/i.test(txt)) return headings[i];
    }
    return null;
  }

  /* ── Find the trends content container ───────────────── */
  function findTrendsContent(heading) {
    // Walk up to find a section/div that wraps the heading + cards
    var parent = heading.parentElement;
    for (var depth = 0; depth < 6; depth++) {
      if (!parent) break;
      // Look for sibling elements after the heading that contain trend cards
      var children = Array.prototype.slice.call(parent.children);
      var idx = children.indexOf(heading);
      if (idx >= 0 && children.length > idx + 1) {
        // Collect all siblings after the heading (the trend cards area)
        var after = children.slice(idx + 1);
        if (after.length > 0) return { parent: parent, heading: heading, contentNodes: after };
      }
      parent = parent.parentElement;
    }
    return null;
  }

  /* ── Render compact feed rows ─────────────────────────── */
  function renderFeed(events) {
    if (!events || events.length === 0) {
      return '<div class="amp-empty">' + T.noData + '</div>';
    }
    var months = isRU
      ? ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    var rows = events.slice(0, 5).map(function (ev) {
      var d = new Date(ev.date);
      var dateStr = d.getDate() + ' ' + months[d.getMonth()];
      var dot = T.impact[ev.impact] || '🟡';
      var href = ev.url ? ev.url : MAP_URL;
      var desc = (ev.event || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      var model = (ev.model || '').replace(/</g, '&lt;');
      return '<a class="amp-row" href="' + href + '" target="_blank" rel="noopener">' +
        '<span class="amp-date">' + dateStr + '</span>' +
        '<span class="amp-model">' + model + '</span>' +
        '<span class="amp-desc">' + desc + '</span>' +
        '<span class="amp-dot">' + dot + '</span>' +
        '</a>';
    }).join('');

    return '<div class="amp-feed">' + rows + '</div>' +
      '<div class="amp-footer"><a href="' + MAP_URL + '">' + T.more + '</a></div>';
  }

  /* ── Main injection ───────────────────────────────────── */
  function inject(feedData) {
    var heading = findTrendsHeading();
    if (!heading) return; // section not found — bail silently

    var ctx = findTrendsContent(heading);
    if (!ctx) return;

    injectStyles();

    // Wrap all content nodes in a single div for easy show/hide
    var contentWrapper = document.createElement('div');
    contentWrapper.id = 'amp-trends-content';
    ctx.contentNodes.forEach(function (node) {
      contentWrapper.appendChild(node);
    });
    ctx.parent.appendChild(contentWrapper);

    // Build feed wrapper (hidden by default)
    var feedWrapper = document.createElement('div');
    feedWrapper.id = 'amp-models-content';
    feedWrapper.style.display = 'none';
    feedWrapper.innerHTML = feedData
      ? renderFeed(feedData.events)
      : '<div class="amp-empty">' + T.noData + '</div>';
    ctx.parent.appendChild(feedWrapper);

    // Build tab bar
    var tabBar = document.createElement('div');
    tabBar.className = 'amp-tabs';
    tabBar.innerHTML =
      '<button class="amp-tab active" id="amp-tab-trends">' + T.tabTrends + '</button>' +
      '<button class="amp-tab" id="amp-tab-models">' + T.tabModels + '</button>';

    // Insert tab bar right after the heading
    heading.insertAdjacentElement('afterend', tabBar);

    // Tab click handlers
    document.getElementById('amp-tab-trends').addEventListener('click', function () {
      document.getElementById('amp-tab-trends').classList.add('active');
      document.getElementById('amp-tab-models').classList.remove('active');
      contentWrapper.style.display = '';
      feedWrapper.style.display = 'none';
    });

    document.getElementById('amp-tab-models').addEventListener('click', function () {
      document.getElementById('amp-tab-models').classList.add('active');
      document.getElementById('amp-tab-trends').classList.remove('active');
      contentWrapper.style.display = 'none';
      feedWrapper.style.display = '';
    });
  }

  /* ── Bootstrap ────────────────────────────────────────── */
  function run() {
    fetch(FEED_URL)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (data) {
        // React SPA may still be rendering — retry until heading appears
        var attempts = 0;
        function tryInject() {
          if (findTrendsHeading()) {
            inject(data);
          } else if (attempts++ < 30) {
            setTimeout(tryInject, 400);
          }
        }
        tryInject();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
