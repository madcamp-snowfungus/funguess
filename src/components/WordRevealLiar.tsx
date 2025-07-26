// components/WordRevealLiar.tsx
'use client'

import styled from 'styled-components'
import Image from 'next/image'

export default function WordRevealLiar() {
  return (
    <Container>
      <Title>FunGuess</Title>
      <LiarSection>
        <LiarImage src="/assets/liar.png" width={180} height={180} alt="라이어 이미지" />
        <LiarText>당신은<br />라이어입니다!</LiarText>
      </LiarSection>
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

const LiarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const LiarImage = styled(Image)`
  border-radius: 12px;
`

const LiarText = styled.div`
  margin-top: 24px;
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  line-height: 1.4;
`
