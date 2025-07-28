// src/components/WordRevealNormal.tsx
'use client'

import styled from 'styled-components'
import Image from 'next/image'

interface WordRevealNormalProps {
  word: string
  targetUser: string
}

export default function WordRevealNormal({ word, targetUser }: WordRevealNormalProps) {
  return (
    <Container>
      <Title>FunGuess</Title>
      <Card>
        <PinImage src="/assets/pin.png" width={32} height={32} alt="핀" />
        <Word>제시어</Word>
        <WordBox>{word}</WordBox>
      </Card>
    </Container>
  )
}

const Container = styled.div`
  background: #111;
  color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 40px;
`

const Card = styled.div`
  width: 15vw;
  background: #5c6ef8;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  position: relative;
`

const PinImage = styled(Image)`
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
`

const Word = styled.div`
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 16px;
`

const WordBox = styled.div`
  background: white;
  color: black;
  padding: 8px 20px;
  border-radius: 12px;
  font-weight: bold;
  display: inline-block;
`
