// src/app/game/[code]/result/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import VoteResultModal from '../../../../components/VoteResultModal';
import FinalResultModal from '@/components/FinalResultModal';
import { useRouter, useParams } from 'next/navigation';

interface Player {
    userId: number;
    nickname: string;
    turnOrder: number;
    votes: number;
    role: string;
    color: string;
    emoji: string;
}

const cardColors = ['#F26DAC', '#21D35D', '#4791FE', '#EDE42F'];

const ResultPage = () => {
    const router = useRouter();
    const params = useParams();
    const code = params.code as string;

    const [players, setPlayers] = useState<Player[]>([]);
    const [isLiarWin, setIsLiarWin] = useState(false);
    const [liarNickname, setLiarNickname] = useState('');
    const [showVoteResult, setShowVoteResult] = useState(false);
    const [showFinalResult, setShowFinalResult] = useState(false);

    useEffect(() => {
        const fetchVoteResult = async () => {
            try {
                const res = await fetch('/api/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameCode: code }),
                });

                const result = await res.json();

                if (!res.ok) {
                    console.error(result.error || '투표 결과 불러오기 실패');
                    return;
                }

                const processedPlayers: Player[] = result.players.map((p: any) => ({
                    userId: p.userId,
                    nickname: p.nickname,
                    turnOrder: p.turnOrder,
                    votes: p.votes,
                    role: p.role,
                    color: cardColors[p.turnOrder % cardColors.length],
                    emoji: '🍄',
                }));

                setPlayers(processedPlayers);
                setLiarNickname(result.liarNickname);
                setIsLiarWin(result.isLiarWin);
            } catch (e) {
                console.error('투표 결과 불러오기 중 에러:', e);
            }
        };

        fetchVoteResult();

        // 시민 추리 성공 or 실패 모달 출력 시간
        const timer = setTimeout(() => {
            setShowVoteResult(true);
        }, 8000);

        return () => clearTimeout(timer);
    }, [code]);

    const handleNext = () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const role = userInfo.role || 'player';

        if (isLiarWin) {
            // 시민 추리 실패 → 바로 최종 결과 모달 표시
            setShowVoteResult(false);
            setShowFinalResult(true);
        } else {
            // 시민 추리 성공 → role에 따라 guess 페이지로 이동
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
                            <PlayerName>{p.nickname}</PlayerName>
                            {p.votes > 0 && (
                                <VoteIcons>{Array(p.votes).fill(p.emoji).join(' ')}</VoteIcons>
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