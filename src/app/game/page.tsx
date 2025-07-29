// src/app/game/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { supabase } from '@/lib/supabaseClient'
import WaitingModal from '@/components/WaitingModal'

export default function GamePage() {
  const [code, setCode] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [gameId, setGameId] = useState<number | null>(null)
  const [gameCode, setGameCode] = useState('')
  const [isLiarSelected, setIsLiarSelected] = useState(false) // 라이어 선택 플래그
  
  const router = useRouter()

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo))
    } else {
      // 사용자 정보가 없으면 로그인 페이지로 리다이렉트
      router.push('/login')
    }
  }, [router])

  // 실시간 참가자 목록 구독
  useEffect(() => {
    if (!gameId) return

    console.log('실시간 구독 시작:', gameId)

    const channel = supabase
      .channel(`game_participants_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `game_id=eq.${gameId}`
        },
        async (payload) => {
          console.log('참가자 변경 감지:', payload)
          await fetchParticipants()
        }
      )
      .subscribe((status) => {
        console.log('실시간 구독 상태:', status)
        if (status === 'SUBSCRIBED') {
          console.log('실시간 구독 성공!')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('실시간 구독 실패!')
        }
      })

    // 테스트용: 5초마다 참가자 목록 새로고침
    const interval = setInterval(() => {
      console.log('주기적 참가자 목록 새로고침')
      fetchParticipants()
    }, 5000)

    return () => {
      console.log('실시간 구독 해제:', gameId)
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [gameId])

  // 참가자 목록 가져오기
  const fetchParticipants = async () => {
    if (!gameId) return

    console.log('참가자 목록 가져오기 시작:', gameId)

    try {
      const { data, error } = await supabase
        .from('game_participants')
        .select(`
          *,
          users!inner(user_nickname)
        `)
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true })

      if (error) {
        console.error('참가자 목록 가져오기 오류:', error)
        return
      }

      console.log('가져온 참가자 데이터:', data)

      const participantsList = data.map(p => ({
        id: p.id,
        user_id: p.user_id,
        nickname: p.users.user_nickname,
        isHost: p.is_host,
        role: p.role,
        joinedAt: p.joined_at
      }))

      console.log('처리된 참가자 목록:', participantsList)
      setParticipants(participantsList)

      // 4명이 모이면 자동으로 게임 시작
      if (participantsList.length === 4 && !isLiarSelected) {
        console.log('4명이 모였습니다. 게임 상태 확인')
        // 게임 상태 확인
        const { data: gameData } = await supabase
          .from('games')
          .select('status, liar_user_id')
          .eq('id', gameId)
          .single()

        if (gameData?.status === 'playing' && gameData?.liar_user_id) {
          console.log('게임이 이미 시작되었습니다.')
          setIsLiarSelected(true)
          router.push(`/game/${gameCode}/play`)
        }
      }
    } catch (error) {
      console.error('참가자 목록 가져오기 중 오류:', error)
    }
  }

  const handleCreateGame = () => {
    router.push('/game/create')
  }

  const handleJoinGame = async () => {
    if (!code.trim() || !currentUser) return

    try {
      // 게임 코드로 게임 찾기
      const { data: game, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_code', code.trim())
        .eq('status', 'waiting')
        .single()

      if (error || !game) {
        alert('존재하지 않는 방입니다.')
        return
      }

      // 이미 참가자인지 확인
      const { data: existingParticipant } = await supabase
        .from('game_participants')
        .select('*')
        .eq('game_id', game.id)
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (existingParticipant) {
        alert('이미 참가한 방입니다.')
        return
      }

      // 참가자 수 확인 (최대 4명)
      const { count: participantCount } = await supabase
        .from('game_participants')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id)

      if (participantCount && participantCount >= 4) {
        alert('방이 가득 찼습니다.')
        return
      }

      // 게임 참가자로 추가
      const { error: participantError } = await supabase
        .from('game_participants')
        .insert({
          user_id: currentUser.id,
          game_id: game.id,
          role: 'player',
          is_host: false,
          turn_order: participantCount || 0
        })

      if (participantError) {
        console.error('참가자 추가 오류:', participantError)
        alert('방 입장에 실패했습니다.')
        return
      }

      // 게임 정보를 로컬 스토리지에 저장
      localStorage.setItem('currentGameCode', code.trim())
      localStorage.setItem('currentGameId', game.id.toString())

      setGameId(game.id)
      setGameCode(code.trim())
      setIsWaiting(true)
      
      // 초기 참가자 목록 가져오기
      await fetchParticipants()
      
    } catch (error) {
      console.error('게임 참여 중 오류:', error)
      alert('방 입장에 실패했습니다.')
    }
  }

  if (!currentUser) {
    return <div>로딩 중...</div>
  }

  return (
    <Container>
      <Title>FunGuess</Title>
      <ButtonWrapper>
        <CreateButton onClick={handleCreateGame}>
          새로운 게임 시작하기
        </CreateButton>
        <JoinBox>
          <JoinText>참여 코드로 입장하기</JoinText>
          <Input
            placeholder="코드를 입력하세요"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <JoinButton onClick={handleJoinGame}>입장하기</JoinButton>
        </JoinBox>
      </ButtonWrapper>

      {isWaiting && (
        <WaitingModal
          gameCode={gameCode}
          participants={participants}
          onClose={() => setIsWaiting(false)}
        />
      )}
    </Container>
  )
}

const Container = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const Title = styled.h1`
  color: #FAFAFA;
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 50px;
  letter-spacing: 1px;
  cursor: default;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 40px;
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #00D09C 0%, #00FF88 100%);
  width: 400px;
  height: 300px;
  padding: 40px;
  font-size: 30px;
  font-weight: 700;
  color: #121212;
  border-radius: 20px;
  cursor: pointer;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 208, 156, 0.15);
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-1px) scale(1.01);
    // background: linear-gradient(135deg, #00C298 0%, #00E67A 100%);
    // box-shadow: 0 8px 20px rgba(0, 208, 156, 0.25);
  }

  &:active {
    transform: translateY(-1px) scale(0.99);
  }
`;

const JoinBox = styled.div`
  background: #1A1A1A;
  width: 400px;
  height: 300px;
  padding: 32px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 4px solid #00D09C;
  box-shadow: 0 8px 32px rgba(0, 208, 156, 0.10);
`;

const JoinText = styled.span`
  color: #00D09C;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 36px;
  cursor: default;
`;

const Input = styled.input`
  width: 280px;
  height: 50px;
  padding: 12px;
  border: 2px solid #00D09C;
  border-radius: 8px;
  background: #1A1A1A;
  color: #FAFAFA;
  font-size: 18px;
  text-align: left;
  outline: none;
  transition: border 0.3s;

  &::placeholder {
    color: #707070;
    font-size: 14px;
  }

  &:focus {
    border: 2px solid #AEEADB;
  }
`;

const JoinButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 280px;
  height: 50px;
  margin-top: 16px;
  background: linear-gradient(135deg, #00D09C 0%, #00FF88 100%);
  color: #1A1A1A;
  font-size: 18px;
  font-weight: 700;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 208, 156, 0.10);
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: linear-gradient(135deg, #00C298 0%, #00FF88 100%);
    transform: translateY(-1px) scale(1.01);
  }
`;