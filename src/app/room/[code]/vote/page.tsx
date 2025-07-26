// src/app/room/[code]/vote/page.tsx
'use client'

import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

const players = [
    { name: '백서경', color: '#A8E5FF' },
    { name: '하예영', color: '#FFF2AA' },
    { name: '이연재', color: '#B5FFC3' },
];

const VotePage = () => {
    const router = useRouter();
    const params = useParams();
    const code = params.code;

    const handleVote = (playerName: string) => {
        alert(`${playerName} 님에게 투표했습니다.`);
        router.push(`/room/${code}/result`);
    };

    return (
        <Wrapper>
            <Title>라이어를 선택해주세요!</Title>
            <CardWrapper>
                {players.map((player, idx) => (
                <Card key={idx} color={player.color} onClick={() => handleVote(player.name)}>
                    <PlayerName>{player.name}</PlayerName>
                </Card>
                ))}
            </CardWrapper>
        </Wrapper>
    );
};

export default VotePage;

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

const CardWrapper = styled.div`
    display: flex;
    gap: 60px;
`;

const Card = styled.div<{ color: string }>`
    width: 160px;
    height: 80px;
    background-color: ${({ color }) => color};
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;

    &:hover {
        transform: scale(1.03);
    }
`;

const PlayerName = styled.p`
    color: #121212;
    font-size: 26px;
    font-weight: 600;
`;