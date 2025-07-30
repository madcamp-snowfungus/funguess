// src/components/WaitingModal.tsx
'use client'

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import LoadingScreen from './LoadingScreen';

interface Participant {
  id: number
  user_id: number
  nickname: string
  isHost: boolean
  role: string
  joinedAt: string
}

interface WaitingModalProps {
  gameCode: string;
  participants: Participant[];
  keyword: string;
  onClose?: () => void;
}

export default function WaitingModal({ gameCode, participants, keyword, onClose }: WaitingModalProps) {
  const router = useRouter();

  const [userId, setUserId] = useState<number | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  // userId, gameId 불러오는 useEffect (최초 한 번 실행)
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    const storedGameId = localStorage.getItem('currentGameId');

    console.log('[DEBUG] userInfo 로드됨:', storedUser);
    console.log('[DEBUG] gameId 로드됨:', storedGameId);

    if (storedUser && storedGameId) {
      const parsed = JSON.parse(storedUser);
      console.log('[DEBUG] parsed userInfo:', parsed);
      setUserId(Number(parsed.id));
      setGameId(Number(storedGameId));
    }
  }, []);

  // 구독은 userId, gameId가 모두 준비된 후에만 실행
  useEffect(() => {
    if (userId === null || gameId === null) return;

    console.log('✅ 구독 시도 중', { userId, gameId });

    const channel = supabase
      .channel(`game_status_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        async (payload) => {
          console.log('게임 시작 감지됨', payload);

          if (payload.new.status !== 'started') {
            console.log('게임 상태가 started가 아님:', payload.new.status);
            return;
          }

          const res = await fetch('/api/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, gameCode }),
          });

          const data = await res.json();

          if (res.ok && data.role) {
            const stored = localStorage.getItem('userInfo');
            const parsed = stored ? JSON.parse(stored) : {};

            localStorage.setItem('userInfo', JSON.stringify({
              ...parsed,
              role: data.role,
            }));
          }

          console.log('[DEBUG] /api/role 응답:', data);

          if (data.role === 'liar') {
            setShowLoading(true);
            setTimeout(() => {
              router.push(`/game/${gameCode}/reveal?role=liar`);
            }, 2000);
          } else if (data.role === 'player' && data.keyword) {
            const encodedKeyword = encodeURIComponent(data.keyword);
            setShowLoading(true);
            setTimeout(() => {
              router.push(`/game/${gameCode}/reveal?role=player&keyword=${encodedKeyword}`);
            }, 2000);
          } else {
            console.warn('[WARN] 역할이 비정상적이거나 keyword 없음', data);
          }
        }
      )
      .subscribe((status) => {
        console.log('✅ Supabase subscribe 상태:', status);
      });

    return () => {
      console.log('🧹 구독 제거');
      supabase.removeChannel(channel);
    };
  }, [userId, gameId]);

  console.log('[DEBUG] 전체 participants', participants);

  // 방장만 - 시작 버튼
  const handleStart = async () => {
    if (participants.length < 4) return;

    const currentUser = participants.find(p => p.user_id === userId);
    if (!currentUser?.isHost) {
      alert('방장만 게임을 시작할 수 있습니다.');
      return;
    }

    // 라이어 선택
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        id,
        user_id,
        is_host,
        role,
        joined_at,
        users:user_id(user_nickname)
      `)
      .eq('game_id', gameId);

    if (error || !data || data.length !== 4) {
      console.error('참가자 정보 조회 실패:', error);
      return;
    }

    const latestParticipants = data as Array<{
      id: number;
      user_id: number;
      is_host: boolean;
      role: string;
      joined_at: string;
      users: { user_nickname: string }[];
    }>;

    const existingLiar = latestParticipants.find(p => p.role === 'liar');
    if (existingLiar) {
      console.log('이미 라이어가 설정되어 있음:', existingLiar);

      // 게임 상태가 이미 started이면 그냥 라우팅만
      const { data: gameData } = await supabase
        .from('games')
        .select('status')
        .eq('id', gameId)
        .single();
      
      if (gameData?.status === 'started') {
        const res = await fetch('/api/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, gameCode }),
        });

        const { role } = await res.json();

        const url = role === 'liar'
          ? `/game/${gameCode}/reveal?role=liar`
          : `/game/${gameCode}/reveal?role=player&keyword=${encodeURIComponent(keyword)}`;

        setShowLoading(true);
        setTimeout(() => {
          router.push(url);
        }, 2000);
        return;
      }
    } else {
      const randomIndex = Math.floor(Math.random() * latestParticipants.length);
      const selected = latestParticipants[randomIndex];

      await fetch('/api/games/select-liar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          liarUserId: selected.user_id
        })
      });
    }

    // 게임 상태 업데이트
    await supabase
      .from('games')
      .update({ status: 'started' })
      .eq('id', gameId);

    // 방장도 역할 받아와서 reveal 페이지로 이동
    const res = await fetch('/api/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, gameCode }),
    });

    const { role } = await res.json();

    if (!role || !['liar', 'player'].includes(role)) {
      alert('역할 정보를 찾을 수 없습니다.');
      return;
    }

    const url = role === 'liar'
      ? `/game/${gameCode}/reveal?role=liar`
      : `/game/${gameCode}/reveal?role=player&keyword=${encodeURIComponent(keyword)}`;

    setShowLoading(true);
    setTimeout(() => {
      router.push(url);
    }, 2000);

    if (onClose) onClose();
  };

  const isDisabled = participants.length < 4;

  if (showLoading) {
    return <LoadingScreen message="게임을 시작하고 있습니다..." />;
  }

  return (
    <ModalOverlay>
      <ModalContent
        as={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Title>🎮 게임 대기 중...</Title>
        <GameCode>게임 코드: {gameCode}</GameCode>
        <Divider />
        <ParticipantCount>
          참가자: {participants.length}/4명
        </ParticipantCount>
        <List>
          {participants.map((participant, idx) => (
            <ParticipantItem key={participant.id}>
              <ParticipantIcon>
                {participant.isHost ? '👑' : '👤'}
              </ParticipantIcon>
              <ParticipantName>
                {participant.nickname}
                {participant.isHost && ' (방장)'}
              </ParticipantName>
            </ParticipantItem>
          ))}
        </List>
        {participants.length < 4 && (
          <WaitingMessage>
            다른 참가자들이 입장할 때까지 기다려주세요...
          </WaitingMessage>
        )}
        <StartButton disabled={isDisabled} onClick={handleStart}>
          {isDisabled ? '4명 입장 시 시작 가능' : '게임 시작'}
        </StartButton>
      </ModalContent>
    </ModalOverlay>
  )
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(4px);
`

const ModalContent = styled.div`
  background: #1e1e1e;
  color: white;
  padding: 40px;
  border-radius: 16px;
  width: 400px;
  text-align: center;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
`

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 8px;
`

const GameCode = styled.div`
  font-size: 14px;
  color: #21D35D;
  margin-bottom: 16px;
  font-weight: bold;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #444;
  margin-bottom: 20px;
`

const ParticipantCount = styled.div`
  font-size: 16px;
  color: #ccc;
  margin-bottom: 16px;
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  text-align: left;
  margin-bottom: 24px;
`

const ParticipantItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`

const ParticipantIcon = styled.span`
  font-size: 20px;
  margin-right: 12px;
`

const ParticipantName = styled.span`
  font-size: 16px;
  color: #fff;
`

const WaitingMessage = styled.div`
  font-size: 14px;
  color: #888;
  margin-bottom: 20px;
  font-style: italic;
`

const StartButton = styled.button<{ disabled?: boolean }>`
  background: ${({ disabled }) =>
    disabled
      ? '#555'
      : 'linear-gradient(135deg, #21D35D, rgb(23, 202, 83))'};
  color: ${({ disabled }) => (disabled ? '#999' : 'black')};
  padding: 14px 24px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-2px)')};
    background: ${({ disabled }) =>
      disabled
        ? '#555'
        : 'linear-gradient(135deg, #21D35D, rgb(23, 202, 83))'};
  }
`