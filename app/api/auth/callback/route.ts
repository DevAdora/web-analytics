import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Error exchanging code for session:', error);
            return NextResponse.redirect(new URL('/auth/login?error=callback_failed', requestUrl.origin));
        }
    }

    // Redirect to dashboard or specified next page
    return NextResponse.redirect(new URL(next, requestUrl.origin));
}