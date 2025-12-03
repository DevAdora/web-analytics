import { NextResponse } from 'next/server';

export async function GET() {
  const script = `
(function () {
  'use strict';

  var currentScript = document.currentScript || 
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var siteId = currentScript.getAttribute('data-site-id');
  if (!siteId) {
    console.error('[Analytics] Missing data-site-id attribute');
    return;
  }

  var u = new URL(currentScript.src);
  var analyticsUrl = u.origin + '/api/track';


  console.log('[Analytics] Initialized for site:', siteId);
  console.log('[Analytics] Tracking endpoint:', analyticsUrl);

  if (window._analytics && window._analytics.initialized) {
    console.log('[Analytics] Already initialized, skipping');
    return;
  }

  function trackPageView() {
    var data = {
      siteId: siteId,
      path: window.location.pathname,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    console.log('[Analytics] Tracking page view:', data);

    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        var sent = navigator.sendBeacon(analyticsUrl, blob);
        console.log('[Analytics] Beacon sent:', sent);
      } catch (err) {
        console.error('[Analytics] Beacon error:', err);
        fallbackFetch(data);
      }
    } else {
      fallbackFetch(data);
    }
  }

    fetch(analyticsUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(data),
      keepalive: true,
      mode: "cors"
    })
      .then(function (response) {
        console.log('[Analytics] Response status:', response.status);
        return response.json();
      })
      .then(function (result) {
        console.log('[Analytics] Result:', result);
      })
      .catch(function (err) {
        console.error('[Analytics] Fetch error:', err);
      });
  }

  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }

  var lastPath = window.location.pathname;
  
  function checkPathChange() {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      console.log('[Analytics] Path changed to:', lastPath);
      trackPageView();
    }
  }

  setInterval(checkPathChange, 1000);
  window.addEventListener('popstate', trackPageView);

  window._analytics = {
    track: trackPageView,
    siteId: siteId,
    initialized: true
  };

  console.log('[Analytics] Setup complete');
})();
`.trim();

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const dynamic = 'force-static';