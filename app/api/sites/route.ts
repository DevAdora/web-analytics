// app/api/sites/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

// -------------------- Types --------------------

type SiteRow = {
  site_id: string;
  name: string;
  domain: string | null;
  is_active: boolean;
  user_id: string;
  created_at?: string;
};

type CreateSiteBody = {
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

function generateSiteId(name: string): string {
  // Create a URL-friendly site ID from the name
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 9);
}

// -------------------- GET - Fetch user's sites --------------------

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch only sites belonging to the current user
    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .eq("user_id", user.id)
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
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();

    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const domain =
      body.domain === null || body.domain === undefined
        ? null
        : typeof body.domain === "string"
          ? body.domain.trim()
          : null;

    // Validation
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Validate domain format (optional but recommended)
    if (domain && !isValidUrl(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format. Must be a valid URL." },
        { status: 400 }
      );
    }

    // Generate a unique site_id
    const siteId = generateSiteId(name);

    // Check if site_id already exists (unlikely but good practice)
    const { data: existing } = await supabase
      .from("sites")
      .select("site_id")
      .eq("site_id", siteId)
      .maybeSingle();

    if (existing) {
      // Regenerate if collision occurs
      const newSiteId = generateSiteId(name) + '-' + Date.now();

      const { data, error } = await supabase
        .from("sites")
        .insert({
          site_id: newSiteId,
          name,
          domain,
          user_id: user.id, // Associate with current user
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
    }

    // Insert new site with user_id
    const { data, error } = await supabase
      .from("sites")
      .insert({
        site_id: siteId,
        name,
        domain,
        user_id: user.id, // Associate with current user
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
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Verify user owns this site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("site_id")
      .eq("site_id", siteId)
      .eq("user_id", user.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: "Site not found or unauthorized" },
        { status: 404 }
      );
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

    const { data, error } = await supabase
      .from("sites")
      .update(updates)
      .eq("site_id", siteId)
      .eq("user_id", user.id) // Ensure user owns the site
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
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify user owns this site before deleting
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("site_id")
      .eq("site_id", siteId)
      .eq("user_id", user.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: "Site not found or unauthorized" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("sites")
      .update({ is_active: false })
      .eq("site_id", siteId)
      .eq("user_id", user.id); // Ensure user owns the site

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