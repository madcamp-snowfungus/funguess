// components/FinalResultModal.tsx
'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'

interface FinalResultModalProps {
  isLiarWin: boolean
  liarNickname: string
  onClose: () => void
}

export default function FinalResultModal({
  isLiarWin,
  liarNickname,
  onClose,
}: FinalResultModalProps) {
  return (
    <Overlay onClick={onClose}>
      <ModalContainer
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ResultIcon>
          <img
            src={isLiarWin ? '/assets/liar.png' : '/assets/liar_black.png'}
            alt={isLiarWin ? '라이어' : '시민'}
            width={120}
          />
        </ResultIcon>
        
        <Title>
          {isLiarWin ? '라이어의 승리!' : '시민의 승리!'}
        </Title>
        
        <Message>
          {isLiarWin 
            ? `라이어는 ${liarNickname}!` 
            : '라이어를 찾아냈습니다!'
          }
        </Message>

        <SubMessage>
          {isLiarWin 
            ? '라이어가 성공적으로 숨어있었습니다!' 
            : '모든 시민이 협력하여 라이어를 찾아냈습니다!'
          }
        </SubMessage>

        <CloseButton onClick={onClose}>
          게임 종료
        </CloseButton>
      </ModalContainer>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ModalContainer = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 3px solid #00d09c;
  border-radius: 20px;
  padding: 40px;
  width: 400px;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
`

const ResultIcon = styled.div`
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
`

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #FAFAFA;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`

const Message = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #00d09c;
`

const SubMessage = styled.p`
  font-size: 16px;
  color: #CCCCCC;
  margin-bottom: 32px;
  line-height: 1.5;
`

const CloseButton = styled.button`
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d09c 0%, #00ff88 100%);
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 208, 156, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 208, 156, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
` 