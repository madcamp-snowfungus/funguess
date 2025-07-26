// src/app/signup/page.tsx
'use client'

import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

const SignupPage = () => {
  const router = useRouter();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const isFormFilled = id && password && confirmPassword && nickname;

  const handleSignup = () => {
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    router.push('/login');
  };

  return (
    <Wrapper>
      <Logo>FunGuess</Logo>
      <SubTitle>"가장 의심스러운 자를 찾아라"</SubTitle>

      <Label>아이디</Label>
      <Input 
        type="text" 
        placeholder="아이디를 입력하세요" 
        value={id} 
        onChange={(e) => setId(e.target.value)}
      />

      <Label>비밀번호</Label>
      <Input 
        type="password" 
        placeholder="비밀번호를 입력하세요" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Label>비밀번호 확인</Label>
      <Input 
        type="password" 
        placeholder="비밀번호를 입력하세요" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Label>닉네임</Label>
      <Input 
        type="text" 
        placeholder="닉네임을 입력하세요" 
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <SignupButton onClick={handleSignup} disabled={!isFormFilled}>
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
  font-size: 40px;
  font-weight: 700;
  cursor: default;
`;

const SubTitle = styled.p`
  color: #FFCCCC;
  font-size: 18px;
  font-weight: 400;
  margin-top: 8px;
  margin-bottom: 32px;
  cursor: default;
`;

const Label = styled.p`
  color: #FAFAFA;
  width: 300px;
  text-align: left;
  font-size: 18px;
  margin-bottom: 8px;
  cursor: default;
`;

const Input = styled.input`
  width: 300px;
  padding: 12px;
  border: 1px solid #FAFAFA;
  border-radius: 4px;
  background-color: #121212;
  color: #FAFAFA;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;

  &::placeholder {
    color: #707070;
    font-size: 14px;
  }
`;

const SignupButton = styled.button<{ disabled?: boolean }>`
  width: 300px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ disabled }) => (disabled ? '#808080' : '#FAFAFA')};
  color: ${({ disabled }) => (disabled ? '#CCCCCC' : '#121212')};
  font-size: 16px;
  font-weight: ${({ disabled }) => (disabled ? '500' : '600')};
  border: none;
  border-radius: 4px;
  padding: 8px;
  margin: 12px 0px;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  transition: filter 0.2s ease-in-out;

  &:hover {
    filter: ${({ disabled }) => (disabled ? 'none' : 'brightness(0.8)')};
  }
`;