// public/track.js
// Universal Analytics Tracking Script
(function () {
  "use strict";

  // Get the script tag that loaded this file
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  // Extract site ID from the script tag's data attribute
  const siteId = currentScript.getAttribute("data-site-id");

  if (!siteId) {
    console.error("[Analytics] Missing data-site-id attribute");
    return;
  }

  // Get the analytics API endpoint (same origin as this script)
  const scriptSrc = currentScript.src;
  const analyticsUrl =
    scriptSrc.substring(0, scriptSrc.lastIndexOf("/")) + "/api/track";

  // Track page view
  function trackPageView() {
    const data = {
      siteId: siteId,
      path: window.location.pathname,
      referrer: document.referrer || "",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Use sendBeacon if available (more reliable)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      navigator.sendBeacon(analyticsUrl, blob);
    } else {
      // Fallback to fetch
      fetch(analyticsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(function (err) {
        // Silently fail - don't disrupt user experience
        console.debug("[Analytics] Tracking failed:", err);
      });
    }
  }

  // Track initial page view
  if (document.readyState === "complete") {
    trackPageView();
  } else {
    window.addEventListener("load", trackPageView);
  }

  // Track page views on SPA navigation (for React/Next.js apps)
  let lastPath = window.location.pathname;

  function checkPathChange() {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackPageView();
    }
  }

  // Watch for URL changes (works with client-side routing)
  setInterval(checkPathChange, 1000);

  // Also listen to popstate (browser back/forward)
  window.addEventListener("popstate", trackPageView);

  // Expose tracking function for custom events (optional)
  window._analytics = {
    track: trackPageView,
    siteId: siteId,
  };
})();
