// app/api/analytics/route.ts - TYPED VERSION (no any)
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

// -------------------- Types --------------------

type TimeRange = "24h" | "7d" | "30d" | "90d";

type ISODateString = string;

type AnalyticsEventBase = {
    created_at: ISODateString;
    path: string;
    ip_hash: string;
};

type AnalyticsEventWithUARef = AnalyticsEventBase & {
    referrer: string | null;
    user_agent: string | null;
};

type AnalyticsEventLight = AnalyticsEventBase; // path, ip_hash, created_at

type TopPage = { path: string; count: number };
type TopReferrer = { referrer: string; count: number };
type TimeSeriesPoint = { date: string; views: number };
type BrowserStat = { browser: string; count: number };

type SingleSiteAnalytics = {
    siteId: string;
    totalPageViews: number;
    uniqueVisitors: number;
    topPages: TopPage[];
    topReferrers: TopReferrer[];
    timeSeriesData: TimeSeriesPoint[];
    topBrowsers: BrowserStat[];
    bounceRate: number;
    avgSessionDuration: number; // seconds
    lastUpdated: string;
    timeRange: TimeRange;
};

type SiteRow = {
    site_id: string;
    name: string;
    domain: string;
};

type AllSitesAnalyticsItem = {
    siteId: string;
    name: string;
    domain: string;
    totalPageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    topPages: TopPage[];
    timeSeriesData: TimeSeriesPoint[];
};

type AllSitesAnalytics = {
    type: "all";
    sites: AllSitesAnalyticsItem[];
    totalSites: number;
    timeRange: TimeRange;
};

type AnalyticsResponse = SingleSiteAnalytics | AllSitesAnalytics;

type CacheEntry = {
    data: AnalyticsResponse;
    timestamp: number;
};

// In-memory cache (use Redis in production)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60_000; // 1 minute

// -------------------- Route handlers --------------------

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const timeRange = (searchParams.get("range") || "7d") as TimeRange;

    if (!siteId) {
        return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }

    const cacheKey = `${siteId}-${timeRange}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Analytics API] Cache hit for ${cacheKey}`);
        return NextResponse.json({ ...cached.data, cached: true });
    }

    try {
        const result: AnalyticsResponse =
            siteId === "all"
                ? await getAllSitesAnalytics(timeRange)
                : await getSingleSiteAnalytics(siteId, timeRange);

        cache.set(cacheKey, { data: result, timestamp: Date.now() });

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("Analytics API error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    cache.clear();
    return NextResponse.json({
        message: "Cache cleared",
        timestamp: new Date().toISOString(),
    });
}

// -------------------- Core logic --------------------

function resolveRange(timeRange: TimeRange): { startDate: string; days: number } {
    if (timeRange === "24h") {
        return { startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), days: 1 };
    }
    if (timeRange === "30d") {
        return { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), days: 30 };
    }
    if (timeRange === "90d") {
        return { startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), days: 90 };
    }
    // default 7d
    return { startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), days: 7 };
}

async function getSingleSiteAnalytics(siteId: string, timeRange: TimeRange): Promise<SingleSiteAnalytics> {
    const { startDate, days } = resolveRange(timeRange);

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

    const events: AnalyticsEventWithUARef[] = (data ?? []) as AnalyticsEventWithUARef[];

    const [
        totalPageViews,
        uniqueVisitors,
        topPages,
        topReferrers,
        timeSeriesData,
        topBrowsers,
        bounceRate,
        avgSessionDuration,
    ] = await Promise.all([
        Promise.resolve(events.length),
        Promise.resolve(new Set(events.map((e) => e.ip_hash)).size),
        Promise.resolve(calculateTopPages(events)),
        Promise.resolve(calculateTopReferrers(events)),
        Promise.resolve(calculateTimeSeries(events, days)),
        Promise.resolve(calculateTopBrowsers(events)),
        Promise.resolve(calculateBounceRate(events)),
        Promise.resolve(calculateAvgSessionDuration(events)),
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

async function getAllSitesAnalytics(timeRange: TimeRange): Promise<AllSitesAnalytics> {
    const { startDate, days } = resolveRange(timeRange);

    const { data: sites, error: sitesError } = await supabaseServer
        .from("sites")
        .select("site_id, name, domain")
        .eq("is_active", true);

    if (sitesError || !sites) {
        console.error("Error fetching sites:", sitesError);
        return { type: "all", sites: [], totalSites: 0, timeRange };
    }

    const typedSites = sites as SiteRow[];

    const siteStats = await Promise.all(
        typedSites.map(async (site): Promise<AllSitesAnalyticsItem> => {
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
                    domain: site.domain,
                    totalPageViews: 0,
                    uniqueVisitors: 0,
                    bounceRate: 0,
                    topPages: [],
                    timeSeriesData: [],
                };
            }

            const events: AnalyticsEventLight[] = (data ?? []) as AnalyticsEventLight[];
            const totalPageViews = events.length;
            const uniqueVisitors = new Set(events.map((e) => e.ip_hash)).size;

            return {
                siteId: site.site_id,
                name: site.name,
                domain: site.domain,
                totalPageViews,
                uniqueVisitors,
                bounceRate: calculateBounceRate(events),
                topPages: calculateTopPages(events),
                timeSeriesData: calculateTimeSeries(events, days),
            };
        })
    );

    return {
        type: "all",
        sites: siteStats,
        totalSites: typedSites.length,
        timeRange,
    };
}

// -------------------- Utility functions (typed) --------------------

function calculateTopPages(events: Array<Pick<AnalyticsEventBase, "path">>, limit = 10): TopPage[] {
    const pageViewCount: Record<string, number> = {};
    for (const e of events) pageViewCount[e.path] = (pageViewCount[e.path] || 0) + 1;

    return Object.entries(pageViewCount)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function calculateTopReferrers(
    events: Array<Pick<AnalyticsEventWithUARef, "referrer">>,
    limit = 10
): TopReferrer[] {
    const referrerCount: Record<string, number> = {};

    for (const e of events) {
        const ref = e.referrer;
        if (ref && ref.trim() !== "") {
            try {
                const domain = new URL(ref).hostname;
                referrerCount[domain] = (referrerCount[domain] || 0) + 1;
            } catch {
                // ignore invalid URL
            }
        }
    }

    return Object.entries(referrerCount)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function calculateTimeSeries(events: Array<Pick<AnalyticsEventBase, "created_at">>, days: number): TimeSeriesPoint[] {
    const seriesData: TimeSeriesPoint[] = [];

    if (days === 1) {
        for (let i = 23; i >= 0; i--) {
            const hourDate = new Date(Date.now() - i * 60 * 60 * 1000);
            const hourStr = hourDate.toISOString();

            const hourStartDate = new Date(hourDate);
            hourStartDate.setMinutes(0, 0, 0);
            const hourStart = hourStartDate.toISOString();

            const hourEndDate = new Date(hourDate);
            hourEndDate.setMinutes(59, 59, 999);
            const hourEnd = hourEndDate.toISOString();

            const views = events.filter((e) => e.created_at >= hourStart && e.created_at <= hourEnd).length;
            seriesData.push({ date: hourStr, views });
        }
    } else {
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split("T")[0] ?? "";

            const dayStartDate = new Date(date);
            dayStartDate.setHours(0, 0, 0, 0);
            const dayStart = dayStartDate.toISOString();

            const dayEndDate = new Date(date);
            dayEndDate.setHours(23, 59, 59, 999);
            const dayEnd = dayEndDate.toISOString();

            const views = events.filter((e) => e.created_at >= dayStart && e.created_at <= dayEnd).length;
            seriesData.push({ date: dateStr, views });
        }
    }

    return seriesData;
}

function calculateTopBrowsers(
    events: Array<Pick<AnalyticsEventWithUARef, "user_agent">>,
    limit = 5
): BrowserStat[] {
    const browserCount: Record<string, number> = {};

    for (const e of events) {
        const ua = e.user_agent;
        if (!ua) continue;

        let browser = "Other";
        if (ua.includes("Chrome") && !ua.includes("Edge")) browser = "Chrome";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Edge")) browser = "Edge";

        browserCount[browser] = (browserCount[browser] || 0) + 1;
    }

    return Object.entries(browserCount)
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function calculateBounceRate(events: Array<Pick<AnalyticsEventBase, "ip_hash">>): number {
    const sessionPages: Record<string, number> = {};

    for (const e of events) sessionPages[e.ip_hash] = (sessionPages[e.ip_hash] || 0) + 1;

    const uniqueVisitors = Object.keys(sessionPages).length;
    const singlePageSessions = Object.values(sessionPages).filter((count) => count === 1).length;

    return uniqueVisitors > 0 ? parseFloat(((singlePageSessions / uniqueVisitors) * 100).toFixed(1)) : 0;
}

function calculateAvgSessionDuration(events: Array<Pick<AnalyticsEventBase, "ip_hash" | "created_at">>): number {
    const sessions: Record<string, string[]> = {};

    for (const e of events) {
        (sessions[e.ip_hash] ??= []).push(e.created_at);
    }

    let totalDuration = 0;
    let validSessions = 0;

    for (const timestamps of Object.values(sessions)) {
        if (timestamps.length <= 1) continue;

        timestamps.sort(); // ISO strings sort chronologically
        const first = timestamps[0]!;
        const last = timestamps[timestamps.length - 1]!;
        const duration = new Date(last).getTime() - new Date(first).getTime();

        if (duration < 3_600_000) {
            totalDuration += duration;
            validSessions++;
        }
    }

    return validSessions > 0 ? Math.floor(totalDuration / validSessions / 1000) : 0;
}
