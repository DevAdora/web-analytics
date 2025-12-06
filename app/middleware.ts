import { type NextRequest } from 'next/server';
import { updateSession } from '../app/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const { supabase, response } = await getSupabaseClient(request);

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Redirect to dashboard if already logged in
    if (
        (request.nextUrl.pathname.startsWith('/auth/login') ||
            request.nextUrl.pathname.startsWith('/auth/signup')) &&
        session
    ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

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
                set(name: string, value: string, options: any) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    return { supabase, response };
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/auth/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};