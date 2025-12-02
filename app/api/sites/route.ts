// app/api/sites/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

// GET - Fetch all sites
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("sites")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sites:", error);
      return NextResponse.json(
        { error: "Failed to fetch sites" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sites: data || [] });
  } catch (error) {
    console.error("Sites API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new site (for future use)
export async function POST(req: Request) {
  try {
    const { siteId, name, domain } = await req.json();

    if (!siteId || !name) {
      return NextResponse.json(
        { error: "siteId and name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("sites")
      .insert({ 
        site_id: siteId, 
        name, 
        domain: domain || null 
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating site:", error);
      return NextResponse.json(
        { error: "Failed to create site" },
        { status: 500 }
      );
    }

    return NextResponse.json({ site: data }, { status: 201 });
  } catch (error) {
    console.error("Sites API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}