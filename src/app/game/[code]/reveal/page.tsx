// src/app/game/[code]/reveal/page.tsx
'use client'

import React, { useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styled from 'styled-components';

const RevealPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();

    const role = searchParams.get('role'); // 'liar' or 'player'
    const code = params.code;
    const keyword = '백목이';

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push(`/game/${code}/play`);
        }, 5000);
        return () => clearTimeout(timer);
    }, [router, code]);

    return (
        <Wrapper>
            <Logo>FunGuess</Logo>

            <PostItWrapper>
                <PostIt src="/assets/post-it.png" />
                {role === 'liar' ? (
                    <LiarImage src="/assets/liar.png" />
                ) : (
                    <KeywordWrapper>
                        <KeywordTitle>제시어</KeywordTitle>
                        <KeywordText>{keyword}</KeywordText>
                    </KeywordWrapper>
                )}
            </PostItWrapper>

            {role === 'liar' && (
                <LiarText>당신은 라이어입니다!</LiarText>
            )}
        </Wrapper>
    );
};

export default RevealPage;

const Wrapper = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const Logo = styled.p`
    color: #FAFAFA;
    font-size: 32px;
    font-weight: 700;
    cursor: default;
`;

const PostItWrapper = styled.div`
    position: relative;
    width: 380px;
    height: 380px;
    margin-top: 40px;
`;

const PostIt = styled.img`
    width: 100%;
    height: 100%;
`;

const LiarImage = styled.img`
    position: absolute;
    top: 50%;
    left: 50%;
    width: 160px;
    transform: translate(-50%, -50%);
`;

const KeywordWrapper = styled.div`
    position: absolute;
    top: 100px;
    left: 0;
    width: 100%;
    text-align: center;
`;

const KeywordTitle = styled.p`
    font-size: 28px;
    font-weight: 600;
    color: #121212;
`;

const KeywordText = styled.p`
    font-size: 36px;
    font-weight: 600;
    color: #121212;
    margin-top: 40px;
    text-decoration: underline;
`;

const LiarText = styled.p`
    font-size: 24px;
    font-weight: 600;
    color: #FAFAFA;
    margin-top: 20px;
`;