// app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
        return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }

    try {
        // Handle "all sites" aggregation
        if (siteId === "all") {
            return await getAllSitesAnalytics();
        }

        // Single site analytics
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabaseServer
            .from("analytics_events")
            .select("path, referrer, created_at, ip_hash, user_agent")
            .eq("site_id", siteId)
            .gte("created_at", sevenDaysAgo)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
        }

        // ✅ FIX: Handle null/undefined data
        const events = data || [];
        const totalPageViews = events.length;
        const uniqueVisitors = new Set(events.map((row) => row.ip_hash)).size;

        // Calculate top pages
        const pageViewCount: Record<string, number> = {};
        events.forEach((row) => {
            pageViewCount[row.path] = (pageViewCount[row.path] || 0) + 1;
        });

        const topPages = Object.entries(pageViewCount)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate top referrers
        const referrerCount: Record<string, number> = {};
        events.forEach((row) => {
            if (row.referrer && row.referrer.trim() !== "") {
                try {
                    const referrerDomain = new URL(row.referrer).hostname;
                    referrerCount[referrerDomain] = (referrerCount[referrerDomain] || 0) + 1;
                } catch {
                    // Invalid URL, skip
                }
            }
        });

        const topReferrers = Object.entries(referrerCount)
            .map(([referrer, count]) => ({ referrer, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Time series data (last 7 days)
        const timeSeriesData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
            const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

            const views = events.filter(
                (row) => row.created_at >= dayStart && row.created_at <= dayEnd
            ).length;

            timeSeriesData.push({ date: dateStr, views });
        }

        // Browser stats
        const browserCount: Record<string, number> = {};
        events.forEach((row) => {
            if (row.user_agent) {
                let browser = "Other";
                if (row.user_agent.includes("Chrome")) browser = "Chrome";
                else if (row.user_agent.includes("Safari")) browser = "Safari";
                else if (row.user_agent.includes("Firefox")) browser = "Firefox";
                else if (row.user_agent.includes("Edge")) browser = "Edge";

                browserCount[browser] = (browserCount[browser] || 0) + 1;
            }
        });

        const topBrowsers = Object.entries(browserCount)
            .map(([browser, count]) => ({ browser, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Calculate bounce rate
        const sessionPages: Record<string, number> = {};
        events.forEach((row) => {
            sessionPages[row.ip_hash] = (sessionPages[row.ip_hash] || 0) + 1;
        });

        const singlePageSessions = Object.values(sessionPages).filter(count => count === 1).length;
        const bounceRate = uniqueVisitors > 0
            ? parseFloat(((singlePageSessions / uniqueVisitors) * 100).toFixed(1))
            : 0;

        return NextResponse.json({
            siteId,
            totalPageViews,
            uniqueVisitors,
            topPages,
            topReferrers,
            timeSeriesData,
            topBrowsers,
            bounceRate,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Analytics API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ✅ NEW: Handle "all sites" aggregation
async function getAllSitesAnalytics() {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Get all active sites
        const { data: sites, error: sitesError } = await supabaseServer
            .from("sites")
            .select("site_id")
            .eq("is_active", true);

        if (sitesError || !sites) {
            console.error("Error fetching sites:", sitesError);
            return NextResponse.json({
                type: "all",
                sites: [],
                totalSites: 0
            });
        }

        // Fetch analytics for each site
        const siteStats = await Promise.all(
            sites.map(async (site) => {
                const { data, error } = await supabaseServer
                    .from("analytics_events")
                    .select("path, ip_hash")
                    .eq("site_id", site.site_id)
                    .gte("created_at", sevenDaysAgo);

                if (error) {
                    console.error(`Error fetching analytics for ${site.site_id}:`, error);
                    return {
                        siteId: site.site_id,
                        totalPageViews: 0,
                        uniqueVisitors: 0,
                        topPages: [],
                    };
                }

                const events = data || [];
                const totalPageViews = events.length;
                const uniqueVisitors = new Set(events.map(row => row.ip_hash)).size;

                const pageViewCount: Record<string, number> = {};
                events.forEach((row) => {
                    pageViewCount[row.path] = (pageViewCount[row.path] || 0) + 1;
                });

                const topPages = Object.entries(pageViewCount)
                    .map(([path, count]) => ({ path, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                return {
                    siteId: site.site_id,
                    totalPageViews,
                    uniqueVisitors,
                    topPages,
                };
            })
        );

        return NextResponse.json({
            type: "all",
            sites: siteStats,
            totalSites: sites.length,
        });
    } catch (error) {
        console.error("All sites analytics error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}