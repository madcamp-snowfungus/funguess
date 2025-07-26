// src/app/signup/page.tsx
'use client'

import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

const SignupPage = () => {
  const router = useRouter();

  return (
    <Wrapper>
      <Logo>FunGuess</Logo>
      <SubTitle>"가장 의심스러운 자를 찾아라"</SubTitle>

      <Label>아이디</Label>
      <Input type="text" placeholder="아이디를 입력하세요" />

      <Label>비밀번호</Label>
      <Input type="password" placeholder="비밀번호를 입력하세요" />

      <Label>비밀번호 확인</Label>
      <Input type="password" placeholder="비밀번호를 입력하세요" />

      <Label>닉네임</Label>
      <Input type="text" placeholder="닉네임을 입력하세요" />

      <SignupButton onClick={() => router.push('/login')}>
        회원가입
      </SignupButton>
    </Wrapper>
  );
};

export default SignupPage;

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

const SignupButton = styled.button`
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