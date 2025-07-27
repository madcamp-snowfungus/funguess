'use client'

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { MdContentCopy } from 'react-icons/md'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import WaitingModal from '@/components/WaitingModal'

export default function CreateGamePage() {
  const [gameName, setGameName] = useState('')
  const [keywordType, setKeywordType] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [gameId, setGameId] = useState<number | null>(null)
  const router = useRouter()

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

      // 4명이 모이면 라이어 선택
      if (participantsList.length === 4) {
        console.log('4명이 모였습니다. 라이어 선택 시작')
        await selectLiar()
      }
    } catch (error) {
      console.error('참가자 목록 가져오기 중 오류:', error)
    }
  }

  // 라이어 선택
  const selectLiar = async () => {
    if (!gameId) return

    // 참가자 중 랜덤으로 라이어 선택
    const randomIndex = Math.floor(Math.random() * participants.length)
    const liar = participants[randomIndex]

    // 게임에 라이어 설정 (user_id 사용)
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        liar_user_id: liar.user_id, // 참가자 ID가 아닌 사용자 ID 사용
        status: 'playing'
      })
      .eq('id', gameId)

    if (gameError) {
      console.error('라이어 설정 오류:', gameError)
      return
    }

    // 게임 시작 페이지로 이동
    router.push(`/game/${gameCode}/play`)
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
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          host_user_id: currentUser.id,
          keyword_type: keywordType,
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
          게임 이름 :
          <Input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="게임 이름을 입력하세요"
          />
        </Label>

        <Label>
          제시어 종류 :
          <Select
            value={keywordType}
            onChange={(e) => setKeywordType(e.target.value)}
          >
            <option value="">제시어 종류를 선택하세요</option>
            {keywordOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        </Label>

        <Label>
          게임 코드 :
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

      {/* ✅ 모달 */}
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
  justify-content: center;
  align-items: center;
  background: #2d2d2d;
  color: white;
  height: 100vh;
`

const FormWrapper = styled.div`
  background: #111;
  padding: 30px;
  border-radius: 12px;
  width: 25vw;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Title = styled.h1`
  text-align: center;
  font-size: 36px;
`

const Label = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 14px;
`

const Input = styled.input`
  margin-top: 6px;
  padding: 10px;
  font-size: 20px;
  border-radius: 5px;
  border: none;
`

const Select = styled.select`
  margin-top: 6px;
  padding: 10px;
  font-size: 20px;
  border-radius: 5px;
  border: none;
  background-color: white;
  color: black;
`

const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
`

const CodeBox = styled.div`
  background: #333;
  padding: 8px 14px;
  border-radius: 5px;
  font-weight: bold;
  letter-spacing: 1px;
`

const CopyButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
`

const CopiedText = styled.span`
  font-size: 12px;
  color: #00d09c;
`

const StartButton = styled.button`
  background: #00d09c;
  color: black;
  padding: 12px;
  font-size: 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #00b88a;
  }
`

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
`

const ModalContent = styled.div`
  background: #222;
  color: white;
  padding: 30px;
  border-radius: 10px;
  width: 350px;
  text-align: center;
  box-shadow: 0 0 10px #000;
`
