'use client'

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { MdContentCopy } from 'react-icons/md'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import WaitingModal from '@/components/WaitingModal'

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState('')
  const [keywordType, setKeywordType] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const router = useRouter()

  const keywordOptions = [
    '일상 단어',
    '직업',
    '영화 제목',
    '음식',
    '동물',
    '3분반 사람들',
  ]

  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)
  }, [])

  const handleCopy = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {
        alert('복사에 실패했습니다.')
      })
    } else {
      const tempInput = document.createElement('input')
      tempInput.value = roomCode
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand('copy')
      document.body.removeChild(tempInput)

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStart = async () => {
    if (!roomName || !keywordType || !roomCode) {
      alert('모든 항목을 입력해주세요.')
      return
    }

    const { data, error } = await supabase.from('rooms').insert({
      room_name: roomName,
      keyword_type: keywordType,
      room_code: roomCode,
    })

    if (error) {
      console.error(error)
      alert('방 생성에 실패했습니다.')
      return
    }

    console.log('방 생성 완료!', data)
    setIsWaiting(true)
    setParticipants(['방장(나)']) // ✅ 나중에 실시간 추가
  }

  return (
    <Container>
      <FormWrapper>
        <Title>FunGuess</Title>

        <Label>
          방 이름 :
          <Input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </Label>

        <Label>
          제시어 종류 :
          <Select
            value={keywordType}
            onChange={(e) => setKeywordType(e.target.value)}
          >
            <option value="">제시어 종류를 선택하세요</option>
            {keywordOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        </Label>

        <Label>
          방 코드 :
          <CodeRow>
            <CodeBox>{roomCode}</CodeBox>
            <CopyButton onClick={handleCopy} aria-label="방 코드 복사">
              <MdContentCopy size={24} />
            </CopyButton>
            {copied && <CopiedText>복사됨!</CopiedText>}
          </CodeRow>
        </Label>

        <StartButton onClick={handleStart}>시작하기</StartButton>
      </FormWrapper>

      {/* ✅ 모달 */}
      {isWaiting && (
        <WaitingModal
          roomCode={roomCode}
          participants={participants}
          onClose={() => setIsWaiting(false)}
        />
      )}
    </Container>
  )
}

const Container = styled.main`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #2d2d2d;
  color: white;
  height: 100vh;
`

const FormWrapper = styled.div`
  background: #111;
  padding: 30px;
  border-radius: 12px;
  width: 25vw;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Title = styled.h1`
  text-align: center;
  font-size: 36px;
`

const Label = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 14px;
`

const Input = styled.input`
  margin-top: 6px;
  padding: 10px;
  font-size: 20px;
  border-radius: 5px;
  border: none;
`

const Select = styled.select`
  margin-top: 6px;
  padding: 10px;
  font-size: 20px;
  border-radius: 5px;
  border: none;
  background-color: white;
  color: black;
`

const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
`

const CodeBox = styled.div`
  background: #333;
  padding: 8px 14px;
  border-radius: 5px;
  font-weight: bold;
  letter-spacing: 1px;
`

const CopyButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
`

const CopiedText = styled.span`
  font-size: 12px;
  color: #00d09c;
`

const StartButton = styled.button`
  background: #00d09c;
  color: black;
  padding: 12px;
  font-size: 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #00b88a;
  }
`

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`

const ModalContent = styled.div`
  background: #222;
  color: white;
  padding: 30px;
  border-radius: 10px;
  width: 350px;
  text-align: center;
  box-shadow: 0 0 10px #000;
`
