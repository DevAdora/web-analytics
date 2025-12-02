// lib/useAnalytics.ts
"use client";

import { useEffect, useRef } from "react";

export default function useAnalytics(siteId: string) {
    const hasTracked = useRef(false);

    useEffect(() => {
        if (hasTracked.current) return;
        hasTracked.current = true;

        const trackPageView = async () => {
            try {
                await fetch('https://localhost:3000/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        siteId,
                        path: window.location.pathname,
                        referrer: document.referrer || '',
                        userAgent: navigator.userAgent
                    }),
                    keepalive: true
                });
            } catch (error) {
                console.error('Analytics error:', error);
            }
        };

        trackPageView();
    }, [siteId]);
}