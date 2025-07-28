// components/WaitingModal.tsx
'use client'

import styled from 'styled-components'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Participant {
  id: number
  user_id: number
  nickname: string
  isHost: boolean
  role: string
  joinedAt: string
}

interface WaitingModalProps {
  gameCode: string
  participants: Participant[]
  onClose?: () => void
}

export default function WaitingModal({ gameCode, participants, onClose }: WaitingModalProps) {
  const router = useRouter()

  const handleStart = () => {
    if (participants.length >= 4) {
      router.push(`/game/${gameCode}/play`)
      if (onClose) onClose()
    }
  }

  const isDisabled = participants.length < 4

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
      // : 'linear-gradient(135deg, #00d09c, #4ee7c2)'};
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
        // : 'linear-gradient(135deg, #00b88a, #3cc3a5)'};
        : 'linear-gradient(135deg, #21D35D, rgb(23, 202, 83))'};
  }
`
