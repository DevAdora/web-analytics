// app/auth/callback/route.ts
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';
    const error = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');

    // Handle error from Supabase
    if (error) {
        console.error('Auth callback error:', error, error_description);
        return NextResponse.redirect(
            new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
        );
    }

    // Exchange code for session
    if (code) {
        const supabase = await createServerSupabaseClient();

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            return NextResponse.redirect(
                new URL('/auth/login?error=Unable to verify email. Please try logging in.', requestUrl.origin)
            );
        }

        // Get the user to verify they're authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('Error getting user after exchange:', userError);
            return NextResponse.redirect(
                new URL('/auth/login?error=Authentication failed. Please try logging in.', requestUrl.origin)
            );
        }

        console.log('User authenticated successfully:', user.id);

        // Successful authentication - redirect to dashboard
        return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    // No code provided - redirect to login
    return NextResponse.redirect(
        new URL('/auth/login?error=Invalid confirmation link', requestUrl.origin)
    );
}