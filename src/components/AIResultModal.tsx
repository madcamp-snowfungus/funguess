// components/AIResultModal.tsx
'use client'

import styled from 'styled-components'

interface AIResultModalProps {
  liarName: string
  word: string
  onClose: () => void
}

export default function AIResultModal({ liarName, word, onClose }: AIResultModalProps) {
  return (
    <ModalOverlay>
      <ModalContent>
        <Title>AI 판정 결과</Title>
        <Text>
          <Highlight>{liarName}</Highlight>
          님이 라이어입니다
        </Text>
        <WordText>✨ 제시어는 <strong>{word}</strong> ✨</WordText>
        <CloseButton onClick={onClose}>확인</CloseButton>
      </ModalContent>
    </ModalOverlay>
  )
}

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: #222;
  color: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  width: 80%;
`

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
`

const Text = styled.div`
  font-size: 20px;
  margin-bottom: 12px;
`

const Highlight = styled.span`
  font-weight: bold;
  color: #00e5ff;
`

const WordText = styled.div`
  font-size: 18px;
  margin-bottom: 24px;
`

const CloseButton = styled.button`
  background: #00d09c;
  color: black;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  &:hover {
    background: #00b88a;
  }
`
