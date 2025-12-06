import { createClient } from '@/app/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json();
        const supabase = createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ user: data.user }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}