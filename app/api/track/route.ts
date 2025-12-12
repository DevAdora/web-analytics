// app/api/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";
import { headers } from "next/headers";

// Helper to get CORS headers based on origin
function getCorsHeaders(origin: string | null) {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "false",
    };
}

// Helper to check if request is from development environment
function isDevelopmentEnvironment(
    origin: string | null,
    referer: string | null,
    host: string | null,
    forwardedHost: string | null
): boolean {
    // Check all possible sources of hostname information
    const hostsToCheck = [origin, referer, host, forwardedHost].filter(Boolean);

    const devPatterns = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '192.168.',
        '10.0.',
        '172.16.',
        '.local',
        ':3000',
        ':3001',
        ':8080',
        ':5173', // Vite default
        ':4200', // Angular default
    ];

    // Check if any host matches development patterns
    return hostsToCheck.some(hostValue => {
        if (!hostValue) return false;
        return devPatterns.some(pattern => hostValue.includes(pattern));
    });
}

export async function POST(req: NextRequest) {
    const headersList = await headers();
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const host = headersList.get("host");
    const forwardedHost = headersList.get("x-forwarded-host");
    const corsHeaders = getCorsHeaders(origin);

    // Check if it's from development environment
    if (isDevelopmentEnvironment(origin, referer, host, forwardedHost)) {
        console.log("[Track API] Blocked request from development environment:", {
            origin,
            referer,
            host,
            forwardedHost,
        });
        return NextResponse.json(
            { error: "Tracking disabled in development environment" },
            { status: 403, headers: corsHeaders }
        );
    }

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
        const forwarded = headersList.get("x-forwarded-for");
        const realIp = headersList.get("x-real-ip");
        const ip = forwarded?.split(",")[0] || realIp || "unknown";

        console.log("[Track API] Tracking event:", {
            siteId,
            path,
            origin,
            host,
            forwardedHost,
            ip: ip.substring(0, 8) + "...",
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
            { status: 500, headers: getCorsHeaders(origin) }
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
    return hashHex.substring(0, 16);
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin");
    return new NextResponse(null, {
        status: 200,
        headers: getCorsHeaders(origin),
    });
}