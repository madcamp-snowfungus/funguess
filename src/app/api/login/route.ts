// src/app/api/login/route.ts
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    const { id, password } = await req.json();

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

    if (error || !user) {
        return NextResponse.json(
            { message: '아이디 또는 비밀번호가 틀렸습니다.' }, 
            { status: 401 }
        );
    }

    const isPasswordValid = await bcrypt.compare(password, user.user_pw);
    
    if (!isPasswordValid) {
        return NextResponse.json(
            { message: '비밀번호가 틀렸습니다.' }, 
            { status: 401 }
        );
    }

    return NextResponse.json(
        { message: '로그인 성공' }, 
        { status: 200 }
    );
}