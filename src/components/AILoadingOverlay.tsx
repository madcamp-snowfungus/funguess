// components/AILoadingOverlay.tsx
'use client'

import styled, { keyframes } from 'styled-components'

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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
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
  width: 48px;
  height: 48px;
  border: 5px solid #00d09c;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`

const Message = styled.div`
  margin-top: 20px;
  font-size: 18px;
  font-weight: 500;
`
