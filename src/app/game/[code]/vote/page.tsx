// src/app/game/[code]/vote/page.tsx
'use client'

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Player {
    user_id: number;
    nickname: string;
    color: string;
}

const cardColors = ['#F26DAC', '#21D35D', '#4791FE', '#EDE42F'];

const VotePage = () => {
    const router = useRouter();
    const params = useParams();
    const code = params.code as string;

    const [players, setPlayers] = useState<Player[]>([]);
    const [gameId, setGameId] = useState<number | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const myId = Number(userInfo?.id);
            setUserId(myId);

            // 1. 게임 ID 조회
            const res = await supabase
                .from('games')
                .select('id')
                .eq('game_code', code)
                .single();
            
            const gameId = res.data?.id;
            setGameId(gameId);
            if (!gameId) return;

            // 2. 참가자 목록 조회
            const { data } = await supabase
                .from('game_participants')
                .select('user_id, turn_order, users:user_id(user_nickname)')
                .eq('game_id', gameId);

            console.log('투표 참가자', data);
            console.log('gameId:', gameId);

            if (data) {
                setPlayers(
                    data
                        .filter((p: any) => p.user_id !== myId)
                        .map((p: any) => ({
                            user_id: p.user_id,
                            nickname: p.users?.user_nickname || '알 수 없음',
                            color: cardColors[(p.turn_order ?? 0) % cardColors.length],
                        }))
                );
            }
        };

        fetchData();
    }, [code]);

    const handleVote = async (targetUserId: number) => {
        if (!gameId || !userId) return;

        const targetPlayer = players.find(p => p.user_id === targetUserId);

        const { error } = await supabase.from('votes').insert({
            game_id: gameId,
            voter_user_id: userId,
            target_user_id: targetUserId,
        });

        if (error) {
            alert('투표에 실패했습니다.');
        } else {
            alert(`${targetPlayer?.nickname || '알 수 없음'} 님에게 투표가 완료되었습니다.`);
            router.push(`/game/${code}/result`);
        }
    };

    return (
        <Wrapper>
            <Title>라이어를 선택해주세요!</Title>
            <CardWrapper>
                {players.map((player, idx) => (
                <Card key={idx} color={player.color} onClick={() => handleVote(player.user_id)}>
                    <PlayerName>{player.nickname}</PlayerName>
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