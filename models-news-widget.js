/**
 * Models News Widget (Новости моделей) — Standalone Injection Script
 * Injects a compact news feed of AI model updates into the first screen
 * of the dashboard, alongside the "Ключевые события" section.
 *
 * Data source: /data/models-feed.json
 * Target: Section containing "Ключевые события" / "Key Events" heading
 *
 * ─── ROLLBACK ───────────────────────────────────────────────────────────────
 * Tag: pre-models-news-widget
 * To rollback:
 *   git reset --hard pre-models-news-widget && git push --force
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ─── Constants ────────────────────────────────────────────────────────── */
  const WIDGET_ID = 'models-news-widget';
  const DATA_URL = '/data/models-feed.json';
  const GUIDE_URL = '/llm-map/';
  const CHRONICLE_URL = '/llm-map/#chronicle';
  const MAX_ITEMS = 5;

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

  /* ─── Date formatting ──────────────────────────────────────────────────── */
  function formatDate(dateStr) {
    const months_ru = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const months_en = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = isEnglish() ? months_en[d.getMonth()] : months_ru[d.getMonth()];
    return `${day} ${month}`;
  }

  /* ─── Impact dot ───────────────────────────────────────────────────────── */
  function impactDot(impact) {
    switch (impact) {
      case 'major': return '<span class="mnw-impact mnw-impact-major" title="Major">🔴</span>';
      case 'minor': return '<span class="mnw-impact mnw-impact-minor" title="Minor">🟡</span>';
      case 'patch': return '<span class="mnw-impact mnw-impact-patch" title="Patch">🟢</span>';
      default: return '<span class="mnw-impact mnw-impact-minor" title="Update">🟡</span>';
    }
  }

  /* ─── CSS ──────────────────────────────────────────────────────────────── */
  const CSS = `
    #${WIDGET_ID} {
      background: rgba(26, 27, 46, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 20px;
      font-family: 'IBM Plex Sans', sans-serif;
      color: #e2e8f0;
      min-width: 0;
      overflow: hidden;
    }

    .mnw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 8px;
      flex-wrap: wrap;
    }

    .mnw-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
      white-space: nowrap;
    }

    .mnw-guide-btn {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      background: rgba(0, 212, 255, 0.12);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 20px;
      color: #00d4ff;
      font-size: 12px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .mnw-guide-btn:hover {
      background: rgba(0, 212, 255, 0.2);
      border-color: rgba(0, 212, 255, 0.5);
      color: #00d4ff;
      text-decoration: none;
    }

    .mnw-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .mnw-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: start;
      padding: 10px 8px;
      border-radius: 8px;
      transition: background 0.15s ease;
      cursor: default;
    }

    .mnw-item:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .mnw-item + .mnw-item {
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .mnw-date {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      white-space: nowrap;
      padding-top: 2px;
    }

    .mnw-content {
      min-width: 0;
    }

    .mnw-model {
      font-weight: 600;
      font-size: 13px;
      color: #ffffff;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mnw-event {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .mnw-impact {
      font-size: 10px;
      padding-top: 3px;
    }

    .mnw-footer {
      margin-top: 14px;
      text-align: center;
    }

    .mnw-footer a {
      color: #00d4ff;
      font-size: 12px;
      font-weight: 500;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }

    .mnw-footer a:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    .mnw-error {
      text-align: center;
      color: rgba(255, 255, 255, 0.35);
      font-size: 12px;
      padding: 20px 10px;
    }

    /* ─── Three-column layout for first screen ─────────────────────────── */
    .mnw-three-col-layout {
      display: grid;
      grid-template-columns: 4fr 3fr 3fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .mnw-three-col-layout {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 768px) {
      .mnw-three-col-layout {
        grid-template-columns: 1fr;
      }
    }
  `;

  /* ─── Build widget HTML ────────────────────────────────────────────────── */
  function buildWidget(events) {
    const items = events.slice(0, MAX_ITEMS);
    let html = `<div id="${WIDGET_ID}">`;
    html += `<div class="mnw-header">`;
    html += `<h4 class="mnw-title">⚡ ${t('Новости моделей', 'Models News')}</h4>`;
    html += `<a href="${GUIDE_URL}" class="mnw-guide-btn">${t('Гайд по моделям →', 'Models Guide →')}</a>`;
    html += `</div>`;

    if (!items.length) {
      html += `<div class="mnw-error">${t('Нет данных', 'No data available')}</div>`;
    } else {
      html += `<ul class="mnw-list">`;
      for (const item of items) {
        html += `<li class="mnw-item">`;
        html += `<span class="mnw-date">${formatDate(item.date)}</span>`;
        html += `<div class="mnw-content">`;
        html += `<div class="mnw-model">${escapeHtml(item.model)}</div>`;
        html += `<div class="mnw-event">${escapeHtml(item.event)}</div>`;
        html += `</div>`;
        html += impactDot(item.impact);
        html += `</li>`;
      }
      html += `</ul>`;
    }

    html += `<div class="mnw-footer">`;
    html += `<a href="${CHRONICLE_URL}">${t('Все обновления →', 'All updates →')}</a>`;
    html += `</div>`;
    html += `</div>`;
    return html;
  }

  /* ─── Escape HTML ──────────────────────────────────────────────────────── */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /* ─── Inject styles ────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('models-news-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'models-news-widget-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ─── Find target section ──────────────────────────────────────────────── */
  function findKeyEventsSection() {
    // Look for the heading that contains "Ключевые события" or "Key Events"
    const headings = document.querySelectorAll('h2, h3, h4, [class*="heading"], [class*="title"]');
    for (const h of headings) {
      const text = h.textContent.trim();
      if (text.includes('Ключевые события') || text.includes('Key Events')) {
        // Walk up to find the section/card container
        let el = h;
        let attempts = 0;
        while (el && attempts < 10) {
          if (el.className && typeof el.className === 'string' &&
              (el.className.includes('rounded-xl') || el.className.includes('rounded-2xl'))) {
            return el;
          }
          if (el.getAttribute && el.getAttribute('class') &&
              (el.getAttribute('class').includes('rounded-xl') || el.getAttribute('class').includes('rounded-2xl'))) {
            return el;
          }
          el = el.parentElement;
          attempts++;
        }
        // Fallback: try to find a section-like parent
        el = h;
        attempts = 0;
        while (el && attempts < 10) {
          if (el.className && typeof el.className === 'string' &&
              (el.className.includes('rounded') || el.tagName === 'SECTION' || el.className.includes('card'))) {
            return el;
          }
          el = el.parentElement;
          attempts++;
        }
        // Last resort: return the heading's parent
        return h.parentElement;
      }
    }
    return null;
  }

  /* ─── Find the parent grid/flex container of the first screen ──────────── */
  function findFirstScreenContainer(keyEventsSection) {
    if (!keyEventsSection) return null;
    // Walk up to find the grid/flex container that holds the first-screen cards
    let el = keyEventsSection.parentElement;
    let attempts = 0;
    while (el && attempts < 8) {
      if (el.className && typeof el.className === 'string') {
        // Look for grid or flex container with multiple children
        const style = window.getComputedStyle(el);
        if ((style.display === 'grid' || style.display === 'flex') && el.children.length >= 2) {
          return el;
        }
        // Also check class-based patterns
        if (el.className.includes('grid') || el.className.includes('flex')) {
          return el;
        }
      }
      el = el.parentElement;
      attempts++;
    }
    // Fallback: return the direct parent of keyEventsSection
    return keyEventsSection.parentElement;
  }

  /* ─── Main injection ───────────────────────────────────────────────────── */
  async function inject() {
    // Only run on main page
    const path = window.location.pathname;
    if (path !== '/' && path !== '' && path !== '/index.html') return;

    // Don't inject twice
    if (document.getElementById(WIDGET_ID)) return;

    // Find target section
    const keyEventsSection = findKeyEventsSection();
    if (!keyEventsSection) return;

    // Fetch data
    const feedData = await fetchJSON(DATA_URL);
    const events = feedData && feedData.events ? feedData.events : [];

    // Inject styles
    injectStyles();

    // Strategy: Find the container that holds the first-screen sections,
    // then restructure into a three-column layout
    const parentContainer = findFirstScreenContainer(keyEventsSection);

    if (parentContainer) {
      // Check if we already restructured
      if (parentContainer.querySelector('.mnw-three-col-layout')) return;

      // Find the SRT Places widget container (Радар изменений section)
      let srtSection = document.getElementById('srt-places-widget');
      if (srtSection) {
        // Walk up to find its card container at the same level as keyEventsSection
        let el = srtSection;
        let attempts = 0;
        while (el && el !== parentContainer && attempts < 10) {
          if (el.parentElement === parentContainer || el.parentElement === keyEventsSection.parentElement) {
            srtSection = el;
            break;
          }
          el = el.parentElement;
          attempts++;
        }
      }

      // Create three-column wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'mnw-three-col-layout';

      // Column 1: Key Events (existing content)
      const col1 = document.createElement('div');
      col1.style.minWidth = '0';

      // Move keyEventsSection into col1
      const keyEventsClone = keyEventsSection.cloneNode(true);
      col1.appendChild(keyEventsClone);
      wrapper.appendChild(col1);

      // Column 2: SRT Places widget placeholder
      const col2 = document.createElement('div');
      col2.style.minWidth = '0';
      col2.id = 'mnw-srt-column';

      if (srtSection && srtSection !== keyEventsSection) {
        const srtClone = srtSection.cloneNode(true);
        col2.appendChild(srtClone);
      } else {
        // The SRT widget may not have injected yet — leave a placeholder
        // It will inject into the "Радар изменений" section when ready
        // We look for the Radar section instead
        const radarHeadings = document.querySelectorAll('h3, h4');
        let radarSection = null;
        for (const h of radarHeadings) {
          const text = h.textContent.trim();
          if (text.includes('Радар изменений') || text.includes('Change Radar')) {
            let el = h;
            let attempts = 0;
            while (el && attempts < 10) {
              if (el.parentElement === parentContainer) {
                radarSection = el;
                break;
              }
              if (el.className && typeof el.className === 'string' &&
                  (el.className.includes('rounded-xl') || el.className.includes('rounded'))) {
                radarSection = el;
                break;
              }
              el = el.parentElement;
              attempts++;
            }
            break;
          }
        }
        if (radarSection && radarSection !== keyEventsSection) {
          col2.appendChild(radarSection.cloneNode(true));
        }
      }
      wrapper.appendChild(col2);

      // Column 3: Models News widget
      const col3 = document.createElement('div');
      col3.style.minWidth = '0';
      col3.innerHTML = buildWidget(events);
      wrapper.appendChild(col3);

      // Replace the original section with the three-column layout
      // Insert the wrapper after keyEventsSection, then hide originals
      keyEventsSection.parentElement.insertBefore(wrapper, keyEventsSection);
      keyEventsSection.style.display = 'none';

      // Hide the original SRT/Radar section if it exists as a sibling
      if (srtSection && srtSection.parentElement === parentContainer && srtSection !== keyEventsSection) {
        srtSection.style.display = 'none';
      }

    } else {
      // Fallback: just append the widget after the key events section
      const widgetContainer = document.createElement('div');
      widgetContainer.innerHTML = buildWidget(events);
      keyEventsSection.parentElement.insertBefore(widgetContainer.firstElementChild, keyEventsSection.nextSibling);
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
