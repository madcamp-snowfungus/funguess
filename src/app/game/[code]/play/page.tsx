'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Header from '@/components/Header'
import AILoadingOverlay from '@/components/AILoadingOverlay'
import AIResultModal from '@/components/AIResultModal'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

const cardColors = ['#F26DAC', '#21D35D', '#4791FE', '#EDE42F']

const Container = styled.div`
  height: 100vh;
  background: #1a1a1a;
  color: white;
  padding: 4.5vh 5vw;
`

const MainContent = styled.main`
  margin-top: 5vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledVideo = styled.video`
  width: 30vw;
  height: 35vh;
  border-radius: 10px;
  object-fit: cover;
  transform: scaleX(-1); /* 좌우 반전 */
`

const NicknameLabel = styled.div`
  margin-top: 8px;
  font-size: 18px;
  font-weight: 500;
  color: white;
`

const InputBox = styled.div`
  margin-top: 3vh;
  width: 70vw;
`

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 20px;
  border: none;
  font-size: 20px;
  font-weight: 500;
  background: none;
  text-align: center;
  color: #21D35D;

  &:focus {
    outline: none;
  }
`

const PlayerGrid = styled.div`
  margin-top: 7vh;
  display: flex;
  gap: 7.5vw;
`

const PlayerCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const PlayerCard = styled.div<{ $active?: boolean; color: string }>`
  background: ${({ color }) => color};
  padding: 20px;
  border-radius: 12px;
  width: 17vw;
  height: 20vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: ${({ $active }) => ($active ? '3px solid #fff' : 'none')};
`

const Dot = styled.span`
  display: inline-block;
  margin-right: 6px;
  width: 10px;
  height: 10px;
  background: #00ff88;
  border-radius: 50%;
  vertical-align: middle;
`

export default function GamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const gameCode = params.code;

  const [gameId, setGameId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // Turn state
  const [currentTurn, setCurrentTurn] = useState(0); // 0~7
  const [turnTimer, setTurnTimer] = useState(15);
  const [turnInProgress, setTurnInProgress] = useState(true);
  const [showAILoading, setShowAILoading] = useState(false);
  const [showAIResult, setShowAIResult] = useState(false);
  const [message, setMessage] = useState('');
  const [turnsCount, setTurnsCount] = useState(0); // for progress
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 참가자 목록 불러오기
  const getParticipants = async (gameId: number) => {
    const { data , error } = await supabase
      .from('game_participants')
      .select(`*, users:user_id (user_nickname)`)
      .eq('game_id', gameId)
      .order('turn_order', { ascending: true });
    if (error) {
      console.error('참가자 목록 불러오기 실패:', error);
      return [];
    }
    return data;
  }

  // turns 테이블 row 개수 fetch
  const fetchTurnsCount = async (gameId: number) => {
    const { count, error } = await supabase
      .from('turns')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);
    if (error) return 0;
    return count || 0;
  }

  // 현재 턴의 발언자
  const getCurrentSpeakerIdx = () => currentTurn % participants.length;
  const speakingIdx = getCurrentSpeakerIdx();
  const speakingUser = participants[speakingIdx]?.users?.user_nickname || '';
  const speakingUserId = participants[speakingIdx]?.user_id?.toString();
  const isMyTurn = myUserId && speakingUserId === myUserId;

  // 참가자, 내 정보, 턴 개수 초기화
  useEffect(() => {
    const storedId = localStorage.getItem('currentGameId');
    if (storedId) setGameId(Number(storedId));
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        setMyUserId(parsed.id?.toString() ?? parsed.user_id?.toString() ?? null);
      } catch (e) { setMyUserId(null); }
    }
  }, []);

  useEffect(() => {
    if (!gameId) return;
    getParticipants(gameId).then((data) => setParticipants(data || []));
    fetchTurnsCount(gameId).then(setTurnsCount);
  }, [gameId]);

  // 턴 타이머
  useEffect(() => {
    if (!turnInProgress) return;
    if (turnTimer === 0) {
      handleTurnEnd();
      return;
    }
    const timer = setInterval(() => {
      setTurnTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [turnInProgress, turnTimer]);

  // 웹캠
  useEffect(() => {
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.error('웹캠 연결 오류:', err)
          alert('웹캠 접근 권한을 허용해주세요!')
        })
    }
  }, []);

  // 턴 종료 핸들러
  const handleTurnEnd = async () => {
    setTurnInProgress(false);
    // DB에 turns row 추가
    if (gameId && speakingUserId && isMyTurn) {
      await supabase.from('turns').insert({
        game_id: gameId,
        turn_number: currentTurn,
        turn_user_id: speakingUserId,
        transcript: message,
        // face_analysis_data, voice_analysis_data 등은 추후 추가
        finished_at: new Date().toISOString(),
      });
    }
    setTurnsCount((prev) => prev + 1);
    // AI 분석 모달: 발언자 제외 모두에게 표시
    if (!isMyTurn) {
      setShowAILoading(true);
      setTimeout(() => {
        setShowAILoading(false);
        setShowAIResult(true);
      }, 1500);
      setTimeout(() => setShowAIResult(false), 3500);
    }
    // 다음 턴으로 이동 or 투표로 이동
    setTimeout(() => {
      if (currentTurn + 1 >= participants.length * 2) {
        // 8턴 끝나면 투표로 이동
        router.push(`/game/${gameCode}/vote`);
      } else {
        setCurrentTurn((prev) => prev + 1);
        setTurnTimer(15);
        setTurnInProgress(true);
        setMessage('');
      }
    }, 4000);
  };

  // 발언 종료 버튼
  const handleEndSpeech = () => {
    if (isMyTurn && turnInProgress) handleTurnEnd();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }

  return (
    <Container>
      <Header />
      <MainContent>
        <ProfileSection>
          <StyledVideo
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ border: isMyTurn ? '3px solid #fff' : undefined, boxShadow: isMyTurn ? '0 0 16px #fff' : undefined }}
          />
          <NicknameLabel>나 {isMyTurn && <span style={{ color: '#00ff88', marginLeft: 8 }}>(발언 중)</span>}</NicknameLabel>
          {isMyTurn && turnInProgress && (
            <>
              <div style={{ marginTop: 8, fontSize: 18 }}>남은 시간: {turnTimer}s</div>
              <button
                style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, background: '#00d09c', color: '#222', fontWeight: 700, border: 'none', fontSize: 18, cursor: 'pointer' }}
                onClick={handleEndSpeech}
              >발언 종료</button>
            </>
          )}
        </ProfileSection>
        <InputBox>
          <Input
            type="text"
            placeholder="Type something..."
            value={message}
            onChange={handleInputChange}
            disabled={!isMyTurn || !turnInProgress}
          />
        </InputBox>
        <PlayerGrid>
          {participants
            .filter((p) => p.user_id?.toString() !== myUserId)
            .map((p, idx) => {
              const isActive = speakingUser === p.users?.user_nickname;
              const colorIdx = p.turn_order % cardColors.length;
              return (
                <PlayerCardWrapper key={p.id || idx}>
                  <PlayerCard
                    $active={isActive && !isMyTurn}
                    color={cardColors[colorIdx]}
                    style={isActive && !isMyTurn ? { boxShadow: '0 0 16px #fff' } : {}}
                  >{isActive && !isMyTurn && <span style={{ color: '#fff', fontWeight: 700 }}>발언 중</span>}</PlayerCard>
                  <NicknameLabel>
                    {isActive && <Dot />} {p.users?.user_nickname}
                  </NicknameLabel>
                </PlayerCardWrapper>
              );
            })}
        </PlayerGrid>
      </MainContent>
      {showAILoading && <AILoadingOverlay speakerName={speakingUser} />}
      {showAIResult && (
        <AIResultModal
          speakerName={speakingUser}
          blinkCount={10}
          expression="당황한 표정"
          vagueness="모호한 발언"
          liarProbability={76}
          onClose={() => setShowAIResult(false)}
        />
      )}
    </Container>
  )
}