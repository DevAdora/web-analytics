// app/api/track.js/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const script = `
(function () {
  'use strict';

  // Get the current script element
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  // Extract site ID from data attribute
  var siteId = currentScript.getAttribute('data-site-id');
  if (!siteId) {
    console.error('[Analytics] Missing data-site-id attribute');
    return;
  }

  // Determine the tracking endpoint
  var u = new URL(currentScript.src);
  var analyticsUrl = u.origin + '/api/track';

  console.log('[Analytics] Initialized for site:', siteId);
  console.log('[Analytics] Tracking endpoint:', analyticsUrl);

  // Prevent double initialization
  if (window._analytics && window._analytics.initialized) {
    console.log('[Analytics] Already initialized, skipping');
    return;
  }

  // Fallback fetch function
  function fallbackFetch(data) {
    return fetch(analyticsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
      mode: 'cors'
    })
      .then(function (response) {
        if (!response.ok) {
          console.error('[Analytics] HTTP error:', response.status);
        }
        return response.json();
      })
      .then(function (result) {
        console.log('[Analytics] Track successful:', result);
      })
      .catch(function (err) {
        console.error('[Analytics] Fetch error:', err);
      });
  }

  // Main tracking function
  function trackPageView() {
    var data = {
      siteId: siteId,
      path: window.location.pathname,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    console.log('[Analytics] Tracking page view:', data);

    // Try sendBeacon first (more reliable for page unload)
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([JSON.stringify(data)], { 
          type: 'application/json' 
        });
        var sent = navigator.sendBeacon(analyticsUrl, blob);
        console.log('[Analytics] Beacon sent:', sent);
        if (!sent) {
          fallbackFetch(data);
        }
      } catch (err) {
        console.error('[Analytics] Beacon error:', err);
        fallbackFetch(data);
      }
    } else {
      fallbackFetch(data);
    }
  }

  // Track initial page view
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }

  // Track SPA navigation (for React, Next.js, etc.)
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

  // Expose analytics API
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
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      "Access-Control-Allow-Origin": "*",
    },
  });
}