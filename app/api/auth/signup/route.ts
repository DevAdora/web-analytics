import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json();

        const response = NextResponse.json({ ok: true });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        const cookieHeader = request.headers.get("cookie");
                        if (!cookieHeader) return [];

                        return cookieHeader.split(";").map((c) => {
                            const [name, ...rest] = c.trim().split("=");
                            return { name, value: decodeURIComponent(rest.join("=")) };
                        });
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: String(fullName ?? "").trim() },
                emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
            },
        });

        if (error) {
            return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { ok: true, user: data.user, session: data.session },
            { headers: response.headers }
        );
    } catch {
        return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
    }
}
