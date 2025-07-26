// src/app/login/page.tsx
'use client'

import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();

  return (
    <Wrapper>
      <Logo>FunGuess</Logo>
      <SubTitle>"가장 의심스러운 자를 찾아라"</SubTitle>

      <Label>아이디</Label>
      <Input type="text" placeholder="아이디를 입력하세요" />

      <Label>비밀번호</Label>
      <Input type="password" placeholder="비밀번호를 입력하세요" />

      <LoginButton>로그인</LoginButton>

      <OrContainer>
        <Line/>
        <OrText>또는</OrText>
        <Line/>
      </OrContainer>

      <KakaoButton>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
          <path d="M9 15.0021C13.9703 15.0021 18 11.6437 18 7.50103C18 3.35832 13.9703 0 9 0C4.02975 0 0 3.35832 0 7.50103C0 9.387 0.835875 11.1122 2.21625 12.4303C2.10713 13.519 1.74713 14.7127 1.34888 15.6086C1.26 15.8079 1.43213 16.0308 1.656 15.9965C4.194 15.6 5.70262 14.9913 6.3585 14.6742C7.22 14.8938 8.10818 15.004 9 15.0021Z" fill="#121212"/>
        </svg>
        카카오로 시작하기
      </KakaoButton>

      <Signup>
        계정이 없으신가요?
        <SignupText onClick={() => router.push('/signup')}>회원가입하기</SignupText>
      </Signup>
    </Wrapper>
  );
};

export default LoginPage;

const Wrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Logo = styled.p`
  color: #FAFAFA;
  font-size: 24px;
  font-weight: 700;
  cursor: default;
`;

const SubTitle = styled.p`
  color: #FFCCCC;
  font-size: 12px;
  margin-top: 8px;
  margin-bottom: 32px;
  cursor: default;
`;

const Label = styled.p`
  color: #FAFAFA;
  width: 240px;
  text-align: left;
  font-size: 12px;
  margin-bottom: 6px;
  cursor: default;
`;

const Input = styled.input`
  width: 240px;
  padding: 8px;
  border: 1px solid #FAFAFA;
  border-radius: 4px;
  background-color: #000;
  color: #fff;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;

  &::placeholder {
    color: #707070;
    font-size: 10px;
  }
`;

const LoginButton = styled.button`
  width: 240px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #FAFAFA;
  color: #121212;
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 8px;
  margin: 12px 0px;
  cursor: pointer;
  transition: filter 0.2s ease-in-out;

  &:hover {
    filter: brightness(0.8);
  }
`;

const OrContainer = styled.div`
  display: flex;
  align-items: center;
  width: 240px;
  gap: 12px;
  cursor: default;
`;

const Line = styled.div`
  flex: 1;
  height: 0.3px;
  background-color: #FAFAFA;
`;

const OrText = styled.p`
  color: #FAFAFA;
  font-size: 12px;
  font-weight: 300;
`;

const KakaoButton = styled.button`
  width: 240px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #FEE500;
  color: #121212;
  font-size: 10px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 8px;
  margin-top: 12px;
  cursor: pointer;
  transition: filter 0.2s ease-in-out;
  gap: 4px;

  &:hover {
    filter: brightness(0.8);
  }

  svg {
    width: 14px;
    height: 12px;
  }
`;

const Signup = styled.div`
  display: flex;
  flex-directino: row;
  justify-content: center;
  align-items: center;
  color: #FAFAFA;
  font-size: 10px;
  font-weight: 300;
  margin-top: 12px;
  gap: 12px;
  cursor: default;
`;

const SignupText = styled.div`
  color: #FAFAFA;
  font-size: 10px;
  font-weight: 400;
  text-decoration: underline;
  cursor: pointer;
`;