// src/components/FinalResultModal.tsx
'use client'

import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface FinalResultModalProps {
    isLiarWin: boolean;
    hideMessage?: boolean;
}

export default function FinalResultModal({ 
    isLiarWin,
    hideMessage = false,
}: FinalResultModalProps) {
    const router = useRouter();

    const handleClose = () => {
        router.push('/game');
    };

    return (
        <Overlay>
            <ModalContainer
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                as={motion.div}
            >
                <Title>{isLiarWin ? '라이어의 승리' : '시민들의 승리'}</Title>

                {/* 시민들의 추리 실패일 경우 Message 뜨지 않음 */}
                {!hideMessage && (
                    <Message>
                        {isLiarWin
                        ? '라이어가 제시어를 맞혔습니다!'
                        : '라이어가 제시어를 맞히지 못했습니다!'}
                    </Message>
                )}
                <CloseButton onClick={handleClose}>게임 종료</CloseButton>
            </ModalContainer>
        </Overlay>
    );
}

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
`;

const ModalContainer = styled(motion.div)`
    width: 420px;
    height: 280px;
    padding: 52px 30px;
    border-radius: 20px;
    background: #1A1A1A;
    border: 4px solid #00D09C;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
`;

const Title = styled.h2`
    color: #00D09C;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 18px;
    cursor: default;
`;

const Message = styled.div`
    color: #FAFAFA;
    font-size: 20px;
    cursor: default;
`;

const CloseButton = styled.button`
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 12px;
    color: #1A1A1A;
    background: linear-gradient(135deg, #00D09C 0%, #00FF88 100%);
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 208, 156, 0.3);
    margin-top: 40px;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0, 208, 156, 0.4);
    }

    &:active {
        transform: translateY(0);
    }
`;