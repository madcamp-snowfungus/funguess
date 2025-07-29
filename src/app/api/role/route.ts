// src/app/api/role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
    const { userId, gameCode } = await req.json();

    // 1. 게임 코드로 game_id와 keyword 조회
    const { data: game, error: gameError } = await supabase
        .from('games')
        .select('id, keyword')
        .eq('game_code', gameCode)
        .single()

    if (gameError || !game) {
        return NextResponse.json({ error: '해당 게임 코드가 존재하지 않습니다.' }, { status: 404 })
    }

    // 2. game_id와 user_id로 참가자의 역할 조회
    const { data: participant, error: participantError } = await supabase
        .from('game_participants')
        .select('role')
        .eq('game_id', game.id)
        .eq('user_id', userId)
        .single()

    if (participantError || !participant) {
        return NextResponse.json({ error: '게임 참가자 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 3. 역할과 keyword 반환 (player)
    if (participant.role === 'player') {
        return NextResponse.json({
            role: 'player',
            keyword: game.keyword
        });
    }

    return NextResponse.json({ 
        role: participant.role // liar
    });
}