import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // We'll attach any auth cookies to THIS response
    const response = NextResponse.json({ ok: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Read cookies from the incoming request
          getAll() {
            return request.headers.get("cookie")
              ? request.headers.get("cookie")!.split(";").map((c) => {
                  const [name, ...rest] = c.trim().split("=");
                  return { name, value: decodeURIComponent(rest.join("=")) };
                })
              : [];
          },
          // Write cookies onto the outgoing response
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    // Return user AND include Set-Cookie headers
    return NextResponse.json(
      { ok: true, user: data.user },
      { headers: response.headers }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
