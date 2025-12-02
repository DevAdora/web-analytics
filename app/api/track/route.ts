import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
        return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }

    try {
        // Get last 7 days of events
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

        // Basic metrics
        const totalPageViews = data.length;
        const uniqueVisitors = new Set(data.map((row) => row.ip_hash)).size;

        // Top pages
        const pageViewCount: Record<string, number> = {};
        data.forEach((row) => {
            pageViewCount[row.path] = (pageViewCount[row.path] || 0) + 1;
        });

        const topPages = Object.entries(pageViewCount)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Top referrers (excluding direct/empty)
        const referrerCount: Record<string, number> = {};
        data.forEach((row) => {
            if (row.referrer && row.referrer.trim() !== "") {
                // Extract domain from referrer
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

        // Time series data (daily views for last 7 days)
        const timeSeriesData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
            const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

            const views = data.filter(
                (row) => row.created_at >= dayStart && row.created_at <= dayEnd
            ).length;

            timeSeriesData.push({
                date: dateStr,
                views,
            });
        }

        // Browser statistics (from user agent)
        const browserCount: Record<string, number> = {};
        data.forEach((row) => {
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

        // Calculate bounce rate (single page sessions)
        const sessionPages: Record<string, number> = {};
        data.forEach((row) => {
            sessionPages[row.ip_hash] = (sessionPages[row.ip_hash] || 0) + 1;
        });

        const singlePageSessions = Object.values(sessionPages).filter(count => count === 1).length;
        const bounceRate = uniqueVisitors > 0
            ? ((singlePageSessions / uniqueVisitors) * 100).toFixed(1)
            : "0.0";

        return NextResponse.json({
            siteId,
            totalPageViews,
            uniqueVisitors,
            topPages,
            topReferrers,
            timeSeriesData,
            topBrowsers,
            bounceRate: parseFloat(bounceRate),
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