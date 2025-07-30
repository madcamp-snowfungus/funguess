// src/app/api/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ParticipantWithUser {
  user_id: number;
  role: string;
  turn_order: number;
  users: {
    user_nickname: string;
  };
}

export async function POST(req: NextRequest) {
  const { gameCode } = await req.json();

  // 1. 게임 ID 조회
  const { data: gameData, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('game_code', gameCode)
    .single();

  if (gameError || !gameData) {
    return NextResponse.json({ error: '게임을 찾을 수 없습니다.' }, { status: 404 });
  }

  const gameId = gameData.id;

  // 2. 참가자 + 유저 닉네임 조인
  const participantResponse = await supabase
    .from('game_participants')
    .select(`
      user_id,
      role,
      turn_order,
      users (
        user_nickname
      )
    `)
    .eq('game_id', gameId);

  if (participantResponse.error || !participantResponse.data) {
    return NextResponse.json({ error: '참가자 정보를 불러올 수 없습니다.' }, { status: 500 });
  }

  const participants = participantResponse.data as unknown as ParticipantWithUser[];

  // 3. 투표 집계
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select('target_user_id')
    .eq('game_id', gameId);

  if (votesError || !votesData) {
    return NextResponse.json({ error: '투표 정보를 불러올 수 없습니다.' }, { status: 500 });
  }

  // 4. 득표 수 계산
  const voteCounts: Record<number, number> = {};
  votesData.forEach((vote) => {
    voteCounts[vote.target_user_id] = (voteCounts[vote.target_user_id] || 0) + 1;
  });

  // 5. 플레이어 정보 구성
  const players = participants.map((p) => ({
    userId: p.user_id,
    nickname: p.users.user_nickname,
    turnOrder: p.turn_order,
    votes: voteCounts[p.user_id] || 0,
    role: p.role,
  }));

  // 6. 라이어 찾기
  const liar = players.find((p) => p.role === 'liar');
  if (!liar) {
    return NextResponse.json({ error: '라이어가 존재하지 않습니다.' }, { status: 400 });
  }

  const liarNickname = liar.nickname;

  // 7. 최다 득표자 찾기
  const maxVotes = Math.max(...players.map(p => p.votes));
  const topVoted = players.filter(p => p.votes === maxVotes);

  // 8. 시민들의 추리 성공 여부
  // 시민 승리 조건: 최다 득표자가 1명이고, 그 사람이 라이어일 때만
  let isLiarWin = true;

  if (topVoted.length === 1 && topVoted[0].role === 'liar') {
    isLiarWin = false;
  }

  return NextResponse.json({
    liarNickname,
    isLiarWin,
    players
  });
}