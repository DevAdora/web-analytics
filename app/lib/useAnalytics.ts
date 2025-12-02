"use client";

import { useEffect } from "react";

export default function useAnalytics(siteId: string) {
    useEffect(() => {
        fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                siteId,
                path: window.location.pathname,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
            }),
        });
    }, [siteId]);
}
