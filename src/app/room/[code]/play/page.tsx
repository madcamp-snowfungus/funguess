'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Header from '@/components/Header'
import AILoadingOverlay from '@/components/AILoadingOverlay'
import AIResultModal from '@/components/AIResultModal'

export default function GamePlayPage() {
  const [time, setTime] = useState(90)
  const [message, setMessage] = useState('')
  const [speakingUser, setSpeakingUser] = useState('닉네임') // 예시 이름
  const [showAILoading, setShowAILoading] = useState(false)
  const [showAIResult, setShowAIResult] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const participants = ['유저1', '유저2', '유저3'] // 실제 데이터로 대체 예정

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
          {participants.map((name, idx) => {
            const isActive = speakingUser === name
            return (
              <PlayerCardWrapper key={idx}>
                <PlayerCard
                  $active={isActive}
                  color={cardColors[idx % cardColors.length]}
                />
                <NicknameLabel>
                  {isActive && <Dot />} {name}
                </NicknameLabel>
              </PlayerCardWrapper>
            )
          })}
        </PlayerGrid>
      </MainContent>

      {showAILoading && <AILoadingOverlay speakerName={speakingUser} />}
      {showAIResult && (
        <AIResultModal
          liarName="서경"
          word="카메라"
          onClose={() => setShowAIResult(false)}
        />
      )}
    </Container>
  )
}

const cardColors = ['#FF6B6B', '#FFD93D', '#00E5FF']

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
  color: #0cd49c;

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
