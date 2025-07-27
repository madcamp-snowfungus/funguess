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
        joinedAt: p.joined_at
      }))

      console.log('처리된 참가자 목록:', participantsList)
      setParticipants(participantsList)

      // 4명이 모이면 자동으로 게임 시작
      if (participantsList.length === 4) {
        console.log('4명이 모였습니다. 게임 상태 확인')
        // 게임 상태 확인
        const { data: gameData } = await supabase
          .from('games')
          .select('status')
          .eq('id', gameId)
          .single()

        if (gameData?.status === 'playing') {
          console.log('게임 시작 페이지로 이동')
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
  background-color: #111;
  color: white;
`

const Title = styled.h1`
  font-size: 50px;
  font-weight: bold;
  margin-bottom: 5vh;
`

const ButtonWrapper = styled.div`
  display: flex;
  gap: 5vw;
`

const CreateButton = styled.button`
  background-color: #4ee7c2;
  width: 25vw;
  height: 30vh;
  padding: 40px;
  font-size: 36px;
  font-weight: 600;
  color: black;
  border-radius: 16px;
  cursor: pointer;
  border: none;

  &:hover {
    background-color: #3cc3a5;
  }
`

const JoinBox = styled.div`
  background-color: #635bff;
  width: 25vw;
  height: 30vh;
  padding: 3vw;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`

const JoinText = styled.span`
  margin-bottom: 12px;
  font-size: 36px;
  font-weight: 600;
`

const Input = styled.input`
  width: 18vw;
  padding: 1vh;
  border: 1px solid #FAFAFA;
  border-radius: 4px;
  background-color: #000;
  color: #fff;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;

  &::placeholder {
    color: #707070;
    font-size: 12px;
  }
`

const JoinButton = styled.button`
  margin-top: 16px;
  width: 18vw;
  padding: 5px 0;
  background-color: #ffffff;
  color: #635bff;
  font-weight: bold;
  font-size: 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e8e8e8;
  }
`
