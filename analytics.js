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
})();
