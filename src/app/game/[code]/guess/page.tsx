// src/app/game/[code]/guess/page.tsx
'use client'

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import FinalResultModal from "@/components/FinalResultModal";

const GuessPage = () => {
    const searchParams = useSearchParams();
    const params = useParams();
    const gameCode = params.code as string;

    const role = searchParams.get('role');
    const isLiar = role === 'liar';
    const isPlayer = role === 'player';

    const [guess, setGuess] = useState('');
    const [answer, setAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isLiarWin, setIsLiarWin] = useState(false);

    // 1. liar만 keyword GET
    useEffect(() => {
        const fetchKeyword = async () => {
            const res = await fetch(`/api/keyword?gameCode=${gameCode}`);
            const data = await res.json();
            if (res.ok) setAnswer(data.keyword);
        };

        if (isLiar) fetchKeyword();
    }, [gameCode, isLiar]);

    // 2. liar가 제시어를 제출하면 API 호출로 결과 저장
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedGuess = guess.trim();
        const trimmedAnswer = answer.trim();
        const liarSucceeded = trimmedGuess !== '' && trimmedGuess === trimmedAnswer;

        setIsLiarWin(liarSucceeded);
        setShowResult(true);
        
        await fetch('/api/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameCode,
                isLiarWin: liarSucceeded
            })
        });
    };

    // 3. player는 Supabase로 실시간 결과 구독
    useEffect(() => {
        if (!isPlayer) return;

        const channel = supabase
            .channel(`game_end_${gameCode}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'games',
                filter: `game_code=eq.${gameCode}`,
            }, async (payload) => {
                const res = await fetch(`/api/status?gameCode=${gameCode}`);
                const { isLiarWin } = await res.json();

                setIsLiarWin(isLiarWin);
                setShowResult(true);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isPlayer, gameCode]);

    // 예외 처리
    if (!isLiar && !isPlayer) {
        return (
            <Overlay>
                <Message>잘못된 접근입니다.</Message>
            </Overlay>
        );
    }

    // liar : 제시어 추측 화면
    if (isLiar) {
        return (
            <CenterWrapper>
                <ModalCard>
                    <LiarTitle>라이어는 제시어를 추측해주세요.</LiarTitle>
                    <SubText>모두의 발언을 참고해서 정답을 맞혀보세요!</SubText>
                    <Form onSubmit={handleSubmit}>
                        <StyledInput
                            type="text"
                            value={guess}
                            onChange={e => setGuess(e.target.value)}
                            placeholder="제시어를 입력하세요."
                            maxLength={20}
                        />
                        <StyledButton type="submit" disabled={!guess.trim()}>
                            제출
                        </StyledButton>
                    </Form>
                </ModalCard>

                {showResult && <FinalResultModal isLiarWin={isLiarWin} />}
            </CenterWrapper>
        );
    }

    // player : 대기 화면
    if (isPlayer) {
        return showResult ? (
            <CenterWrapper>
                <FinalResultModal isLiarWin={isLiarWin} />
            </CenterWrapper>
        ) : (
            <Overlay>
                <Spinner />
                <Message>라이어가 제시어를 추측하는 중입니다 ...</Message>
            </Overlay>
        );
    }
};

export default GuessPage;

const CenterWrapper = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ModalCard = styled.div`
    background-color: #1F1F1F;
    border: 3px solid #00d09c;
    border-radius: 20px;
    padding: 40px 32px 32px 32px;
    margin: 20px;
    width: 520px;
    height: 280px;
    color: #FAFAFA;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const LiarTitle = styled.h2`
    color: #FAFAFA;
    font-size: 30px;
    font-weight: 600;
    margin-bottom: 12px;
`;

const SubText = styled.div`
    color: #5BB29C;
    font-size: 18px;
    margin-bottom: 40px;
`;

const Form = styled.form`
    display: flex;
    width: 90%;
    gap: 10px;
`;

const StyledInput = styled.input`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 2px solid #00d09c;
    color: #FAFAFA;
    background: #252525;
    outline: none;

    &::placeholder {
        color: #708F89;
    }
`;

const StyledButton = styled.button`
    font-size: 16px;
    padding: 12px 28px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #00ff88 0%, #00d09c 100%);
    color: #1F1F1F;
    font-weight: 600;
    cursor: pointer;

    &:hover:enabled {
        box-shadow: 2px 4px 8px rgba(0, 208, 156, 0.25);
        
    }

    &:disabled {
        background: #2E3A36;
        color: #B8E4DB;
        font-weight: 500;
        cursor: default;
        box-shadow: none;
    }
`;

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const spin = keyframes`
    to {
        transform: rotate(360deg);
    }
`;

const Spinner = styled.div`
    width: 60px;
    height: 60px;
    border: 6px solid #00d09c;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ${spin} 0.9s linear infinite;
`;

const Message = styled.div`
    font-size: 26px;
    font-weight: 500;
    text-align: center;
    margin-top: 40px;
`;