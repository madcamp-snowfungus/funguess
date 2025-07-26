'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styled from 'styled-components'

export default function RoomPage() {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleCreateRoom = () => {
    router.push('/room/create')
  }

  const handleJoinRoom = () => {
    if (code.trim()) {
      router.push(`/room/join?code=${code}`)
    }
  }

  return (
    <Container>
      <Title>FunGuess</Title>
      <ButtonWrapper>
        <CreateButton onClick={handleCreateRoom}>
          새로운 게임 시작하기
        </CreateButton>
        <JoinBox>
          <JoinText>참여 코드로 입장하기</JoinText>
          <Input
            placeholder="코드를 입력하세요"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        <JoinButton onClick={handleJoinRoom}>입장하기</JoinButton>
          
        </JoinBox>
      </ButtonWrapper>
    </Container>
  )
}

const Container = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #111;
  color: white;
`

const Title = styled.h1`
  font-size: 50px;
  font-weight: bold;
  margin-bottom: 5vh;
`

const ButtonWrapper = styled.div`
  display: flex;
  gap: 5vw;
`

const CreateButton = styled.button`
  background-color: #4ee7c2;
  width: 25vw;
  height: 30vh;
  padding: 40px;
  font-size: 36px;
  font-weight: bold;
  color: black;
  border-radius: 16px;
  cursor: pointer;
  border: none;

  &:hover {
    background-color: #3cc3a5;
  }
`

const JoinBox = styled.div`
  background-color: #635bff;
  width: 25vw;
  height: 30vh;
  padding: 3vw;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`

const JoinText = styled.span`
  margin-bottom: 12px;
  font-size: 36px;
  font-weight: bold;
`

const Input = styled.input`
  width: 15vw;
  padding: 1vh;
  border: 1px solid #FAFAFA;
  border-radius: 4px;
  background-color: #000;
  color: #fff;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;

  &::placeholder {
    color: #707070;
    font-size: 12px;
  }
`

const JoinButton = styled.button`
  margin-top: 16px;
  width: 15vw;
  padding: 10px 0;
  background-color: #ffffff;
  color: #635bff;
  font-weight: bold;
  font-size: 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e8e8e8;
  }
`
