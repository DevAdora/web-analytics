import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";
import { headers } from "next/headers";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
        return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }

    try {
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

        const totalPageViews = data.length;
        const uniqueVisitors = new Set(data.map((row) => row.ip_hash)).size;

        const pageViewCount: Record<string, number> = {};
        data.forEach((row) => {
            pageViewCount[row.path] = (pageViewCount[row.path] || 0) + 1;
        });

        const topPages = Object.entries(pageViewCount)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const referrerCount: Record<string, number> = {};
        data.forEach((row) => {
            if (row.referrer && row.referrer.trim() !== "") {
                try {
                    const referrerDomain = new URL(row.referrer).hostname;
                    referrerCount[referrerDomain] = (referrerCount[referrerDomain] || 0) + 1;
                } catch {
                }
            }
        });

        const topReferrers = Object.entries(referrerCount)
            .map(([referrer, count]) => ({ referrer, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { siteId, path, referrer, userAgent } = body;

        // Validation
        if (!siteId || !path) {
            return NextResponse.json(
                { error: "Missing required fields: siteId and path" },
                { status: 400 }
            );
        }

        // Get IP address for unique visitor tracking
        const headersList = await headers();
        const forwarded = headersList.get("x-forwarded-for");
        const realIp = headersList.get("x-real-ip");
        const ip = forwarded?.split(",")[0] || realIp || "unknown";

        // Create a simple hash of the IP for privacy
        const ipHash = await createHash(ip + siteId);

        // Insert analytics event
        const { error } = await supabaseServer
            .from("analytics_events")
            .insert({
                site_id: siteId,
                path: path,
                referrer: referrer || null,
                user_agent: userAgent || null,
                ip_hash: ipHash,
                created_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Database insert error:", error);
            return NextResponse.json(
                { error: "Failed to track event" },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true }, { headers: corsHeaders });
    } catch (error) {
        console.error("Track API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Simple hash function for IP privacy
async function createHash(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex.substring(0, 16); // Shortened hash
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}