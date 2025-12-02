// components/AnalyticsTracker.tsx - DEBUG VERSION
"use client";

import { useEffect } from "react";

interface AnalyticsTrackerProps {
  siteId: string;
}

export default function AnalyticsTracker({ siteId }: AnalyticsTrackerProps) {
  // Add this directly to your dashboard page.tsx
  // Replace the AnalyticsTracker component with this useEffect

  useEffect(() => {
    console.log("🔵 Dashboard mounted - initializing tracking");

    // Check if already loaded
    if (document.querySelector('script[src="/track.js"]')) {
      console.log("🟡 Tracking script already exists");
      return;
    }

    console.log("🟢 Creating tracking script");
    const script = document.createElement("script");
    script.src = "/track.js";
    script.setAttribute("data-site-id", "dashboard-test");
    script.async = true;

    script.onload = () => {
      console.log("✅ Tracking script loaded");
    };

    script.onerror = (e) => {
      console.error("❌ Failed to load tracking script", e);
    };

    document.head.appendChild(script);
    console.log("🟢 Script appended to head");

    return () => {
      const s = document.querySelector('script[src="/track.js"]');
      if (s) s.remove();
    };
  }, []);
}
