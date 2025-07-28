'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Header from '@/components/Header'
import AILoadingOverlay from '@/components/AILoadingOverlay'
import AIResultModal from '@/components/AIResultModal'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'

const cardColors = ['#F26DAC', '#21D35D', '#4791FE', '#EDE42F']

const Container = styled.div`
  height: 100vh;
  background: #1a1a1a;
  color: white;
  padding: 4.5vh 5vw;
`

const MainContent = styled.main`
  margin-top: 5vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledVideo = styled.video`
  width: 30vw;
  height: 35vh;
  border-radius: 10px;
  object-fit: cover;
  transform: scaleX(-1); /* 좌우 반전 */
`

const NicknameLabel = styled.div`
  margin-top: 8px;
  font-size: 18px;
  font-weight: 500;
  color: white;
`

const InputBox = styled.div`
  margin-top: 3vh;
  width: 70vw;
`

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 20px;
  border: none;
  font-size: 20px;
  font-weight: 500;
  background: none;
  text-align: center;
  color: #21D35D;

  &:focus {
    outline: none;
  }
`

const PlayerGrid = styled.div`
  margin-top: 7vh;
  display: flex;
  gap: 7.5vw;
`

const PlayerCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const PlayerCard = styled.div<{ $active?: boolean; color: string }>`
  background: ${({ color }) => color};
  padding: 20px;
  border-radius: 12px;
  width: 17vw;
  height: 20vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: ${({ $active }) => ($active ? '3px solid #fff' : 'none')};
`

const Dot = styled.span`
  display: inline-block;
  margin-right: 6px;
  width: 10px;
  height: 10px;
  background: #00ff88;
  border-radius: 50%;
  vertical-align: middle;
`

export default function GamePlayPage() {
  const params = useParams();
  const gameCode = params.code;

  const [gameId, setGameId] = useState<number | null>(null);
  const [time, setTime] = useState(90)
  const [message, setMessage] = useState('')
  const [participants, setParticipants] = useState<any[]>([])
  const [speakingIdx, setSpeakingIdx] = useState(0)
  const [showAILoading, setShowAILoading] = useState(false)
  const [showAIResult, setShowAIResult] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // 참가자 목록 불러오기
  const getParticipants = async (gameId: number) => {
    const { data , error } = await supabase
      .from('game_participants')
      .select(`*, users:user_id (user_nickname)`)
      .eq('game_id', gameId)
      .order('turn_order', { ascending: true });

    if (error) {
      console.error('참가자 목록 불러오기 실패:', error);
      return [];
    }
    return data;
  }

  useEffect(() => {
    // localStorage에서 gameId 읽기
    const storedId = localStorage.getItem('currentGameId');
    if (storedId) setGameId(Number(storedId));
  }, []);

  useEffect(() => {
    if (!gameId) return;
    getParticipants(gameId).then((data) => {
      setParticipants(data || [])
    })
  }, [gameId])

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        setMyUserId(parsed.id?.toString() ?? parsed.user_id?.toString() ?? null);
      } catch (e) {
        setMyUserId(null);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.error('웹캠 연결 오류:', err)
          alert('웹캠 접근 권한을 허용해주세요!')
        })
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }

  // 턴 넘기기 예시 함수 (버튼 등에서 호출)
  const nextTurn = () => {
    setSpeakingIdx((prev) => (prev + 1) % participants.length)
  }

  // 현재 말하는 유저
  const speakingUser = participants[speakingIdx]?.users?.user_nickname || ''

  return (
    <Container>
      <Header />

      <MainContent>
        <ProfileSection>
          <StyledVideo ref={videoRef} autoPlay playsInline muted />
          <NicknameLabel>나</NicknameLabel>
        </ProfileSection>

        <InputBox>
          <Input
            type="text"
            placeholder="Type something..."
            value={message}
            onChange={handleInputChange}
          />
        </InputBox>

        <PlayerGrid>
          {participants
            .filter((p) => p.user_id?.toString() !== myUserId)
            .map((p, idx) => {
              const isActive = speakingUser === p.users?.user_nickname;
              return (
                <PlayerCardWrapper key={p.id || idx}>
                  <PlayerCard
                    $active={isActive}
                    color={cardColors[idx % cardColors.length]}
                  />
                  <NicknameLabel>
                    {isActive && <Dot />} {p.users?.user_nickname}
                  </NicknameLabel>
                </PlayerCardWrapper>
              );
            })}
        </PlayerGrid>
        {/* 예시: 턴 넘기기 버튼 */}
        {/* <button onClick={nextTurn}>다음 턴</button> */}
      </MainContent>

      {showAILoading && <AILoadingOverlay speakerName={speakingUser} />}
      {showAIResult && (
        <AIResultModal
          speakerName={speakingUser}
          blinkCount={10}
          expression="당황한 표정"
          vagueness="모호한 발언"
          liarProbability={76}
          onClose={() => setShowAIResult(false)}
        />
      )}
    </Container>
  )
}