/**
 * Passive productivity analytics for Verkhovskiy.ai.
 * Measures meaningful existing clicks without adding user-facing controls.
 */
(function () {
  'use strict';

  var startedAt = performance.now();
  var reportMatch = window.location.pathname.match(/^\/reports\/(\d{4}-\d{2}-\d{2})\/?$/);
  var reportId = reportMatch ? reportMatch[1] : 'dashboard';

  function classify(link) {
    var url;
    try { url = new URL(link.href, window.location.href); } catch (_) { return null; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (link.closest('.src')) return 'source';
    if (url.origin !== window.location.origin) {
      if (url.hostname === 't.me' || url.hostname.endsWith('.t.me')) return null;
      return 'external_resource';
    }
    if (/^\/reports\/\d{4}-\d{2}-\d{2}\/?$/.test(url.pathname)) return 'report';
    if (/^\/(llm-map|ai-costs|ai-stack-builder)\/?/.test(url.pathname)) return 'tool';
    return null;
  }

  function positionOf(link) {
    var card = link.closest('.ev, [class*="card"], article, li');
    if (!card || !card.parentElement) return 0;
    var peers = Array.prototype.filter.call(card.parentElement.children, function (el) {
      return el.matches('.ev, [class*="card"], article, li');
    });
    return Math.max(0, peers.indexOf(card) + 1);
  }

  function sectionOf(link) {
    var node = link.closest('.ev, [class*="card"], article, li') || link;
    while (node) {
      var previous = node.previousElementSibling;
      while (previous) {
        if (/^H[2-4]$/.test(previous.tagName)) return previous.textContent.trim().slice(0, 80);
        previous = previous.previousElementSibling;
      }
      node = node.parentElement;
      if (node === document.body) break;
    }
    return '';
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var itemType = classify(link);
    if (!itemType) return;
    var target = new URL(link.href, window.location.href);
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track('productive_click', {
        report_id: reportId,
        item_type: itemType,
        position: positionOf(link),
        section: sectionOf(link),
        destination_domain: target.hostname.replace(/^www\./, ''),
        elapsed_seconds: Math.max(0, Math.round(performance.now() - startedAt) / 1000)
      });
    }
  }, true);
})();
