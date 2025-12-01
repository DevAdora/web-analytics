import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

export async function GET() {
  const { error } = await supabaseServer.from("analytics_events").insert({
    site_id: "test",
    path: "/",
    referrer: "test",
    user_agent: "manual-test",
    ip_hash: "123"
  });

  return NextResponse.json({
    success: !error,
    error
  });
}