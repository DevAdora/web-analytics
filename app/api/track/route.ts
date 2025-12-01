import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { siteId, path, referrer, userAgent } = await req.json();

        if (!siteId || !path) {
            return NextResponse.json(
                { error: "Missing siteId or path" },
                { status: 400 }
            );
        }

        // Get IP from request headers (may vary by deployment)
        const ip =
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "unknown";

        const hash = crypto
            .createHash("sha256")
            .update(ip + siteId)
            .digest("hex");

        const { error } = await supabaseServer.from("analytics_events").insert({
            site_id: siteId,
            path,
            referrer,
            user_agent: userAgent,
            ip_hash: hash,
        });

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Track API error:", err);
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
