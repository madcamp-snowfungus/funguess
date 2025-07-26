// src/app/api/signup/route.ts
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    const { id, password, nickname } = await req.json();

    // 중복 체크
    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

    if (existingUser) {
        return NextResponse.json(
            { message: '이미 존재하는 아이디입니다.' }, 
            { status: 409 }
        );
    }

    // 비밀번호 해싱(단방향 암호화)
    const hashedPw = await bcrypt.hash(password, 10);

    const { error } = await supabase
        .from('users')
        .insert([{ user_id: id, user_pw: hashedPw, user_nickname: nickname }]);

    if (error) {
        return NextResponse.json(
            { message: '회원가입 실패', error }, 
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: '회원가입 성공' }, 
        { status: 200 }
    );
}