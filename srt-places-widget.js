/**
 * SRT Places Widget (Карта мест СРТ) — Standalone Injection Script
 * Injects a compact bubble chart + changelog feed into the main dashboard page,
 * replacing the "Радар изменений" / "Change Radar" section.
 *
 * Dependencies: Plotly.js (loaded dynamically from CDN)
 * Data source: /data/places_data.json
 * Optional: /data/places_changelog.json
 */
(function () {
  'use strict';

  /* ─── Constants ────────────────────────────────────────────────────────── */
  const WIDGET_ID = 'srt-places-widget';
  const DATA_URL = '/data/places_data.json';
  const CHANGELOG_URL = '/data/places_changelog.json';
  const PLACES_PAGE_URL = '/places.html';

  const SRT_LEVELS = {
    1: 'Природные ресурсы',
    2: 'Пространственная организация',
    3: 'Социально-профессиональная структура',
    4: '«Железные» технологии',
    5: 'Разделение труда между фирмами',
    6: 'Технологии производства знаний',
    7: 'Институты производства знаний',
    8: 'Спонтанный порядок',
    9: 'Денежная система'
  };

  const LEVEL_COLORS = {
    1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e',
    6: '#06b6d4', 7: '#3b82f6', 8: '#8b5cf6', 9: '#ec4899'
  };

  const WINDOW_COLORS = { open: '#34d399', narrowing: '#fbbf24', closing: '#ef4444' };
  const WINDOW_RU = { open: 'Открыто', narrowing: 'Сужается', closing: 'Закрывается' };
  const WINDOW_EN = { open: 'Open', narrowing: 'Narrowing', closing: 'Closing' };
  const CAPACITY_RU = { large: 'Крупная', medium: 'Средняя', small: 'Малая' };
  const CONF_RU = { high: 'Высокая', medium: 'Средняя', low: 'Низкая' };

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

  /* ─── Plotly loader ────────────────────────────────────────────────────── */
  function loadPlotly() {
    return new Promise((resolve) => {
      if (window.Plotly) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-2.32.0.min.js';
      script.onload = resolve;
      script.onerror = resolve; // graceful degradation
      document.head.appendChild(script);
    });
  }

  /* ─── Data fetching ────────────────────────────────────────────────────── */
  async function fetchJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  /* ─── CSS ──────────────────────────────────────────────────────────────── */
  const CSS = `
    #${WIDGET_ID} {
      position: relative;
      width: 100%;
    }
    #${WIDGET_ID} .spw-inner {
      background: rgba(15, 19, 32, 0.40);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.75rem;
      padding: 1.25rem;
      overflow: hidden;
    }

    /* Header */
    #${WIDGET_ID} .spw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    #${WIDGET_ID} .spw-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    #${WIDGET_ID} .spw-eyebrow {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    #${WIDGET_ID} .spw-eyebrow-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #06b6d4;
      animation: spw-pulse 2s ease-in-out infinite;
    }
    @keyframes spw-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    #${WIDGET_ID} .spw-eyebrow-text {
      font-size: 0.625rem;
      font-family: 'IBM Plex Mono', monospace;
      color: rgba(6, 182, 212, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    #${WIDGET_ID} .spw-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--foreground, #f0f2f5);
      margin: 0.25rem 0 0 0;
      line-height: 1.3;
    }

    /* Metrics row */
    #${WIDGET_ID} .spw-metrics {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    #${WIDGET_ID} .spw-metric {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 0.5rem;
      font-size: 0.7rem;
      color: #9ca3af;
    }
    #${WIDGET_ID} .spw-metric .spw-val {
      color: #f0f2f5;
      font-weight: 600;
      font-family: 'Space Grotesk', sans-serif;
    }

    /* Chart container */
    #${WIDGET_ID} .spw-chart {
      width: 100%;
      height: 300px;
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }
    #${WIDGET_ID} .spw-chart-placeholder {
      width: 100%;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 19, 32, 0.6);
      border-radius: 0.5rem;
      color: #6b7280;
      font-size: 0.8rem;
    }

    /* Changelog feed */
    #${WIDGET_ID} .spw-feed {
      margin-bottom: 0.75rem;
    }
    #${WIDGET_ID} .spw-feed-title {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    #${WIDGET_ID} .spw-feed-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.375rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.75rem;
      color: #c8cdd5;
      line-height: 1.4;
    }
    #${WIDGET_ID} .spw-feed-item:last-child {
      border-bottom: none;
    }
    #${WIDGET_ID} .spw-feed-icon {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.625rem;
    }
    #${WIDGET_ID} .spw-feed-icon--new {
      background: rgba(52, 211, 153, 0.15);
      color: #34d399;
    }
    #${WIDGET_ID} .spw-feed-icon--narrowing {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
    }
    #${WIDGET_ID} .spw-feed-icon--closing {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    #${WIDGET_ID} .spw-feed-icon--signal {
      background: rgba(6, 182, 212, 0.15);
      color: #06b6d4;
    }

    /* Signal of month */
    #${WIDGET_ID} .spw-signal {
      padding: 0.625rem 0.75rem;
      background: rgba(6, 182, 212, 0.06);
      border: 1px solid rgba(6, 182, 212, 0.15);
      border-radius: 0.5rem;
      margin-bottom: 0.75rem;
    }
    #${WIDGET_ID} .spw-signal-label {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #06b6d4;
      margin-bottom: 0.25rem;
    }
    #${WIDGET_ID} .spw-signal-text {
      font-size: 0.75rem;
      color: #c8cdd5;
      line-height: 1.5;
    }

    /* CTA button */
    #${WIDGET_ID} .spw-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      background: rgba(6, 182, 212, 0.1);
      border: 1px solid rgba(6, 182, 212, 0.25);
      border-radius: 0.5rem;
      color: #06b6d4;
      font-size: 0.8rem;
      font-weight: 500;
      font-family: 'Space Grotesk', sans-serif;
      text-decoration: none;
      transition: background 0.2s, border-color 0.2s;
      cursor: pointer;
    }
    #${WIDGET_ID} .spw-cta:hover {
      background: rgba(6, 182, 212, 0.18);
      border-color: rgba(6, 182, 212, 0.4);
    }

    /* Legend */
    #${WIDGET_ID} .spw-legend {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
      font-size: 0.65rem;
      color: #6b7280;
    }
    #${WIDGET_ID} .spw-legend-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    #${WIDGET_ID} .spw-legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid;
    }
  `;

  /* ─── HTML builder ─────────────────────────────────────────────────────── */
  function buildWidget(data, changelog) {
    const meta = data.meta;
    const places = data.places;

    const totalPlaces = meta.total_places;
    const openWindow = meta.places_by_window.open || 0;
    const largePlaces = meta.places_by_capacity.large || 0;
    const turbulence = meta.turbulence_index || 0;

    // Metrics row
    const metricsHTML = `
      <div class="spw-metrics">
        <div class="spw-metric">
          <span>${t('Всего мест', 'Total places')}:</span>
          <span class="spw-val">${totalPlaces}</span>
        </div>
        <div class="spw-metric">
          <span>${t('Окно открыто', 'Window open')}:</span>
          <span class="spw-val" style="color:#34d399">${openWindow}</span>
        </div>
        <div class="spw-metric">
          <span>${t('Крупные', 'Large')} (&gt;$1B):</span>
          <span class="spw-val">${largePlaces}</span>
        </div>
        <div class="spw-metric">
          <span>${t('Турбулентность', 'Turbulence')}:</span>
          <span class="spw-val" style="color:${turbulence > 15 ? '#ef4444' : turbulence > 10 ? '#fbbf24' : '#34d399'}">${turbulence.toFixed(1)}</span>
        </div>
      </div>`;

    // Legend
    const legendHTML = `
      <div class="spw-legend">
        <div class="spw-legend-item">
          <div class="spw-legend-dot" style="background:transparent;border-color:#34d399"></div>
          <span>${t('Открыто', 'Open')}</span>
        </div>
        <div class="spw-legend-item">
          <div class="spw-legend-dot" style="background:transparent;border-color:#fbbf24"></div>
          <span>${t('Сужается', 'Narrowing')}</span>
        </div>
        <div class="spw-legend-item">
          <div class="spw-legend-dot" style="background:transparent;border-color:#ef4444"></div>
          <span>${t('Закрывается', 'Closing')}</span>
        </div>
        <div class="spw-legend-item" style="margin-left:0.5rem">
          <span style="font-size:0.6rem">⬤</span>
          <span>${t('Размер = уверенность', 'Size = confidence')}</span>
        </div>
      </div>`;

    // Feed section
    let feedHTML = '';
    if (changelog && changelog.changes && changelog.changes.length > 0) {
      const items = changelog.changes.slice(0, 5).map(ch => {
        let iconClass = 'spw-feed-icon--signal';
        let icon = '◆';
        if (ch.type === 'new') { iconClass = 'spw-feed-icon--new'; icon = '+'; }
        else if (ch.type === 'narrowing') { iconClass = 'spw-feed-icon--narrowing'; icon = '↘'; }
        else if (ch.type === 'closing' || ch.type === 'closed') { iconClass = 'spw-feed-icon--closing'; icon = '✕'; }
        return `
          <div class="spw-feed-item">
            <div class="spw-feed-icon ${iconClass}">${icon}</div>
            <span>${ch.text || ch.description || ''}</span>
          </div>`;
      }).join('');
      feedHTML = `
        <div class="spw-feed">
          <div class="spw-feed-title">${t('Лента изменений', 'Changelog')}</div>
          ${items}
        </div>`;
    } else if (meta.signal_of_month) {
      feedHTML = `
        <div class="spw-signal">
          <div class="spw-signal-label">${t('Сигнал месяца', 'Signal of the Month')}</div>
          <div class="spw-signal-text">${meta.signal_of_month}</div>
        </div>`;
    }

    return `
      <div id="${WIDGET_ID}">
        <div class="spw-inner">
          <div class="spw-header">
            <div class="spw-title-row">
              <div>
                <div class="spw-eyebrow">
                  <div class="spw-eyebrow-dot"></div>
                  <span class="spw-eyebrow-text">SRT Places · ${meta.period ? meta.period.label : ''}</span>
                </div>
                <h3 class="spw-title">${t('Карта мест СРТ', 'SRT Places Map')}</h3>
              </div>
            </div>
          </div>
          ${metricsHTML}
          ${legendHTML}
          <div class="spw-chart" id="spw-bubble-chart">
            <div class="spw-chart-placeholder">${t('Загрузка графика...', 'Loading chart...')}</div>
          </div>
          ${feedHTML}
          <a class="spw-cta" href="${PLACES_PAGE_URL}">
            ${t('Открыть полную карту', 'Open full map')} →
          </a>
        </div>
      </div>`;
  }

  /* ─── Plotly chart rendering ───────────────────────────────────────────── */
  function renderChart(places) {
    const chartEl = document.getElementById('spw-bubble-chart');
    if (!chartEl || !window.Plotly) return;

    const capMap = { large: 3, medium: 2, small: 1 };
    const confSize = { high: 22, medium: 14, low: 8 };

    // Group by window category
    const groups = { open: [], narrowing: [], closing: [] };
    places.forEach(p => {
      const wc = p.window.category;
      if (groups[wc]) groups[wc].push(p);
    });

    const windowLabels = isEnglish() ? WINDOW_EN : WINDOW_RU;

    const traces = Object.entries(groups).map(([wc, items]) => ({
      x: items.map(p => p.srt_level + (Math.random() - 0.5) * 0.3),
      y: items.map(p => capMap[p.capacity.category] + (Math.random() - 0.5) * 0.2),
      text: items.map(p =>
        `<b>${p.name}</b><br>` +
        `${t('Уровень', 'Level')} ${p.srt_level}: ${SRT_LEVELS[p.srt_level]}<br>` +
        `${t('Ёмкость', 'Capacity')}: ${CAPACITY_RU[p.capacity.category]} (${p.capacity.range_label})<br>` +
        `${t('Окно', 'Window')}: ${windowLabels[p.window.category]}<br>` +
        `${t('Уверенность', 'Confidence')}: ${CONF_RU[p.confidence]}`
      ),
      customdata: items.map(p => p.id),
      mode: 'markers',
      marker: {
        size: items.map(p => confSize[p.confidence]),
        color: items.map(p => LEVEL_COLORS[p.srt_level]),
        opacity: 0.8,
        line: { width: 2, color: WINDOW_COLORS[wc] },
      },
      name: windowLabels[wc],
      hovertemplate: '%{text}<extra></extra>',
      type: 'scatter',
    }));

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 19, 32, 0.6)',
      font: { family: 'Inter, IBM Plex Sans, sans-serif', color: '#9ca3af', size: 11 },
      margin: { t: 20, r: 15, b: 50, l: 55 },
      xaxis: {
        title: { text: t('Уровень СРТ', 'SRT Level'), font: { size: 11, color: '#6b7280' } },
        tickmode: 'array',
        tickvals: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        ticktext: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        gridcolor: 'rgba(255,255,255,0.04)',
        zeroline: false,
        range: [0.3, 9.7],
      },
      yaxis: {
        title: { text: t('Ёмкость', 'Capacity'), font: { size: 11, color: '#6b7280' } },
        tickmode: 'array',
        tickvals: [1, 2, 3],
        ticktext: ['< $100M', '$100M–$1B', '> $1B'],
        gridcolor: 'rgba(255,255,255,0.04)',
        zeroline: false,
        range: [0.4, 3.6],
      },
      legend: {
        x: 0, y: 1.15,
        orientation: 'h',
        font: { size: 10 },
        bgcolor: 'transparent',
      },
      hoverlabel: {
        bgcolor: '#1a1f2e',
        bordercolor: 'rgba(255,255,255,0.1)',
        font: { family: 'Inter, sans-serif', size: 11, color: '#e5e7eb' },
      },
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot('spw-bubble-chart', traces, layout, config);

    // Click handler — navigate to places page
    chartEl.on('plotly_click', function () {
      window.location.href = PLACES_PAGE_URL;
    });
  }

  /* ─── Inject styles ────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('srt-places-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'srt-places-widget-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ─── Find target section ──────────────────────────────────────────────── */
  function findRadarSection() {
    const headings = document.querySelectorAll('h3');
    for (const h of headings) {
      const text = h.textContent.trim();
      if (text.includes('Радар изменений') || text.includes('Change Radar')) {
        // Walk up to find the rounded-xl container
        let el = h;
        let attempts = 0;
        while (el && attempts < 10) {
          if (el.className && typeof el.className === 'string' && el.className.includes('rounded-xl')) {
            return el;
          }
          // Also check for [class*="rounded-xl"] pattern
          if (el.getAttribute && el.getAttribute('class') && el.getAttribute('class').includes('rounded-xl')) {
            return el;
          }
          el = el.parentElement;
          attempts++;
        }
        // Fallback: try closest with any rounded class
        el = h;
        attempts = 0;
        while (el && attempts < 10) {
          if (el.className && typeof el.className === 'string' &&
              (el.className.includes('rounded') || el.tagName === 'SECTION')) {
            return el;
          }
          el = el.parentElement;
          attempts++;
        }
        // Last resort: return parent container
        return h.parentElement;
      }
    }
    return null;
  }

  /* ─── Main injection ───────────────────────────────────────────────────── */
  async function inject() {
    // Only run on main page
    const path = window.location.pathname;
    if (path !== '/' && path !== '' && path !== '/index.html') return;

    // Don't inject twice
    if (document.getElementById(WIDGET_ID)) return;

    // Find target
    const target = findRadarSection();
    if (!target) return;

    // Fetch data
    const data = await fetchJSON(DATA_URL);
    if (!data || !data.places) return;

    // Fetch changelog (optional)
    const changelog = await fetchJSON(CHANGELOG_URL);

    // Inject styles
    injectStyles();

    // Build and inject widget HTML
    const html = buildWidget(data, changelog);
    target.innerHTML = html;

    // Load Plotly and render chart
    await loadPlotly();
    if (window.Plotly) {
      renderChart(data.places);
    } else {
      // If Plotly failed to load, show fallback
      const chartEl = document.getElementById('spw-bubble-chart');
      if (chartEl) {
        chartEl.innerHTML = `<div class="spw-chart-placeholder">${t(
          'Не удалось загрузить график. Откройте полную карту.',
          'Failed to load chart. Open the full map.'
        )}</div>`;
      }
    }
  }

  /* ─── Observer: wait for React to render ───────────────────────────────── */
  function waitAndInject() {
    // Only run on main page
    const path = window.location.pathname;
    if (path !== '/' && path !== '' && path !== '/index.html') return;

    // Try immediately
    inject();
    if (document.getElementById(WIDGET_ID)) return;

    // Use MutationObserver to detect when React renders the section
    let attempts = 0;
    const observer = new MutationObserver(() => {
      attempts++;
      if (document.getElementById(WIDGET_ID)) {
        observer.disconnect();
        return;
      }
      inject();
      if (document.getElementById(WIDGET_ID) || attempts > 200) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Timeout safety: disconnect after 30s
    setTimeout(() => observer.disconnect(), 30000);
  }

  /* ─── SPA navigation support ───────────────────────────────────────────── */
  function setupSPASupport() {
    // Override history.pushState to detect SPA navigation
    const originalPushState = history.pushState.bind(history);
    history.pushState = function (...args) {
      originalPushState(...args);
      setTimeout(waitAndInject, 300);
    };

    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = function (...args) {
      originalReplaceState(...args);
      setTimeout(waitAndInject, 300);
    };

    window.addEventListener('popstate', () => setTimeout(waitAndInject, 300));
  }

  /* ─── Bootstrap ────────────────────────────────────────────────────────── */
  function bootstrap() {
    setupSPASupport();
    waitAndInject();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
