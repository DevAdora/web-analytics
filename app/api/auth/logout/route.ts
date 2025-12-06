import { createClient } from '@/app/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const supabase = createClient();
        await supabase.auth.signOut();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}