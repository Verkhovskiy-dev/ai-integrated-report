/**
 * AI Models Pulse Widget v2.1
 * Injects a "Модели / Models" tab into the existing Тренды / Trends section.
 * Heading detection: looks for span/p/div containing "Динамика трендов" or
 * "Trend Dynamics", then targets the parent section; also matches h3 with
 * "Моментум" or "Momentum" as fallback.
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
    noData    : isRU ? 'Нет данных' : 'No data',
    impact    : { major: '🔴', minor: '🟡', patch: '🟢' }
  };

  /* ── CSS (injected once) ──────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('amp-styles')) return;
    var s = document.createElement('style');
    s.id = 'amp-styles';
    s.textContent = [
      '.amp-tabs{display:flex;gap:4px;margin:12px 0 16px;padding:3px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;width:fit-content;}',
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
      '.amp-empty{font-size:13px;color:rgba(255,255,255,0.35);padding:12px 0;}',
      '@media(max-width:600px){.amp-row{flex-wrap:wrap;gap:4px}.amp-desc{min-width:100%;order:4}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── Find the Trends section ─────────────────────────── */
  function findTrendsSection() {
    // Strategy 1: look for the section-label span containing
    // "Динамика трендов" or "Trend Dynamics"
    var allEls = document.querySelectorAll('span, p, div');
    for (var i = 0; i < allEls.length; i++) {
      var txt = allEls[i].textContent.trim();
      if (/^Динамика\s+трендов$/i.test(txt) || /^Trend\s+Dynamics$/i.test(txt)) {
        // Walk up to find the wrapping section container
        var section = allEls[i].closest('section') || allEls[i].parentElement;
        return { section: section, labelEl: allEls[i] };
      }
    }

    // Strategy 2: look for h3 containing "Моментум" or "Momentum"
    var headings = document.querySelectorAll('h2, h3');
    for (var j = 0; j < headings.length; j++) {
      var htxt = headings[j].textContent.trim();
      if (/Моментум/i.test(htxt) || /Momentum/i.test(htxt)) {
        var sec = headings[j].closest('section') || headings[j].parentElement;
        return { section: sec, labelEl: headings[j] };
      }
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
    var found = findTrendsSection();
    if (!found) return;

    var section = found.section;
    var labelEl = found.labelEl;

    // Prevent double-injection
    if (document.getElementById('amp-tabs')) return;

    injectStyles();

    // Collect all children of the section that come AFTER the label element.
    // We need to find the heading (h3) and everything after it as "trend content".
    var children = Array.prototype.slice.call(section.children);
    var labelIdx = -1;
    for (var i = 0; i < children.length; i++) {
      if (children[i] === labelEl || children[i].contains(labelEl)) {
        labelIdx = i;
        break;
      }
    }

    // Find the h3 (the main heading like "Моментум структурных сдвигов")
    var h3 = section.querySelector('h3') || section.querySelector('h2');
    var h3Idx = h3 ? children.indexOf(h3) : labelIdx;
    var startIdx = Math.max(labelIdx, h3Idx) + 1;

    // Wrap everything after the heading into a content div
    var contentWrapper = document.createElement('div');
    contentWrapper.id = 'amp-trends-content';
    var nodesToMove = children.slice(startIdx);
    nodesToMove.forEach(function (node) {
      contentWrapper.appendChild(node);
    });
    section.appendChild(contentWrapper);

    // Build feed wrapper (hidden by default)
    var feedWrapper = document.createElement('div');
    feedWrapper.id = 'amp-models-content';
    feedWrapper.style.display = 'none';
    feedWrapper.innerHTML = feedData
      ? renderFeed(feedData.events)
      : '<div class="amp-empty">' + T.noData + '</div>';
    section.appendChild(feedWrapper);

    // Build tab bar — insert right after the h3
    var tabBar = document.createElement('div');
    tabBar.className = 'amp-tabs';
    tabBar.id = 'amp-tabs';
    tabBar.innerHTML =
      '<button class="amp-tab active" id="amp-tab-trends">' + T.tabTrends + '</button>' +
      '<button class="amp-tab" id="amp-tab-models">' + T.tabModels + '</button>';

    if (h3 && h3.nextSibling) {
      h3.parentNode.insertBefore(tabBar, h3.nextSibling);
    } else if (h3) {
      h3.parentNode.appendChild(tabBar);
    } else {
      section.insertBefore(tabBar, contentWrapper);
    }

    // Tab click handlers
    document.getElementById('amp-tab-trends').addEventListener('click', function () {
      this.classList.add('active');
      document.getElementById('amp-tab-models').classList.remove('active');
      contentWrapper.style.display = '';
      feedWrapper.style.display = 'none';
    });

    document.getElementById('amp-tab-models').addEventListener('click', function () {
      this.classList.add('active');
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
        var attempts = 0;
        function tryInject() {
          if (findTrendsSection()) {
            inject(data);
          } else if (attempts++ < 40) {
            setTimeout(tryInject, 500);
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
