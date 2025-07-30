// src/app/game/[code]/result/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import VoteResultModal from '../../../../components/VoteResultModal';
import FinalResultModal from '@/components/FinalResultModal';
import { useRouter, useParams } from 'next/navigation';

const players = [
    { name: '백서경', color: '#A8E5FF', votes: 1, emoji: '🍄' },
    { name: '하예영', color: '#FFF2AA', votes: 1, emoji: '🍄' },
    { name: '이연재', color: '#B5FFC3', votes: 0, emoji: '🍄' },
    { name: '백목이', color: '#F1CCFE', votes: 2, emoji: '🍄' },
];

const isLiarWin = true; // true: 시민들의 추리 실패, false: 시민들의 추리 성공
const liarNickname = '백목이'; // 라이어의 닉네임

const ResultPage = () => {
    const router = useRouter();
    const params = useParams();
    const code = params.code as string;
    const [showVoteResult, setShowVoteResult] = useState(false);
    const [showFinalResult, setShowFinalResult] = useState(false);

    // 3초 후 FinalResultModal 표시
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowVoteResult(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleNext = () => {
        if (isLiarWin) {
            // 시민 추측 실패 → 바로 최종 결과 모달 표시
            setShowVoteResult(false);
            setShowFinalResult(true);
        } else {
            // 시민 추측 성공 → 기존처럼 role에 따라 guess 페이지로 이동
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const role = userInfo.role || 'player';
            router.push(`/game/${code}/guess?role=${role}`);
        }
    };

    return (
        <Wrapper>
            <Title>투표 결과</Title>
            <Content>
                <GridLayout>
                    {players.map((p, i) => (
                        <PlayerWrapper key={i}>
                            <PlayerCard $bg={p.color} />
                            <PlayerName>{p.name}</PlayerName>
                            {p.votes > 0 && (
                                <VoteIcons>{Array(p.votes).fill(p.emoji || '🍄').join(' ')}</VoteIcons>
                            )}
                        </PlayerWrapper>
                    ))}
                </GridLayout>
            </Content>

            {/* 시민들의 추리 성공 or 실패 */}
            {showVoteResult && (
                <VoteResultModal
                    isLiarWin={isLiarWin}
                    liarNickname={liarNickname}
                    onNext={handleNext}
                />
            )}

            {/* 시민들의 추리 실패일 경우, 바로 라이어의 승리 모달이 뜸 */}
            {showFinalResult && (
                <FinalResultModal
                    isLiarWin={isLiarWin}
                    hideMessage={true}
                />
            )}
        </Wrapper>
    );
};

export default ResultPage;

const Wrapper = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const Title = styled.p`
    color: #FAFAFA;
    font-size: 40px;
    font-weight: 500;
    cursor: default;
    margin-bottom: 52px;
`;

const Content = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 60px;
    justify-content: center;
`;

const GridLayout = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 140px);
    gap: 40px;
`;

const PlayerCard = styled.div<{ $bg: string }>`
    width: 140px;
    height: 80px;
    background-color: ${({ $bg }) => $bg};
    border-radius: 6px;
`;

const PlayerWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const PlayerName = styled.p`
    font-weight: 500;
    font-size: 20px;
    margin-top: 8px;
`;

const VoteIcons = styled.p`
    margin-top: 6px;
    font-size: 16px;
`;