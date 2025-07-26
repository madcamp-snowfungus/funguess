// components/AILoadingOverlay.tsx
'use client'

import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'

interface AILoadingOverlayProps {
  speakerName: string
}

export default function AILoadingOverlay({ speakerName }: AILoadingOverlayProps) {
  return (
    <Overlay>
      <Spinner />
      <Message>{speakerName} 님의 발언을 AI가 분석중입니다 ...</Message>
    </Overlay>
  )
}

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 6px solid #00d09c;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.9s linear infinite;
  margin-bottom: 24px;
`

const Message = styled.div`
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  padding: 0 24px;
  line-height: 1.5;
`