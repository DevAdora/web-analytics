import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export async function middleware(request: NextRequest) {
    const { supabase, response } = await getSupabaseClient(request);

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith("/dashboard") && !session) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Redirect to dashboard if already logged in
    if (
        (request.nextUrl.pathname.startsWith("/auth/login") ||
            request.nextUrl.pathname.startsWith("/auth/signup")) &&
        session
    ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

type CookieOptions = Partial<ResponseCookie>;

async function getSupabaseClient(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Update request cookies (so current middleware execution sees it)
                    request.cookies.set({ name, value, ...options });

                    // Re-create response and set cookie on it
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: "", ...options });

                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    return { supabase, response };
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/auth/:path*",
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
