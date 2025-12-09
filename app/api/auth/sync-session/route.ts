// app/api/auth/sync-session/route.ts
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { access_token, refresh_token } = await request.json();

        if (!access_token || !refresh_token) {
            return NextResponse.json(
                { error: 'Missing tokens' },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Set the session on the server side
        const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
        });

        if (error) {
            console.error('Session sync error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        // The session is now set in server-side cookies
        return NextResponse.json(
            { success: true, user: data.user },
            { status: 200 }
        );
    } catch (error) {
        console.error('Sync session error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}