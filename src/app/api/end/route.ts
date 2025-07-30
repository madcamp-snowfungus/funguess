// src/app/api/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {

    const { gameCode, isLiarWin } = await req.json();

    const { data: game, error } = await supabase
        .from('games')
        .select('id')
        .eq('game_code', gameCode)
        .single();

    if (error || !game) {
        return NextResponse.json({ error: '게임을 찾을 수 없습니다' }, { status: 404 });
    }

    const { error: updateError } = await supabase
        .from('games')
        .update({ status: 'ended', liar_result: isLiarWin })
        .eq('id', game.id);

    if (updateError) {
        return NextResponse.json({ error: '게임 상태 업데이트 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}