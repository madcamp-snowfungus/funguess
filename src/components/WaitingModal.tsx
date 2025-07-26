// components/WaitingModal.tsx
'use client'

import styled from 'styled-components'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface WaitingModalProps {
  roomCode: string
  participants: string[]
  onClose?: () => void
}

export default function WaitingModal({ roomCode, participants, onClose }: WaitingModalProps) {
  const router = useRouter()

  const handleStart = () => {
    if (participants.length >= 4) {
      router.push(`/room/${roomCode}`)
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
        <Divider />
        <List>
          {participants.map((name, idx) => (
            <li key={idx}>👤 {name}</li>
          ))}
        </List>
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
  margin-bottom: 16px;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #444;
  margin-bottom: 20px;
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  text-align: left;
  margin-bottom: 24px;
  li {
    margin-bottom: 8px;
    font-size: 16px;
  }
`

const StartButton = styled.button<{ disabled?: boolean }>`
  background: ${({ disabled }) =>
    disabled
      ? '#555'
      : 'linear-gradient(135deg, #00d09c, #4ee7c2)'};
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
        : 'linear-gradient(135deg, #00b88a, #3cc3a5)'};
  }
`
