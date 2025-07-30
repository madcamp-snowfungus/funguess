// src/app/game/[code]/reveal/page.tsx
'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import LoadingScreen from '@/components/LoadingScreen';

const RevealPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();

    const [role, setRole] = useState<string | null>(null); // 'liar' or 'player'
    const [keyword, setKeyword] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const code = params.code as string;

    useEffect(() => {
        const roleValue = searchParams.get('role');
        const keywordValueRaw = searchParams.get('keyword');
        const keywordValue = keywordValueRaw ? decodeURIComponent(keywordValueRaw) : null;

        console.log('RevealPage URL params:', {
            role: roleValue,
            keyword: keywordValue,
            fullURL: typeof window !== 'undefined' ? window.location.href : ''
        });

        if (!roleValue || !['liar', 'player'].includes(roleValue)) {
            alert('잘못된 접근입니다.');
            router.replace('/');
            return;
        }

        setRole(roleValue);
        setKeyword(keywordValue);
        
        setTimeout(() => {
            setIsLoading(false);
        }, 3000);
    }, [searchParams, router]);

    useEffect(() => {
        if (!role) return;

        const timer = setTimeout(() => {
            router.push(`/game/${code}/play`);
        }, 5000);

        return () => clearTimeout(timer);
    }, [router, code, role]);

    useEffect(() => {
        console.log('code:', code);
        console.log('role:', role);
    }, [role, code]);

    if (isLoading) {
        return <LoadingScreen message="역할을 확인하고 있습니다.." />;
    }

    return (
        <Wrapper>
            <Logo>FunGuess</Logo>

            <PostItWrapper>
                <PostIt src="/assets/post-it.png" />
                {role === 'liar' ? (
                    <LiarImage src="/assets/liar.png" />
                ) : role === 'player' && keyword ? (
                    <KeywordWrapper>
                        <KeywordTitle>제시어</KeywordTitle>
                        <KeywordText>{keyword}</KeywordText>
                    </KeywordWrapper>
                ) : (
                    <KeywordWrapper>
                        <KeywordTitle>로딩 중..</KeywordTitle>
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