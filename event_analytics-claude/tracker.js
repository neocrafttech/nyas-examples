/**
 * Lightweight event tracker snippet (~1.5 KB minified).
 * Add to any website: <script src="https://your-backend/tracker.js" data-api="https://your-backend"></script>
 *
 * Usage:
 *   nyas('pageview')
 *   nyas('click', { button: 'signup' })
 *   nyas('purchase', { value: 99.99, currency: 'USD' })
 */
(function () {
  'use strict';

  const script = document.currentScript;
  const API = (script && script.dataset.api) || window.__NYAS_API__ || '';
  const BATCH_MS = 3000;
  const MAX_BATCH = 50;

  let sessionId = sessionStorage.getItem('_nyas_sid');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('_nyas_sid', sessionId);
  }

  let queue = [];
  let timer = null;

  function flush() {
    if (!queue.length) return;
    const batch = queue.splice(0, MAX_BATCH);
    const payload = JSON.stringify({ events: batch });

    // Prefer sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API}/events/batch`, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(`${API}/events/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
        .catch(() => {});
    }
  }

  function track(event_type, properties) {
    queue.push({
      event_type: String(event_type),
      session_id: sessionId,
      page_url: location.href,
      referrer: document.referrer || undefined,
      properties: properties || {},
    });
    clearTimeout(timer);
    if (queue.length >= MAX_BATCH) { flush(); return; }
    timer = setTimeout(flush, BATCH_MS);
  }

  // Auto pageview on load + SPA route changes
  track('pageview');

  const pushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    pushState(...args);
    track('pageview');
  };
  window.addEventListener('popstate', () => track('pageview'));

  // Flush on page hide (mobile-safe)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);

  window.nyas = track;
})();
