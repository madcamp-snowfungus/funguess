// src/app/api/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
    const { gameCode, isLiarWin } = await req.json();

    console.log('[DEBUG] gameCode:', gameCode);
    console.log('[DEBUG] isLiarWin:', isLiarWin);

    const { data: game, error } = await supabase
        .from('games')
        .select('id')
        .eq('game_code', gameCode)
        .single();

    if (error || !game) {
        console.error('[ERROR] 게임 찾기 실패:', error);
        return NextResponse.json({ error: '게임을 찾을 수 없습니다' }, { status: 404 });
    }

    const { error: updateError } = await supabase
        .from('games')
        .update({ status: 'ended', liar_result: isLiarWin })
        .eq('id', game.id);

    if (updateError) {
        console.error('[ERROR] 게임 상태 업데이트 실패:', updateError);
        return NextResponse.json({ error: '게임 상태 업데이트 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}