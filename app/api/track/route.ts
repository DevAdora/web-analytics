// app/api/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";
import { headers } from "next/headers";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
    try {
        // Handle both JSON and text/plain content types
        let body;
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            body = await req.json();
        } else if (contentType.includes("text/plain")) {
            const text = await req.text();
            body = JSON.parse(text);
        } else {
            body = await req.json();
        }

        const { siteId, path, referrer, userAgent } = body;

        // Validation
        if (!siteId || !path) {
            console.error("[Track API] Missing required fields:", { siteId, path });
            return NextResponse.json(
                { error: "Missing required fields: siteId and path" },
                { status: 400, headers: corsHeaders }
            );
        }

        // Get IP address for unique visitor tracking
        const headersList = await headers();
        const forwarded = headersList.get("x-forwarded-for");
        const realIp = headersList.get("x-real-ip");
        const ip = forwarded?.split(",")[0] || realIp || "unknown";

        console.log("[Track API] Tracking event:", {
            siteId,
            path,
            ip: ip.substring(0, 8) + "...", // Log partial IP for debugging
        });

        // Create a simple hash of the IP for privacy
        const ipHash = await createHash(ip + siteId);

        // Insert analytics event
        const { data, error } = await supabaseServer
            .from("analytics_events")
            .insert({
                site_id: siteId,
                path: path,
                referrer: referrer || null,
                user_agent: userAgent || null,
                ip_hash: ipHash,
                created_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error("[Track API] Database insert error:", error);
            return NextResponse.json(
                { error: "Failed to track event", details: error.message },
                { status: 500, headers: corsHeaders }
            );
        }

        console.log("[Track API] Event tracked successfully:", data);

        return NextResponse.json(
            { ok: true, tracked: true },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error("[Track API] Unexpected error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500, headers: corsHeaders }
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
        headers: corsHeaders,
    });
}