// src/app/api/keyword/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const gameCode = req.nextUrl.searchParams.get('gameCode');

  if (!gameCode) {
    return NextResponse.json({ error: '게임 코드가 필요합니다.' }, { status: 400 });
  }

  const { data: gameData, error } = await supabase
    .from('games')
    .select('keyword')
    .eq('game_code', gameCode)
    .single();

  if (error || !gameData) {
    return NextResponse.json({ error: '게임을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ keyword: gameData.keyword });
}