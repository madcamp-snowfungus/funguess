// src/components/LoadingScreen.tsx
'use client'

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "게임을 준비하고 있습니다.." }) => {
  return (
    <Overlay
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Container
        as={motion.div}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      > 
        <LoadingWrapper>
          <Spinner />
          <LoadingText>{message}</LoadingText>
        </LoadingWrapper>
        
        <LoadingDots>
          <Dot />
          <Dot />
          <Dot />
        </LoadingDots>
      </Container>
    </Overlay>
  );
};

export default LoadingScreen;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #121212;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #FAFAFA;
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 6px solid #00D09C;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.9s linear infinite;
  margin-bottom: 20px;
`;

const LoadingText = styled.p`
  font-size: 18px;
  color: #ccc;
  margin: 0;
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 8px;
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  background-color: #00D09C;
  border-radius: 50%;
  animation: ${bounce} 1.4s ease-in-out infinite both;
  
  &:nth-child(1) {
    animation-delay: -0.32s;
  }
  
  &:nth-child(2) {
    animation-delay: -0.16s;
  }
  
  &:nth-child(3) {
    animation-delay: 0s;
  }
`;