// src/app/game/[code]/result/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import FinalResultModal from '../../../../components/FinalResultModal';

const players = [
    { name: '백서경', color: '#A8E5FF', votes: 1, emoji: '🍄' },
    { name: '하예영', color: '#FFF2AA', votes: 1, emoji: '🍄' },
    { name: '이연재', color: '#B5FFC3', votes: 0, emoji: '🍄' },
    { name: '백목이', color: '#F1CCFE', votes: 2, emoji: '🍄' },
];

const aiChoice = {
    name: '백목이',
    color: '#F1CCFE',
    percent: 87,
    others: [
        { name: '백서경', color: '#A8E5FF', percent: 10 },
        { name: '하예영', color: '#FFF2AA', percent: 2 },
        { name: '이연재', color: '#B5FFC3', percent: 1 },
    ],
};

const isLiarWin = false; // true: 라이어 승리, false: 시민 승리
const liarNickname = '백목이'; // 라이어의 닉네임

const ResultPage = () => {
    const [showFinalResult, setShowFinalResult] = useState(false);

    // 3초 후 FinalResultModal 표시
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowFinalResult(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleCloseModal = () => {
        setShowFinalResult(false);
        console.log('게임 종료');
        // 게임 종료 후 메인페이지로 이동?
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

                <AIContainer>
                    <AITitle>AI의 선택</AITitle>
                    <AICard $bg={aiChoice.color} />
                    <AIName>{aiChoice.name}</AIName>
                    <AIPercent>{aiChoice.percent} %</AIPercent>

                    <AIOthers>
                        {aiChoice.others.map((p, i) => (
                            <AIPlayer key={i}>
                                <OthersContainer>
                                    <ColorDot $color={p.color} />
                                    {p.name}
                                </OthersContainer>
                                <span>{p.percent} %</span>
                            </AIPlayer>
                        ))}
                    </AIOthers>
                </AIContainer>
            </Content>

            {showFinalResult && (
                <FinalResultModal
                    isLiarWin={isLiarWin}
                    liarNickname={liarNickname}
                    onClose={handleCloseModal}
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

const AIContainer = styled.div`
    width: 320px;
    height: 340px;
    border: 1px solid #FAFAFA55;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const AITitle = styled.h3`
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
`;

const AICard = styled.div<{ $bg: string }>`
    width: 140px;
    height: 80px;
    background-color: ${({ $bg }) => $bg};
    border-radius: 8px;
    margin-bottom: 8px;
`;

const AIName = styled.p`
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 2px;
`;

const AIPercent = styled.p`
    font-size: 18px;
    font-weight: 400;
`;

const AIOthers = styled.div`
    width: 140px;
    margin-top: 20px;    
`;

const AIPlayer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 400;
    margin-bottom: 6px;
    color: #FAFAFA;
`;

const OthersContainer = styled.div`
    display: flex;
    align-items: center;
`;

const ColorDot = styled.div<{ $color: string }>`
    width: 14px;
    height: 14px;
    border-radius: 4px;
    background-color: ${({ $color }) => $color};
    margin-right: 10px;
`;