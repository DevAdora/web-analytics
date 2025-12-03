// app/api/analytics/route.ts - OPTIMIZED VERSION
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

// In-memory cache (use Redis in production)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const timeRange = searchParams.get("range") || "7d"; // 7d, 30d, 90d

    if (!siteId) {
        return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }

    // Check cache
    const cacheKey = `${siteId}-${timeRange}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Analytics API] Cache hit for ${cacheKey}`);
        return NextResponse.json({ ...cached.data, cached: true });
    }

    try {
        const result = siteId === "all"
            ? await getAllSitesAnalytics(timeRange)
            : await getSingleSiteAnalytics(siteId, timeRange);

        // Cache the result
        cache.set(cacheKey, { data: result, timestamp: Date.now() });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Analytics API error:", error);
        return NextResponse.json(
            { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

async function getSingleSiteAnalytics(siteId: string, timeRange: string) {
    // Calculate time range
    let startDate: string;
    let days: number;

    if (timeRange === "24h") {
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        days = 1;
    } else if (timeRange === "30d") {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        days = 30;
    } else {
        // Default to 7d (week)
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        days = 7;
    }

    // Use a single optimized query with select only needed fields
    const { data, error } = await supabaseServer
        .from("analytics_events")
        .select("path, referrer, created_at, ip_hash, user_agent")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Database error:", error);
        throw new Error("Database query failed");
    }

    const events = data || [];

    // Parallel processing for better performance
    const [
        totalPageViews,
        uniqueVisitors,
        topPages,
        topReferrers,
        timeSeriesData,
        topBrowsers,
        bounceRate,
        avgSessionDuration
    ] = await Promise.all([
        // Total page views
        Promise.resolve(events.length),

        // Unique visitors
        Promise.resolve(new Set(events.map(e => e.ip_hash)).size),

        // Top pages
        calculateTopPages(events),

        // Top referrers
        calculateTopReferrers(events),

        // Time series
        calculateTimeSeries(events, days),

        // Top browsers
        calculateTopBrowsers(events),

        // Bounce rate
        calculateBounceRate(events),

        // Average session duration (estimated)
        calculateAvgSessionDuration(events)
    ]);

    return {
        siteId,
        totalPageViews,
        uniqueVisitors,
        topPages,
        topReferrers,
        timeSeriesData,
        topBrowsers,
        bounceRate,
        avgSessionDuration,
        lastUpdated: new Date().toISOString(),
        timeRange,
    };
}

async function getAllSitesAnalytics(timeRange: string) {
    // Calculate time range
    let startDate: string;
    let days: number;

    if (timeRange === "24h") {
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        days = 1;
    } else if (timeRange === "30d") {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        days = 30;
    } else {
        // Default to 7d (week)
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        days = 7;
    }

    // Get all active sites
    const { data: sites, error: sitesError } = await supabaseServer
        .from("sites")
        .select("site_id, name")
        .eq("is_active", true);

    if (sitesError || !sites) {
        console.error("Error fetching sites:", sitesError);
        return { type: "all", sites: [], totalSites: 0 };
    }

    // Fetch analytics for all sites in parallel
    const siteStats = await Promise.all(
        sites.map(async (site) => {
            const { data, error } = await supabaseServer
                .from("analytics_events")
                .select("path, ip_hash, created_at")
                .eq("site_id", site.site_id)
                .gte("created_at", startDate);

            if (error) {
                console.error(`Error fetching analytics for ${site.site_id}:`, error);
                return {
                    siteId: site.site_id,
                    name: site.name,
                    totalPageViews: 0,
                    uniqueVisitors: 0,
                    bounceRate: 0,
                    topPages: [],
                    timeSeriesData: [],
                };
            }

            const events = data || [];
            const totalPageViews = events.length;
            const uniqueVisitors = new Set(events.map(e => e.ip_hash)).size;

            return {
                siteId: site.site_id,
                name: site.name,
                totalPageViews,
                uniqueVisitors,
                bounceRate: await calculateBounceRate(events),
                topPages: await calculateTopPages(events),
                timeSeriesData: await calculateTimeSeries(events, days),
            };
        })
    );

    return {
        type: "all",
        sites: siteStats,
        totalSites: sites.length,
        timeRange,
    };
}

// Utility functions
function calculateTopPages(events: any[], limit = 10) {
    const pageViewCount: Record<string, number> = {};
    events.forEach(e => {
        pageViewCount[e.path] = (pageViewCount[e.path] || 0) + 1;
    });

    return Object.entries(pageViewCount)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function calculateTopReferrers(events: any[], limit = 10) {
    const referrerCount: Record<string, number> = {};

    events.forEach(e => {
        if (e.referrer && e.referrer.trim() !== "") {
            try {
                const domain = new URL(e.referrer).hostname;
                referrerCount[domain] = (referrerCount[domain] || 0) + 1;
            } catch {
                // Invalid URL, skip
            }
        }
    });

    return Object.entries(referrerCount)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function calculateTimeSeries(events: any[], days: number) {
    const seriesData = [];

    // For 24h view, show hourly data
    if (days === 1) {
        for (let i = 23; i >= 0; i--) {
            const hourDate = new Date(Date.now() - i * 60 * 60 * 1000);
            const hourStr = hourDate.toISOString();
            const hourStart = new Date(hourDate.setMinutes(0, 0, 0)).toISOString();
            const hourEnd = new Date(hourDate.setMinutes(59, 59, 999)).toISOString();

            const views = events.filter(
                e => e.created_at >= hourStart && e.created_at <= hourEnd
            ).length;

            seriesData.push({ date: hourStr, views });
        }
    } else {
        // For week/month view, show daily data
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
            const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

            const views = events.filter(
                e => e.created_at >= dayStart && e.created_at <= dayEnd
            ).length;

            seriesData.push({ date: dateStr, views });
        }
    }

    return seriesData;
}

function calculateTopBrowsers(events: any[], limit = 5) {
    const browserCount: Record<string, number> = {};

    events.forEach(e => {
        if (e.user_agent) {
            let browser = "Other";
            if (e.user_agent.includes("Chrome") && !e.user_agent.includes("Edge")) browser = "Chrome";
            else if (e.user_agent.includes("Safari") && !e.user_agent.includes("Chrome")) browser = "Safari";
            else if (e.user_agent.includes("Firefox")) browser = "Firefox";
            else if (e.user_agent.includes("Edge")) browser = "Edge";

            browserCount[browser] = (browserCount[browser] || 0) + 1;
        }
    });

    return Object.entries(browserCount)
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function calculateBounceRate(events: any[]) {
    const sessionPages: Record<string, number> = {};

    events.forEach(e => {
        sessionPages[e.ip_hash] = (sessionPages[e.ip_hash] || 0) + 1;
    });

    const uniqueVisitors = Object.keys(sessionPages).length;
    const singlePageSessions = Object.values(sessionPages).filter(count => count === 1).length;

    return uniqueVisitors > 0
        ? parseFloat(((singlePageSessions / uniqueVisitors) * 100).toFixed(1))
        : 0;
}

function calculateAvgSessionDuration(events: any[]) {
    // Group events by IP hash (session)
    const sessions: Record<string, string[]> = {};

    events.forEach(e => {
        if (!sessions[e.ip_hash]) sessions[e.ip_hash] = [];
        sessions[e.ip_hash].push(e.created_at);
    });

    let totalDuration = 0;
    let validSessions = 0;

    Object.values(sessions).forEach(timestamps => {
        if (timestamps.length > 1) {
            timestamps.sort();
            const duration = new Date(timestamps[timestamps.length - 1]).getTime() -
                new Date(timestamps[0]).getTime();
            // Only count sessions less than 1 hour (filter out anomalies)
            if (duration < 3600000) {
                totalDuration += duration;
                validSessions++;
            }
        }
    });

    return validSessions > 0
        ? Math.floor(totalDuration / validSessions / 1000) // Convert to seconds
        : 0;
}

// Clear cache endpoint (call periodically or on-demand)
export async function DELETE() {
    cache.clear();
    return NextResponse.json({ message: "Cache cleared", timestamp: new Date().toISOString() });
}