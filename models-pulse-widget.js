/**
 * AI Models Pulse Widget — Standalone Injection Script
 * Injects a live feed of AI model updates into the main dashboard page.
 * 
 * Data source: /data/models-feed.json
 * Injection point: After "Ключевой инсайт" / "Key Insight" section,
 *                  or before "Радар изменений" / "Change Radar" if not found.
 */
(function () {
  'use strict';

  /* ─── Constants ────────────────────────────────────────────────────────── */
  const WIDGET_ID = 'models-pulse-widget';
  const DATA_URL = '/data/models-feed.json';
  const LLM_MAP_URL = '/llm-map/#chronicle';
  const MAX_EVENTS = 4;
  const RETRY_INTERVAL = 500;
  const MAX_RETRIES = 20;

  /* ─── Locale detection ─────────────────────────────────────────────────── */
  function isEnglish() {
    return document.documentElement.lang === 'en' ||
      document.body.classList.contains('lang-en') ||
      window.location.pathname.includes('/en') ||
      window.location.search.includes('lang=en');
  }

  function t(ru, en) {
    return isEnglish() ? en : ru;
  }

  /* ─── Impact badge ─────────────────────────────────────────────────────── */
  function impactBadge(impact) {
    const map = {
      major: { emoji: '🔴', label: t('Major', 'Major'), cls: 'mp-impact-major' },
      minor: { emoji: '🟡', label: t('Minor', 'Minor'), cls: 'mp-impact-minor' },
      patch: { emoji: '🟢', label: t('Patch', 'Patch'), cls: 'mp-impact-patch' }
    };
    const info = map[impact] || map.minor;
    return `<span class="mp-impact-badge ${info.cls}">${info.emoji} ${info.label}</span>`;
  }

  /* ─── Trend arrow ──────────────────────────────────────────────────────── */
  function trendArrow(trend) {
    if (trend === 'up') return '<span class="mp-trend-up">↑</span>';
    if (trend === 'down') return '<span class="mp-trend-down">↓</span>';
    return '<span class="mp-trend-flat">→</span>';
  }

  /* ─── Format date ──────────────────────────────────────────────────────── */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = isEnglish()
      ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      : ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    return `${day} ${months[d.getMonth()]}`;
  }

  /* ─── Inject styles ────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('mp-styles')) return;
    const style = document.createElement('style');
    style.id = 'mp-styles';
    style.textContent = `
      #${WIDGET_ID} {
        margin: 32px 0;
        padding: 28px;
        background: rgba(15, 15, 35, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(0, 212, 255, 0.12);
        border-radius: 16px;
        font-family: 'IBM Plex Sans', -apple-system, sans-serif;
        color: #e8e8f0;
        position: relative;
        overflow: hidden;
      }
      #${WIDGET_ID}::before {
        content: '';
        position: absolute;
        top: -60%;
        right: -20%;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, transparent 70%);
        pointer-events: none;
      }
      .mp-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        position: relative;
        z-index: 1;
      }
      .mp-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #e8e8f0;
      }
      .mp-icon {
        font-size: 20px;
      }
      .mp-live-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px;
        background: rgba(0, 255, 136, 0.12);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 12px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        color: #00ff88;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .mp-live-dot {
        width: 6px;
        height: 6px;
        background: #00ff88;
        border-radius: 50%;
        animation: mp-pulse 1.5s infinite;
      }
      @keyframes mp-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .mp-body {
        display: grid;
        grid-template-columns: 1fr 200px;
        gap: 24px;
        position: relative;
        z-index: 1;
      }
      .mp-events {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .mp-event {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        transition: all 0.2s;
        text-decoration: none;
        color: inherit;
      }
      .mp-event:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(0, 212, 255, 0.2);
      }
      .mp-event-date {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        color: #6b6b80;
        white-space: nowrap;
        min-width: 52px;
      }
      .mp-event-model {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #00d4ff;
        white-space: nowrap;
      }
      .mp-event-text {
        font-size: 13px;
        color: #a0a0b8;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mp-impact-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 6px;
        white-space: nowrap;
        font-family: 'IBM Plex Mono', monospace;
      }
      .mp-impact-major { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
      .mp-impact-minor { background: rgba(234, 179, 8, 0.12); color: #eab308; }
      .mp-impact-patch { background: rgba(0, 255, 136, 0.12); color: #00ff88; }
      .mp-sidebar {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0, 212, 255, 0.04);
        border: 1px solid rgba(0, 212, 255, 0.1);
        border-radius: 12px;
        text-align: center;
      }
      .mp-sidebar-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #6b6b80;
        margin-bottom: 8px;
      }
      .mp-sidebar-count {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 36px;
        font-weight: 700;
        color: #00d4ff;
        line-height: 1;
      }
      .mp-sidebar-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 6px;
        font-size: 13px;
        color: #a0a0b8;
      }
      .mp-trend-up { color: #00ff88; font-weight: 700; }
      .mp-trend-down { color: #ef4444; font-weight: 700; }
      .mp-trend-flat { color: #eab308; font-weight: 700; }
      .mp-sidebar-sublabel {
        font-size: 11px;
        color: #6b6b80;
        margin-top: 4px;
      }
      .mp-footer {
        margin-top: 16px;
        text-align: right;
        position: relative;
        z-index: 1;
      }
      .mp-footer a {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #00d4ff;
        text-decoration: none;
        transition: opacity 0.2s;
      }
      .mp-footer a:hover { opacity: 0.7; }

      /* ─── Responsive ─── */
      @media (max-width: 768px) {
        #${WIDGET_ID} {
          padding: 20px;
          margin: 20px 0;
        }
        .mp-body {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .mp-sidebar {
          flex-direction: row;
          justify-content: space-around;
          padding: 14px;
        }
        .mp-event {
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px 10px;
        }
        .mp-event-text {
          white-space: normal;
          flex-basis: 100%;
          order: 4;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ─── Build widget HTML ────────────────────────────────────────────────── */
  function buildWidget(data) {
    const events = (data.events || []).slice(0, MAX_EVENTS);
    const eventsHTML = events.map(ev => {
      const tag = ev.url ? 'a' : 'div';
      const href = ev.url ? ` href="${ev.url}" target="_blank" rel="noopener"` : '';
      return `<${tag} class="mp-event"${href}>
        <span class="mp-event-date">${formatDate(ev.date)}</span>
        <span class="mp-event-model">${ev.model}</span>
        <span class="mp-event-text">${ev.event}</span>
        ${impactBadge(ev.impact)}
      </${tag}>`;
    }).join('');

    return `
      <div class="mp-header">
        <span class="mp-icon">⚡</span>
        <span class="mp-title">AI Models Pulse</span>
        <span class="mp-live-badge"><span class="mp-live-dot"></span>LIVE</span>
      </div>
      <div class="mp-body">
        <div class="mp-events">${eventsHTML}</div>
        <div class="mp-sidebar">
          <div class="mp-sidebar-label">${t('Активность рынка', 'Market Activity')}</div>
          <div class="mp-sidebar-count">${data.weeklyCount || 0}</div>
          <div class="mp-sidebar-trend">
            ${trendArrow(data.weeklyTrend)}
            <span>${t('за 7 дней', '7 days')}</span>
          </div>
          <div class="mp-sidebar-sublabel">${t('релизов', 'releases')}</div>
        </div>
      </div>
      <div class="mp-footer">
        <a href="${LLM_MAP_URL}">${t('Все новости моделей →', 'All model news →')}</a>
      </div>
    `;
  }

  /* ─── Find injection point ─────────────────────────────────────────────── */
  function findAnchor() {
    // Strategy 1: After "Ключевой инсайт" / "Key Insight"
    const headings = document.querySelectorAll('h2, h3');
    for (const h of headings) {
      const text = h.textContent.toLowerCase();
      if (text.includes('ключевой инсайт') || text.includes('key insight')) {
        // Find the parent section/card
        let parent = h.closest('section') || h.closest('[class*="card"]') || h.closest('[class*="insight"]') || h.parentElement;
        // Walk up to find a reasonable container
        while (parent && parent.parentElement && parent.parentElement.id !== 'root' && !parent.parentElement.classList.contains('dashboard')) {
          if (parent.nextElementSibling) break;
          parent = parent.parentElement;
        }
        return { element: parent, position: 'after' };
      }
    }

    // Strategy 2: Before "Радар изменений" / "Change Radar"
    for (const h of headings) {
      const text = h.textContent.toLowerCase();
      if (text.includes('радар изменений') || text.includes('change radar')) {
        let parent = h.closest('section') || h.closest('[class*="card"]') || h.parentElement;
        while (parent && parent.parentElement && parent.parentElement.id !== 'root' && !parent.parentElement.classList.contains('dashboard')) {
          if (parent.previousElementSibling) break;
          parent = parent.parentElement;
        }
        return { element: parent, position: 'before' };
      }
    }

    // Strategy 3: Before SRT Places Widget if it exists
    const srtWidget = document.getElementById('srt-places-widget');
    if (srtWidget) {
      return { element: srtWidget, position: 'before' };
    }

    // Strategy 4: Append to main content area
    const main = document.querySelector('main') || document.querySelector('[class*="content"]') || document.querySelector('#root > div');
    if (main) {
      // Find a reasonable position — after the first few sections
      const sections = main.children;
      if (sections.length > 2) {
        return { element: sections[2], position: 'after' };
      }
      return { element: main, position: 'append' };
    }

    return null;
  }

  /* ─── Inject widget ────────────────────────────────────────────────────── */
  function inject(data) {
    if (document.getElementById(WIDGET_ID)) return;

    const anchor = findAnchor();
    if (!anchor) return;

    injectStyles();

    const widget = document.createElement('div');
    widget.id = WIDGET_ID;
    widget.innerHTML = buildWidget(data);

    if (anchor.position === 'after') {
      anchor.element.insertAdjacentElement('afterend', widget);
    } else if (anchor.position === 'before') {
      anchor.element.insertAdjacentElement('beforebegin', widget);
    } else {
      anchor.element.appendChild(widget);
    }
  }

  /* ─── Fetch data and inject ────────────────────────────────────────────── */
  function fetchAndInject() {
    fetch(DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        waitForReact(data, 0);
      })
      .catch(err => {
        console.warn('[Models Pulse] Data unavailable, widget hidden:', err.message);
      });
  }

  /* ─── Wait for React render (MutationObserver) ─────────────────────────── */
  function waitForReact(data, attempts) {
    // If anchor is already available, inject immediately
    if (findAnchor()) {
      inject(data);
      return;
    }

    if (attempts >= MAX_RETRIES) {
      console.warn('[Models Pulse] Could not find injection point after', MAX_RETRIES, 'attempts');
      return;
    }

    // Use MutationObserver to wait for React to render content
    const root = document.getElementById('root') || document.body;
    const observer = new MutationObserver((mutations, obs) => {
      if (findAnchor()) {
        obs.disconnect();
        inject(data);
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    // Also use a timeout fallback
    setTimeout(() => {
      observer.disconnect();
      if (!document.getElementById(WIDGET_ID)) {
        waitForReact(data, attempts + 1);
      }
    }, RETRY_INTERVAL);
  }

  /* ─── Entry point ──────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndInject);
  } else {
    fetchAndInject();
  }

})();
