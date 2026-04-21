"use client";

import { useEffect } from "react";

interface AnalyticsTrackerProps {
  siteId: string;
}

export default function AnalyticsTracker({ siteId }: AnalyticsTrackerProps) {
  useEffect(() => {
    const SCRIPT_SRC = "/track.js";

    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.setAttribute("data-site-id", siteId);
    script.async = true;
    script.onerror = (e) => console.error("[Analytique] Failed to load tracking script", e);

    document.head.appendChild(script);

    return () => {
      document.querySelector(`script[src="${SCRIPT_SRC}"]`)?.remove();
    };
  }, [siteId]);

  return null;
}