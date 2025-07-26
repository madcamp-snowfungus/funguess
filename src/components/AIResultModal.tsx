// components/AIResultModal.tsx
'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'

interface AIResultModalProps {
  speakerName: string
  blinkCount: number
  expression: string
  vagueness: string
  liarProbability: number
  onClose: () => void
}

export default function AIResultModal({
  speakerName,
  blinkCount,
  expression,
  vagueness,
  liarProbability,
  onClose,
}: AIResultModalProps) {
  return (
    <Overlay onClick={onClose}>
      <ModalContainer
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Title>{speakerName} 님의 라이어 확률</Title>
        <Probability>{liarProbability}%</Probability>
        <Divider />
        <Info><Icon>👀</Icon> 눈 깜빡임 <Value>{blinkCount}회</Value></Info>
        <Info><Icon>😬</Icon> 표정 <Value>{expression}</Value></Info>
        <Info><Icon>💬</Icon> 발언 <Value>{vagueness}</Value></Info>
        <CloseButton onClick={onClose}>닫기</CloseButton>
      </ModalContainer>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ModalContainer = styled(motion.div)`
  background: #1a1a1a;
  border: 2px solid #00d09c;
  border-radius: 16px;
  padding: 32px;
  width: 360px;
  color: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
`

const Title = styled.h2`
  font-size: 20px;
  text-align: center;
  margin-bottom: 8px;
`

const Probability = styled.div`
  font-size: 42px;
  font-weight: bold;
  color: #00ff88;
  text-align: center;
  margin-bottom: 16px;
`

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: #444;
  margin: 16px 0;
`

const Info = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0;
  font-size: 18px;
`

const Icon = styled.span`
  font-size: 20px;
  margin-right: 10px;
`

const Value = styled.span`
  margin-left: auto;
  color: #00d09c;
  font-weight: 600;
`

const CloseButton = styled.button`
  margin-top: 24px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #00d09c;
  color: black;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #00c298;
  }
`
