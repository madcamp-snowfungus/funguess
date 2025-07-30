// src/app/api/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameCode = searchParams.get('gameCode');

  if (!gameCode) {
    return NextResponse.json({ error: '게임 코드 누락' }, { status: 400 });
  }

  const { data: game, error } = await supabase
    .from('games')
    .select('liar_result')
    .eq('game_code', gameCode)
    .single();

  if (error || !game) {
    return NextResponse.json({ error: '게임을 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json({ isLiarWin: game.liar_result });
}