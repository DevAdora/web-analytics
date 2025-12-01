import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
        return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }

    // Get last 7 days of events
    const { data, error } = await supabaseServer
        .from("analytics_events")
        .select("path, referrer, created_at, ip_hash")
        .eq("site_id", siteId)
        .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        );

    if (error) {
        console.error(error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // Compute summary
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

    return NextResponse.json({
        siteId,
        totalPageViews,
        uniqueVisitors,
        topPages,
    });
}
