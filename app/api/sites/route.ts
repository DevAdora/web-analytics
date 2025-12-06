// app/api/sites/route.ts
import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

// -------------------- Types --------------------

type SiteRow = {
  site_id: string;
  name: string;
  domain: string | null;
  is_active: boolean;
  created_at?: string;
};

type CreateSiteBody = {
  siteId: string;
  name: string;
  domain?: string | null;
};

type UpdateSiteBody = {
  siteId: string;
  name?: string;
  domain?: string | null;
  isActive?: boolean;
};

type SiteUpdateFields = {
  name: string;
  domain: string | null;
  is_active: boolean;
};

// -------------------- Helpers --------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

// -------------------- GET - Fetch all sites --------------------

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("sites")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sites:", error);
      return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
    }

    return NextResponse.json({ sites: (data ?? []) as SiteRow[] });
  } catch (error: unknown) {
    console.error("Sites API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// -------------------- POST - Create a new site --------------------

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const domain =
      body.domain === null || body.domain === undefined
        ? null
        : typeof body.domain === "string"
          ? body.domain.trim()
          : null;

    // Validation
    if (!siteId || !name) {
      return NextResponse.json({ error: "siteId and name are required" }, { status: 400 });
    }

    // Validate domain format (optional but recommended)
    if (domain && !isValidUrl(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format. Must be a valid URL." },
        { status: 400 }
      );
    }

    // Check if site_id already exists
    const { data: existing } = await supabaseServer
      .from("sites")
      .select("site_id")
      .eq("site_id", siteId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Site ID already exists. Please choose a different name." },
        { status: 409 }
      );
    }

    // Insert new site
    const { data, error } = await supabaseServer
      .from("sites")
      .insert({
        site_id: siteId,
        name,
        domain,
        created_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating site:", error);
      return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
    }

    return NextResponse.json({ site: data as SiteRow }, { status: 201 });
  } catch (error: unknown) {
    console.error("Sites API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// -------------------- PATCH - Update a site --------------------

export async function PATCH(req: Request) {
  try {
    const body: unknown = await req.json();

    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : undefined;

    const domain =
      body.domain === undefined
        ? undefined
        : body.domain === null
          ? null
          : typeof body.domain === "string"
            ? body.domain.trim()
            : undefined;

    const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Build typed updates object
    const updates: Partial<SiteUpdateFields> = {};
    if (name !== undefined) updates.name = name;
    if (domain !== undefined) updates.domain = domain;
    if (isActive !== undefined) updates.is_active = isActive;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Optional: validate domain if provided as string
    if (typeof updates.domain === "string" && updates.domain && !isValidUrl(updates.domain)) {
      return NextResponse.json(
        { error: "Invalid domain format. Must be a valid URL." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("sites")
      .update(updates)
      .eq("site_id", siteId)
      .select()
      .single();

    if (error) {
      console.error("Error updating site:", error);
      return NextResponse.json({ error: "Failed to update site" }, { status: 500 });
    }

    return NextResponse.json({ site: data as SiteRow });
  } catch (error: unknown) {
    console.error("Sites API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// -------------------- DELETE - Soft delete a site --------------------

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("sites")
      .update({ is_active: false })
      .eq("site_id", siteId);

    if (error) {
      console.error("Error deleting site:", error);
      return NextResponse.json({ error: "Failed to delete site" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Site deleted" });
  } catch (error: unknown) {
    console.error("Sites API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
