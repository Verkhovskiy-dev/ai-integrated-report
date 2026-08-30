(function () {
  'use strict';

  var UMAMI_WEBSITE_ID = 'af3768d0-f56a-406c-9d77-cf20b803f6b9';
  var METRIKA_COUNTER_ID = 111316059;

  if (!document.querySelector('script[data-website-id="' + UMAMI_WEBSITE_ID + '"]')) {
    var umami = document.createElement('script');
    umami.defer = true;
    umami.src = 'https://cloud.umami.is/script.js';
    umami.dataset.websiteId = UMAMI_WEBSITE_ID;
    document.head.appendChild(umami);
  }

  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = window.ym.l || Date.now();

  if (!document.querySelector('script[src*="mc.yandex.ru/metrika/tag.js"]')) {
    var metrika = document.createElement('script');
    metrika.async = true;
    metrika.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_COUNTER_ID;
    document.head.appendChild(metrika);
  }

  window.ym(METRIKA_COUNTER_ID, 'init', {
    accurateTrackBounce: true,
    clickmap: true,
    referrer: document.referrer,
    trackLinks: true,
    url: location.href,
    webvisor: true
  });

  var FUNNEL_STORAGE_KEY = 'verkhovskiy_education_funnel_v1';
  var EKEN_HOST_PATTERN = /(^|\.)ekenlab\.com$/i;
  var TELEGRAM_HOST_PATTERN = /(^|\.)t\.me$/i;

  function track(eventName, payload) {
    var eventPayload = Object.assign({
      page_path: location.pathname,
      page_title: document.title
    }, payload || {});

    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(eventName, eventPayload);
    }

    window.ym(METRIKA_COUNTER_ID, 'reachGoal', eventName, eventPayload);
  }

  function getElementLabel(element) {
    return (element.getAttribute('aria-label') || element.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
  }

  function getEkenUrl(element) {
    var link = element.closest && element.closest('a[href]');
    if (!link) return null;

    try {
      var url = new URL(link.href, location.href);
      return EKEN_HOST_PATTERN.test(url.hostname) ? url : null;
    } catch (error) {
      return null;
    }
  }

  function addEkenAttribution(link, url) {
    if (!link || !url) return;

    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', 'verkhovskiy.ai');
      url.searchParams.set('utm_medium', 'referral');
      url.searchParams.set('utm_campaign', 'education_funnel');
      url.searchParams.set('utm_content', location.pathname.replace(/^\/+|\/+$/g, '') || 'home');
      link.href = url.toString();
    }
  }

  function trackReturnVisit() {
    var now = Date.now();
    var state = null;

    try {
      state = JSON.parse(localStorage.getItem(FUNNEL_STORAGE_KEY) || 'null');
    } catch (error) {
      state = null;
    }

    if (state && state.lastVisitAt) {
      var daysSinceLastVisit = (now - state.lastVisitAt) / 86400000;
      if (daysSinceLastVisit >= 1 && daysSinceLastVisit <= 7) {
        track('return_visit_7d', {
          days_since_last_visit: Math.round(daysSinceLastVisit * 10) / 10
        });
      }
    }

    try {
      localStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify({
        firstVisitAt: state && state.firstVisitAt ? state.firstVisitAt : now,
        lastVisitAt: now
      }));
    } catch (error) {
      // Analytics must never block the product when storage is unavailable.
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    var clickable = target.closest('a, button, [role="button"]');
    if (!clickable) return;
    if (clickable.getAttribute('data-analytics-skip-auto') === 'true') return;

    var label = getElementLabel(clickable);
    var ekenUrl = getEkenUrl(clickable);

    var link = clickable.closest && clickable.closest('a[href]');
    if (link) {
      try {
        var telegramUrl = new URL(link.href, location.href);
        if (TELEGRAM_HOST_PATTERN.test(telegramUrl.hostname)) {
          track('telegram_subscribe_click', {
            destination: telegramUrl.origin + telegramUrl.pathname,
            bot: telegramUrl.pathname.replace(/^\/+/, ''),
            start_source: telegramUrl.searchParams.get('start') || 'unattributed',
            cta_label: label,
            source_path: location.pathname
          });
          return;
        }
      } catch (error) {
        // Ignore malformed external links; analytics must not block navigation.
      }
    }

    if (ekenUrl) {
      addEkenAttribution(clickable.closest('a[href]'), ekenUrl);
      track(ekenUrl.pathname.indexOf('/integrations/verkhovskiy') === 0
        ? 'eken_route_handoff'
        : 'eken_cta_click', {
        destination: ekenUrl.origin + ekenUrl.pathname,
        cta_label: label,
        source_path: location.pathname
      });
      return;
    }

    if (/eken/i.test(label)) {
      track('eken_cta_click', {
        destination: 'programmatic_or_unresolved',
        cta_label: label,
        source_path: location.pathname
      });
      return;
    }

    if (/обуч|образован|программ|курс|learn|education|program/i.test(label)) {
      track('education_interest', {
        cta_label: label,
        source_path: location.pathname
      });
    }
  }, true);

  window.setTimeout(function () {
    trackReturnVisit();
  }, 2500);

  window.setTimeout(function () {
    track('content_engaged_60s', { elapsed_seconds: 60 });
  }, 60000);

  window.verkhovskiyAnalytics = {
    track: track,
    trackEducationInterest: function (payload) {
      track('education_interest', payload);
    },
    trackEkenHandoff: function (payload) {
      track('eken_route_handoff', payload);
    }
  };
})();
