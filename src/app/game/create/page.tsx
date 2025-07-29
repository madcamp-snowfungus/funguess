// src/app/game/[code]/create/page.tsx
'use client'

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { MdContentCopy } from 'react-icons/md'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import WaitingModal from '@/components/WaitingModal'

export default function CreateGamePage() {
  const router = useRouter()

  const [gameName, setGameName] = useState('')
  const [keywordType, setKeywordType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [gameId, setGameId] = useState<number | null>(null)

  const keywordOptions = [
    '일상 단어',
    '직업',
    '영화 제목',
    '음식',
    '동물',
    '3분반 사람들',
  ]

  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setGameCode(code)
    
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
        }, fetchParticipants)
      .subscribe((status) => {
        console.log('실시간 구독 상태:', status)
        if (status === 'SUBSCRIBED') {
          console.log('실시간 구독 성공!')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('실시간 구독 실패!')
        }
      })

    // 3초마다 참가자 목록 새로고침
    const interval = setInterval(() => {
      console.log('주기적 참가자 목록 새로고침')
      fetchParticipants()
    }, 3000)

    return () => {
      console.log('실시간 구독 해제:', gameId)
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [gameId])

  // 제시어 랜덤 선택
  const randomKeyword = async () => {
    const { data, error } = await supabase
      .from('keywords')
      .select('word')
      .eq('keyword_type', keywordType);
  
    if (error) {
      console.error('제시어 불러오기 실패:', error);
      return;
    }
  
    if (!data || data.length === 0) {
      console.warn('해당 타입의 제시어가 없습니다.');
      return;
    }
  
    const randomIndex = Math.floor(Math.random() * data.length);
    const selectedKeyword = data[randomIndex].word;
    console.log('랜덤 제시어:', selectedKeyword)
    setKeyword(selectedKeyword);

    return selectedKeyword;
  };

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

      if (!data || data.length === 0) {
        console.log('참가자 데이터가 없습니다.')
        setParticipants([])
        return
      }

      const participantsList = data.map(p => {
        console.log('처리 중인 참가자:', p)
        return {
          id: p.id,
          user_id: p.user_id,
          nickname: p.users?.user_nickname || '알 수 없음',
          isHost: p.is_host,
          role: p.role,
          joinedAt: p.joined_at
        }
      })

      console.log('처리된 참가자 목록:', participantsList)
      setParticipants(participantsList)

      if (participantsList.length === 4) {
        console.log('4명이 모였습니다. 게임 시작 준비 완료!')
      } else {
        console.log('아직 4명이 아닙니다. 현재:', participantsList.length)
      }
    } catch (error) {
      console.error('참가자 목록 가져오기 중 오류:', error)
    }
  }

  const handleCopy = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(gameCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {
        alert('복사에 실패했습니다.')
      })
    } else {
      const tempInput = document.createElement('input')
      tempInput.value = gameCode
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand('copy')
      document.body.removeChild(tempInput)

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStart = async () => {
    if (!gameName || !keywordType || !gameCode || !currentUser) {
      alert('모든 항목을 입력해주세요.')
      return
    }

    try {
      // 1. 게임 생성
      const word = await randomKeyword()
      console.log('제시어:', word)
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          host_user_id: currentUser.id,
          keyword_type: keywordType,
          keyword: word,
          game_code: gameCode,
          status: 'waiting',
          current_turn: 0
        })
        .select()
        .single()

      if (gameError) {
        console.error('게임 생성 오류:', gameError)
        alert('방 생성에 실패했습니다.')
        return
      }

      // 2. 방장을 게임 참가자로 추가
      const { error: participantError } = await supabase
        .from('game_participants')
        .insert({
          user_id: currentUser.id,
          game_id: gameData.id,
          role: 'player',
          is_host: true,
          turn_order: 0
        })

      if (participantError) {
        console.error('참가자 추가 오류:', participantError)
        alert('방 생성에 실패했습니다.')
        return
      }

      console.log('방 생성 완료!', gameData)
      setGameId(gameData.id)
      setIsWaiting(true)
      
      // 게임 정보를 로컬 스토리지에 저장
      localStorage.setItem('currentGameCode', gameCode)
      localStorage.setItem('currentGameId', gameData.id.toString())
      
      // 초기 참가자 목록 가져오기
      await fetchParticipants()
      
    } catch (error) {
      console.error('게임 생성 중 오류:', error)
      alert('방 생성에 실패했습니다.')
    }
  }

  if (!currentUser) {
    return <div>로딩 중...</div>
  }

  return (
    <Container>
      <FormWrapper>
        <Title>FunGuess</Title>

        <Label>
          게임 이름
          <Input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="게임 이름을 입력하세요"
          />
        </Label>

        <Label>
          제시어 종류
          <Select
            value={keywordType}
            onChange={(e) => setKeywordType(e.target.value)}
          >
            <option value="" disabled hidden>제시어 종류를 선택하세요</option>
            {keywordOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        </Label>

        <Label>
          게임 코드
          <CodeRow>
            <CodeBox>{gameCode}</CodeBox>
            <CopyButton onClick={handleCopy} aria-label="게임 코드 복사">
              <MdContentCopy size={24} />
            </CopyButton>
            {copied && <CopiedText>복사됨!</CopiedText>}
          </CodeRow>
        </Label>

        <StartButton onClick={handleStart}>시작하기</StartButton>
      </FormWrapper>

      {/* 모달 */}
      {isWaiting && (
        <WaitingModal
          gameCode={gameCode}
          participants={participants}
          keyword={keyword}
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

const FormWrapper = styled.div`
  background: #1A1A1A;
  padding: 40px;
  border-radius: 20px;
  width: 420px;
  box-shadow: 0 8px 32px rgba(0, 208, 156, 0.10);
  border: 4px solid #00D09C;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const Title = styled.h1`
  color: #FAFAFA;
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 20px;
  letter-spacing: 1px;
  text-align: center;
  cursor: default;
`;

const Label = styled.label`
  color: #FAFAFA;
  display: flex;
  flex-direction: column;
  font-size: 18px;
  font-weight: 500;
  width: 100%;
`;

const Input = styled.input`
  height: 48px;
  line-height: 48px;
  margin-top: 10px;
  padding: 12px;
  font-size: 18px;
  border-radius: 8px;
  border: 2px solid #00D09C;
  background: #1A1A1A;
  color: #FAFAFA;
  outline: none;
  transition: border 0.3s;

  &::placeholder {
    color: #707070;
    font-size: 16px;
  }

  &:focus {
    border: 2px solid #AEEADB;
  }
`;

const Select = styled.select`
  height: 48px;
  margin-top: 10px;
  padding: 12px;
  font-size: ${props => props.value === '' ? '16px' : '18px'};
  border-radius: 8px;
  border: 2px solid #00D09C;
  background: #1A1A1A;
  color: ${props => props.value === '' ? '#707070' : '#FAFAFA'};
  outline: none;
  transition: border 0.3s;
  appearance: none;

  &::placeholder {
    color: #707070;
    font-size: 14px;
  }
    
  &:focus {
    border: 2px solid #7EE8CD;
  }

  option {
    background-color: #1A1A1A;
    color: #FAFAFA;
    font-size: 16px;
    padding: 10px;

    &:hover {
      background-color: #2A2A2A;
    }
  }
`;

const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
`;

const CodeBox = styled.div`
  background: #333333;
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #00D09C;
  font-size: 20px;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #00D09C;
  cursor: pointer;
  font-size: 22px;
  display: flex;
  align-items: center;
`;

const CopiedText = styled.span`
  font-size: 14px;
  color: #00D09C;
  margin-left: 4px;
`;

const StartButton = styled.button`
  background: linear-gradient(135deg, #00D09C 0%, #00FF88 100%);
  color: #1A1A1A;
  font-size: 22px;
  font-weight: 700;
  border-radius: 8px;
  border: none;
  padding: 14px 0;
  width: 100%;
  margin-top: 20px;
  box-shadow: 0 4px 16px rgba(0, 208, 156, 0.10);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: linear-gradient(135deg, #00C298 0%, #00FF88 100%);
    transform: translateY(-1px) scale(1.01);
  }
`;