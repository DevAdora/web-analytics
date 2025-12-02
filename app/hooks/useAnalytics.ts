"use client";

import { useEffect, useRef } from "react";

interface TrackingOptions {
  enableConsoleLog?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export default function useAnalytics(
  siteId: string, 
  options: TrackingOptions = {}
) {
  const {
    enableConsoleLog = false,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate tracking on strict mode or hot reload
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackPageView = async (attempt = 1) => {
      try {
        const trackingData = {
          siteId,
          path: window.location.pathname,
          referrer: document.referrer || "",
          userAgent: navigator.userAgent,
        };

        if (enableConsoleLog) {
          console.log("📊 Tracking page view:", trackingData);
        }

        const response = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(trackingData),
          // Don't wait for response to avoid blocking
          keepalive: true,
        });

        if (!response.ok) {
          throw new Error(`Tracking failed: ${response.status}`);
        }

        if (enableConsoleLog) {
          console.log("✅ Page view tracked successfully");
        }
      } catch (error) {
        console.error(`❌ Analytics tracking error (attempt ${attempt}):`, error);
        
        // Retry logic
        if (attempt < retryAttempts) {
          setTimeout(() => {
            trackPageView(attempt + 1);
          }, retryDelay * attempt); // Exponential backoff
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      trackPageView();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [siteId, enableConsoleLog, retryAttempts, retryDelay]);
}

// Advanced hook with event tracking
export function useAdvancedAnalytics(siteId: string) {
  const trackEvent = async (eventName: string, eventData?: Record<string, any>) => {
    try {
      await fetch("/api/track-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          eventName,
          eventData,
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Event tracking error:", error);
    }
  };

  return { trackEvent };
}