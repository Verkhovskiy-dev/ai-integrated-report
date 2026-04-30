/**
 * AI Ladder (Лестница ИИ) — Standalone Injection Script
 * Injects the visual AI Ladder section into the /education page
 * before the SKOLKOVO competitive comparison section.
 */
(function () {
  'use strict';

  /* ─── Data ─────────────────────────────────────────────────────────────── */
  const LADDER_DATA = [
    {
      level: 1,
      code: 'L1',
      title: 'Пользователь ИИ-инструментов',
      goal: 'Кратный рост личной эффективности',
      accentColor: '#38bdf8',      // sky-400
      bgGradient: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 100%)',
      borderColor: 'rgba(56,189,248,0.30)',
      badgeBg: 'rgba(56,189,248,0.15)',
      focus: [
        'Освоение ИИ в своей роли',
        'Понимание ИИ-технологий и сфер применения',
        'Внедрение ИИ в ежедневные задачи',
        'Экономия 5–10 часов в неделю',
      ],
      programs: [
        { name: 'Интенсив по генеративным алгоритмам и ИИ', meta: '2 дня · 102 000 ₽', status: 'active' },
        { name: 'ИИ в маркетинге', meta: '2 дня · 150 000 ₽', status: 'active' },
        { name: 'ИИ-агенты для бизнеса', meta: '3 дня · 200 000–330 000 ₽', status: 'active' },
        { name: 'Онлайн-интенсив по разработке ИИ-продуктов', meta: '6 недель · 100 000 ₽', status: 'active' },
      ],
    },
    {
      level: 2,
      code: 'L2',
      title: 'Руководитель внедрения ИИ',
      goal: 'Трансформация бизнес-процессов',
      accentColor: '#34d399',      // emerald-400
      bgGradient: 'linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.04) 100%)',
      borderColor: 'rgba(52,211,153,0.30)',
      badgeBg: 'rgba(52,211,153,0.15)',
      focus: [
        'ИИ в подразделении и Data Driven подход',
        'Методологии внедрения ИИ и архитектура данных',
        'Построение data-driven системы управления',
        'Оптимизация процессов на 20–40%',
      ],
      programs: [
        { name: 'Переход в ИИ: трансформация', meta: '4 мес · от 1 450 000 ₽', status: 'active' },
      ],
    },
    {
      level: 3,
      code: 'L3',
      title: 'Директор по ИИ (CAIO)',
      goal: 'Стратегическое лидерство и ИИ-трансформация',
      accentColor: '#f59e0b',      // amber-400
      bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)',
      borderColor: 'rgba(245,158,11,0.30)',
      badgeBg: 'rgba(245,158,11,0.15)',
      focus: [
        'ИИ-стратегия и руководство всей компанией',
        'Полный стек технологий ИИ-трансформации бизнеса',
        'Построение и развитие ИИ-команд',
        'Зарплата 500K–1.5M+ ₽/мес или собственный ИИ-бизнес',
      ],
      programs: [],
      comingSoon: true,
    },
  ];

  /* ─── CSS ───────────────────────────────────────────────────────────────── */
  const CSS = `
    #ai-ladder-section {
      padding: 2.5rem 0;
      position: relative;
    }
    #ai-ladder-section .al-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    @media (min-width: 640px) {
      #ai-ladder-section .al-container { padding: 0 1.5rem; }
    }

    /* ── Section header ── */
    #ai-ladder-section .al-header {
      margin-bottom: 2rem;
    }
    #ai-ladder-section .al-eyebrow {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    #ai-ladder-section .al-eyebrow-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--primary, oklch(78% .15 200));
    }
    #ai-ladder-section .al-eyebrow-text {
      font-size: 0.625rem;
      font-family: 'IBM Plex Mono', monospace;
      color: oklch(78% .15 200 / 0.7);
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }
    #ai-ladder-section .al-title {
      font-size: 1.5rem;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      color: var(--foreground, oklch(92% .01 260));
      margin: 0 0 0.375rem 0;
      line-height: 1.2;
    }
    @media (min-width: 640px) {
      #ai-ladder-section .al-title { font-size: 1.875rem; }
    }
    #ai-ladder-section .al-subtitle {
      font-size: 0.875rem;
      color: var(--muted-foreground, oklch(60% .02 260));
      margin: 0;
      line-height: 1.6;
    }

    /* ── Staircase wrapper ── */
    #ai-ladder-section .al-staircase {
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
    }

    /* ── Step connector line ── */
    #ai-ladder-section .al-staircase::before {
      content: '';
      position: absolute;
      left: 1.75rem;
      top: 2.5rem;
      bottom: 2.5rem;
      width: 2px;
      background: linear-gradient(
        to bottom,
        rgba(56,189,248,0.4) 0%,
        rgba(52,211,153,0.4) 50%,
        rgba(245,158,11,0.4) 100%
      );
      z-index: 0;
    }
    @media (min-width: 768px) {
      #ai-ladder-section .al-staircase::before {
        left: 50%;
        transform: translateX(-50%);
      }
    }

    /* ── Individual step ── */
    #ai-ladder-section .al-step {
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
      z-index: 1;
      margin-bottom: 1.25rem;
    }
    @media (min-width: 768px) {
      #ai-ladder-section .al-step {
        flex-direction: row;
        align-items: stretch;
        margin-bottom: 0;
      }
      /* Odd steps: level badge left, content right */
      #ai-ladder-section .al-step:nth-child(odd) {
        flex-direction: row;
      }
      /* Even steps: content left, level badge right */
      #ai-ladder-section .al-step:nth-child(even) {
        flex-direction: row-reverse;
      }
    }

    /* ── Level badge (the stair block) ── */
    #ai-ladder-section .al-badge-col {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    @media (min-width: 768px) {
      #ai-ladder-section .al-badge-col {
        width: 50%;
        padding: 1.5rem 2rem;
        justify-content: center;
      }
      #ai-ladder-section .al-step:nth-child(odd) .al-badge-col {
        justify-content: flex-end;
        padding-right: 3rem;
      }
      #ai-ladder-section .al-step:nth-child(even) .al-badge-col {
        justify-content: flex-start;
        padding-left: 3rem;
      }
    }

    #ai-ladder-section .al-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 5rem;
      height: 5rem;
      border-radius: 1.25rem;
      border: 2px solid;
      position: relative;
      flex-shrink: 0;
      margin: 0.75rem 0 0.75rem 0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      transition: transform 0.2s ease;
    }
    #ai-ladder-section .al-badge:hover {
      transform: scale(1.05);
    }
    @media (min-width: 768px) {
      #ai-ladder-section .al-badge {
        width: 7rem;
        height: 7rem;
        border-radius: 1.5rem;
        margin: 0;
      }
    }
    #ai-ladder-section .al-badge-code {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1.5rem;
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    @media (min-width: 768px) {
      #ai-ladder-section .al-badge-code { font-size: 2rem; }
    }
    #ai-ladder-section .al-badge-num {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.625rem;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ── Content card ── */
    #ai-ladder-section .al-content-col {
      flex: 1;
      display: flex;
      align-items: stretch;
      padding: 0 0 0 1rem;
    }
    @media (min-width: 768px) {
      #ai-ladder-section .al-content-col {
        width: 50%;
        padding: 1rem 1.5rem;
      }
      #ai-ladder-section .al-step:nth-child(even) .al-content-col {
        padding: 1rem 1.5rem;
      }
    }

    #ai-ladder-section .al-card {
      width: 100%;
      border-radius: 1rem;
      border: 1px solid;
      padding: 1.25rem;
      backdrop-filter: blur(8px);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    #ai-ladder-section .al-card:hover {
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    }
    @media (min-width: 640px) {
      #ai-ladder-section .al-card { padding: 1.5rem; }
    }

    #ai-ladder-section .al-card-header {
      margin-bottom: 1rem;
    }
    #ai-ladder-section .al-card-level-label {
      font-size: 0.625rem;
      font-family: 'IBM Plex Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      opacity: 0.7;
      margin-bottom: 0.25rem;
    }
    #ai-ladder-section .al-card-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      color: var(--foreground, oklch(92% .01 260));
      margin: 0 0 0.5rem 0;
      line-height: 1.3;
    }
    @media (min-width: 640px) {
      #ai-ladder-section .al-card-title { font-size: 1.125rem; }
    }
    #ai-ladder-section .al-card-goal {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      border: 1px solid;
    }
    #ai-ladder-section .al-card-goal-icon {
      font-size: 0.875rem;
    }

    /* ── Focus list ── */
    #ai-ladder-section .al-focus-label {
      font-size: 0.625rem;
      font-family: 'IBM Plex Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted-foreground, oklch(60% .02 260));
      margin: 1rem 0 0.5rem 0;
    }
    #ai-ladder-section .al-focus-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    #ai-ladder-section .al-focus-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--foreground, oklch(92% .01 260));
      opacity: 0.85;
      line-height: 1.5;
    }
    #ai-ladder-section .al-focus-bullet {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 0.4rem;
    }

    /* ── Programs list ── */
    #ai-ladder-section .al-programs-label {
      font-size: 0.625rem;
      font-family: 'IBM Plex Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted-foreground, oklch(60% .02 260));
      margin: 1rem 0 0.5rem 0;
    }
    #ai-ladder-section .al-programs-list {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    #ai-ladder-section .al-program-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
    }
    #ai-ladder-section .al-program-name {
      font-size: 0.75rem;
      font-family: 'IBM Plex Sans', sans-serif;
      font-weight: 500;
      color: var(--foreground, oklch(92% .01 260));
      line-height: 1.4;
      flex: 1;
    }
    #ai-ladder-section .al-program-meta {
      font-size: 0.6875rem;
      font-family: 'IBM Plex Mono', monospace;
      color: var(--muted-foreground, oklch(60% .02 260));
      white-space: nowrap;
      flex-shrink: 0;
    }
    #ai-ladder-section .al-coming-soon {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      border-radius: 0.5rem;
      border: 1px dashed;
      font-size: 0.75rem;
      font-family: 'IBM Plex Mono', monospace;
      opacity: 0.6;
    }

    /* ── Step connector arrow (desktop) ── */
    #ai-ladder-section .al-step-connector {
      display: none;
    }
    @media (min-width: 768px) {
      #ai-ladder-section .al-step-connector {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 2rem;
        position: relative;
        z-index: 2;
      }
      #ai-ladder-section .al-step-connector svg {
        opacity: 0.4;
      }
    }

    /* ── Staircase visual indicator (desktop) ── */
    @media (min-width: 768px) {
      #ai-ladder-section .al-staircase::before {
        display: none;
      }
    }

    /* ── Bottom CTA ── */
    #ai-ladder-section .al-cta {
      margin-top: 2rem;
      text-align: center;
      padding: 1.5rem;
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
    }
    #ai-ladder-section .al-cta-text {
      font-size: 0.875rem;
      color: var(--muted-foreground, oklch(60% .02 260));
      margin: 0;
      font-family: 'IBM Plex Sans', sans-serif;
    }
    #ai-ladder-section .al-cta-text strong {
      color: var(--foreground, oklch(92% .01 260));
    }
  `;

  /* ─── HTML builder ──────────────────────────────────────────────────────── */
  function buildLadderHTML() {
    const stepsHTML = LADDER_DATA.map((step, idx) => {
      const isLast = idx === LADDER_DATA.length - 1;

      // Focus items
      const focusItems = step.focus
        .map(f => `
          <li class="al-focus-item">
            <span class="al-focus-bullet" style="background:${step.accentColor}"></span>
            <span>${f}</span>
          </li>`)
        .join('');

      // Programs
      let programsHTML = '';
      if (step.comingSoon) {
        programsHTML = `
          <p class="al-programs-label">Твои инструменты (Программы)</p>
          <div class="al-programs-list">
            <div class="al-coming-soon" style="border-color:${step.accentColor};color:${step.accentColor}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              В разработке — скоро
            </div>
          </div>`;
      } else if (step.programs.length > 0) {
        const items = step.programs
          .map(p => `
            <div class="al-program-item">
              <span class="al-program-name">${p.name}</span>
              <span class="al-program-meta">${p.meta}</span>
            </div>`)
          .join('');
        programsHTML = `
          <p class="al-programs-label">Твои инструменты (Программы)</p>
          <div class="al-programs-list">${items}</div>`;
      }

      const connectorHTML = !isLast ? `
        <div class="al-step-connector">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${step.accentColor}" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>` : '';

      return `
        <div class="al-step">
          <div class="al-badge-col">
            <div class="al-badge"
                 style="background:${step.bgGradient};border-color:${step.borderColor};">
              <span class="al-badge-code" style="color:${step.accentColor}">${step.code}</span>
              <span class="al-badge-num" style="color:${step.accentColor}">Уровень ${step.level}</span>
            </div>
          </div>
          <div class="al-content-col">
            <div class="al-card" style="background:${step.bgGradient};border-color:${step.borderColor};">
              <div class="al-card-header">
                <p class="al-card-level-label" style="color:${step.accentColor}">Уровень ${step.level}</p>
                <h4 class="al-card-title">${step.title}</h4>
                <span class="al-card-goal"
                      style="color:${step.accentColor};border-color:${step.borderColor};background:${step.badgeBg}">
                  <span class="al-card-goal-icon">🎯</span>
                  ${step.goal}
                </span>
              </div>
              <p class="al-focus-label">Фокус программы</p>
              <ul class="al-focus-list">${focusItems}</ul>
              ${programsHTML}
            </div>
          </div>
        </div>
        ${connectorHTML}`;
    }).join('');

    return `
      <section id="ai-ladder-section">
        <div class="al-container">
          <div class="al-header">
            <div class="al-eyebrow">
              <div class="al-eyebrow-dot"></div>
              <span class="al-eyebrow-text">AI Ladder · СКОЛКОВО</span>
            </div>
            <h3 class="al-title">Лестница ИИ в СКОЛКОВО</h3>
            <p class="al-subtitle">Выбери свою ступень и начни путь к вершине</p>
          </div>
          <div class="al-staircase">
            ${stepsHTML}
          </div>
          <div class="al-cta">
            <p class="al-cta-text">
              <strong>Каждый уровень — это конкретный карьерный и бизнес-результат.</strong>
              Начни с L1, если только входишь в мир ИИ, или выбери L2/L3, если уже готов к трансформации.
            </p>
          </div>
        </div>
      </section>`;
  }

  /* ─── Injection logic ───────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('ai-ladder-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-ladder-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function findComparisonSection() {
    // Look for the section containing "СКОЛКОВО: Сравнительный анализ" heading
    const headings = document.querySelectorAll('h3');
    for (const h of headings) {
      if (h.textContent.includes('СКОЛКОВО: Сравнительный анализ')) {
        // Walk up to find the section element
        let el = h;
        while (el && el.tagName !== 'SECTION' && el !== document.body) {
          el = el.parentElement;
        }
        return el && el.tagName === 'SECTION' ? el : null;
      }
    }
    return null;
  }

  function findProgramsSection() {
    // Fallback: look for "Программы по регионам" heading
    const headings = document.querySelectorAll('h3');
    for (const h of headings) {
      if (h.textContent.includes('Программы по регионам')) {
        let el = h;
        while (el && el.tagName !== 'SECTION' && el !== document.body) {
          el = el.parentElement;
        }
        return el && el.tagName === 'SECTION' ? el : null;
      }
    }
    return null;
  }

  function inject() {
    // Only run on /education page
    if (!window.location.pathname.includes('/education')) return;
    // Don't inject twice
    if (document.getElementById('ai-ladder-section')) return;

    const target = findComparisonSection() || findProgramsSection();
    if (!target) return;

    injectStyles();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildLadderHTML();
    const ladderSection = wrapper.firstElementChild;
    target.parentNode.insertBefore(ladderSection, target);
  }

  /* ─── Observer: wait for React to render the page ──────────────────────── */
  function waitAndInject() {
    // Try immediately
    inject();
    if (document.getElementById('ai-ladder-section')) return;

    // Use MutationObserver to detect when React renders the comparison section
    let attempts = 0;
    const observer = new MutationObserver(() => {
      attempts++;
      inject();
      if (document.getElementById('ai-ladder-section') || attempts > 200) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also retry on route changes (SPA navigation)
    const originalPushState = history.pushState.bind(history);
    history.pushState = function (...args) {
      originalPushState(...args);
      setTimeout(waitAndInject, 300);
    };
    window.addEventListener('popstate', () => setTimeout(waitAndInject, 300));
  }

  /* ─── Bootstrap ─────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInject);
  } else {
    waitAndInject();
  }
})();
