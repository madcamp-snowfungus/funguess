// src/components/VoteResultModal.tsx
'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'

interface VoteResultModalProps {
  isLiarWin: boolean
  liarNickname: string
  onNext: () => void
}

export default function VoteResultModal({
  isLiarWin,
  liarNickname,
  onNext
}: VoteResultModalProps) {
  return (
    <Overlay>
      <ModalContainer
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ResultIcon>
          <img
            src={isLiarWin ? '/assets/liar.png' : '/assets/liar_out.png'}
            alt={isLiarWin ? '라이어' : '시민'}
            width={140}
          />
        </ResultIcon>
        
        <Title>
          {isLiarWin ? '시민들의 추리 실패' : '시민들의 추리 성공'}
        </Title>
        
        <Message>
          {isLiarWin 
            ? `라이어는 '${liarNickname}' 입니다.` 
            : `라이어 '${liarNickname}' 를 찾아냈습니다!`
          }
        </Message>

        <NextButton onClick={onNext}>
          다음
        </NextButton>
      </ModalContainer>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 3px solid #00d09c;
  border-radius: 20px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
`;

const ResultIcon = styled.div`
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
`;

const Title = styled.h1`
  color: #FAFAFA;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: default;
`;

const Message = styled.h2`
  color: #00D09C;
  font-size: 22px;
  font-weight: 500;
  margin-bottom: 40px;
  cursor: default;
`;

const NextButton = styled.button`
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
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 208, 156, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;