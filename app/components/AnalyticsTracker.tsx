"use client";

import { useEffect } from "react";

interface AnalyticsTrackerProps {
  siteId: string;
}

export default function AnalyticsTracker({ siteId }: AnalyticsTrackerProps) {


  useEffect(() => {

    if (document.querySelector('script[src="/track.js"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "/track.js";
    script.setAttribute("data-site-id", "dashboard-test");
    script.async = true;


    script.onerror = (e) => {
      console.error("❌ Failed to load tracking script", e);
    };

    document.head.appendChild(script);

    return () => {
      const s = document.querySelector('script[src="/track.js"]');
      if (s) s.remove();
    };
  }, []);
}
