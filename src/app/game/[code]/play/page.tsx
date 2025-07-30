// src/app/game/[code]/play/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Header from '@/components/Header'
import AILoadingOverlay from '@/components/AILoadingOverlay'
import AIResultModal from '@/components/AIResultModal'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

// Mediapipe FaceMesh를 위한 CDN URL
const MEDIAPIPE_FACEMESH_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
const MEDIAPIPE_CAMERA_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';

// Mediapipe 타입 확장
declare global {
  interface Window {
    FaceMesh?: any;
    Camera?: any;
  }
}

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
  const [blinkCount, setBlinkCount] = useState(0);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [faceMeshReady, setFaceMeshReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [lastEAR, setLastEAR] = useState(0);
  const [blinkActive, setBlinkActive] = useState(false);
  const lastBlinkTimeRef = useRef<number>(0); // 추가: debounce용

  const [modalBlinkCount, setModalBlinkCount] = useState<number | null>(null);
  const [modalVoiceAnalysis, setModalVoiceAnalysis] = useState<string | null>(null);

  // STT 관련
  const socketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

  // useRef 동기화는 isMyTurn 선언 이후에 위치해야 함
  const isMyTurnRef = useRef(false);
  useEffect(() => { isMyTurnRef.current = !!isMyTurn; }, [isMyTurn]);

  const blinkActiveRef = useRef(false);
  useEffect(() => { blinkActiveRef.current = blinkActive; }, [blinkActive]);

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

  // 마이크 오디오 → WebSocket 전송
  // 모든 참가자: WebSocket 열고 STT 메시지 수신
  // 발언자만: 마이크를 STT 서버로 전송
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080') // ✅ 모두 연결
    socketRef.current = socket

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'stt') {
        setMessage(data.text) // ✅ 모든 참가자가 메시지 받음
      }
    }

    const startMic = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      source.connect(processor)
      processor.connect(audioContext.destination)

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0)
        const int16 = float32ToInt16(input)
        if (socket.readyState === 1) socket.send(int16)
      }
    }

    // 조건: 발언자인 경우만 마이크 시작
    if (isMyTurn && turnInProgress) {
      startMic()
    }

    return () => {
      processorRef.current?.disconnect()
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      socket.close()
    }
  }, [isMyTurn, turnInProgress])


  function float32ToInt16(buffer: Float32Array): Blob {
    const int16 = new Int16Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
      int16[i] = Math.max(-1, Math.min(1, buffer[i])) * 32767
    }
    return new Blob([int16], { type: 'application/octet-stream' })
  }

  useEffect(() => {
    if (!gameId) return;
    getParticipants(gameId).then((data) => setParticipants(data || []));
    fetchTurnsCount(gameId).then(setTurnsCount);
  }, [gameId]);

  const [keyword, setKeyword] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    const fetchKeyword = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('keyword')
        .eq('id', gameId)
        .single();
      if (data) setKeyword(data.keyword);
    };
    fetchKeyword();
  }, [gameId]);

  // Mediapipe FaceMesh CDN 동적 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.FaceMesh) {
      const script = document.createElement('script');
      script.src = MEDIAPIPE_FACEMESH_CDN;
      script.async = true;
      script.onload = () => setFaceMeshReady(true);
      document.body.appendChild(script);
    } else {
      setFaceMeshReady(true);
    }
  }, []);

  // Camera utils도 필요 (cameraReady)
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Camera) {
      const script2 = document.createElement('script');
      script2.src = MEDIAPIPE_CAMERA_CDN;
      script2.async = true;
      script2.onload = () => setCameraReady(true);
      document.body.appendChild(script2);
    } else {
      setCameraReady(true);
    }
  }, []);

  // EAR 계산 함수 (양쪽 눈 평균)
  function calcEAR(landmarks: any) {
    // Mediapipe의 눈 랜드마크 인덱스 (좌/우)
    // 왼쪽: 33, 160, 158, 133, 153, 144
    // 오른쪽: 362, 385, 387, 263, 373, 380
    function getEAR(indices: number[]) {
      const [p1, p2, p3, p4, p5, p6] = indices.map(i => landmarks[i]);
      function dist(a: any, b: any) {
        return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);
      }
      return (
        (dist(p2, p6) + dist(p3, p5)) / (2.0 * dist(p1, p4))
      );
    }
    const leftEAR = getEAR([33, 160, 158, 133, 153, 144]);
    const rightEAR = getEAR([362, 385, 387, 263, 373, 380]);
    return (leftEAR + rightEAR) / 2.0;
  }

  // 웹캠 스트림 연결 (게임 시작 시 한 번만)
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error('웹캠 연결 오류:', err)
          alert('웹캠 접근 권한을 허용해주세요!')
        })
    }
    // cleanup에서 스트림을 끊지 않음 (게임 내내 유지)
  }, []);

  // FaceMesh, Camera 인스턴스는 게임 시작 시 한 번만 생성
  useEffect(() => {
    if (!faceMeshReady || !cameraReady || !videoRef.current) return;
    let running = true;
    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    faceMesh.onResults((results: any) => {
      if (!isMyTurnRef.current) return;
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
      const landmarks = results.multiFaceLandmarks[0];
      const ear = calcEAR(landmarks);
      const BLINK_THRESHOLD = 0.21;
      const BLINK_DEBOUNCE_MS = 200;
      const now = Date.now();
      if (ear < BLINK_THRESHOLD && !blinkActiveRef.current) {
        if (now - lastBlinkTimeRef.current > BLINK_DEBOUNCE_MS) {
          setBlinkCount(prev => prev + 1);
          lastBlinkTimeRef.current = now;
        }
        setBlinkActive(true);
      } else if (ear >= BLINK_THRESHOLD && blinkActiveRef.current) {
        setBlinkActive(false);
      }
      setLastEAR(ear);
    });
    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (!running) return;
        await faceMesh.send({ image: videoRef.current });
      },
      width: 480,
      height: 360
    });
    camera.start();
    faceMeshRef.current = faceMesh;
    cameraRef.current = camera;
    return () => {
      running = false;
      // 게임 전체가 끝날 때만 close/stop
      // if (cameraRef.current) cameraRef.current.stop();
      // if (faceMeshRef.current && faceMeshRef.current.close) faceMeshRef.current.close();
    };
  }, [faceMeshReady, cameraReady]);

  // 턴이 바뀔 때마다 blinkCount 등만 초기화
  useEffect(() => {
    if (isMyTurn) {
      setBlinkCount(0);
      setLastEAR(0);
      setBlinkActive(false);
      lastBlinkTimeRef.current = 0;
    }
  }, [isMyTurn, currentTurn]);

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

  // 턴 종료 핸들러
  const handleTurnEnd = async () => {
    setTurnInProgress(false);
    let voiceAnalysisResult = null;
    if (gameId && speakingUserId && isMyTurn) {
      // Gemini 분석 API 호출 (keyword 포함)
      try {
        const res = await fetch('/api/gemini-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: message, keyword }),
        });
        const data = await res.json();
        voiceAnalysisResult = data.analysis || null;
      } catch (e) {
        voiceAnalysisResult = null;
      }
      // 2. DB 저장
      await supabase.from('turns').insert({
        game_id: gameId,
        turn_number: currentTurn,
        turn_user_id: speakingUserId,
        transcript: message,
        face_analysis_data: { blinkCount },
        voice_analysis_data: { analysis: voiceAnalysisResult },
        finished_at: new Date().toISOString(),
      });
    }
    setTurnsCount((prev) => prev + 1);
    // AI 분석 모달: 발언자 제외 모두에게 표시
    if (!isMyTurn) {
      setShowAILoading(true);
      setTimeout(() => {
        setShowAILoading(false);
        setTimeout(() => setShowAIResult(true), 2000); // 1초 딜레이 후 모달 표시
      }, 1500);
      setTimeout(() => setShowAIResult(false), 4500); // 모달 닫는 시간도 1초 늘림
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

  // AIResultModal이 열릴 때, turns 테이블에서 최신 턴의 blinkCount와 voice_analysis_data를 fetch
  useEffect(() => {
    if (!showAIResult || !gameId || !speakingUserId) return;
    // 가장 최근 턴의 face_analysis_data.blinkCount, voice_analysis_data를 가져온다
    const fetchAnalysisData = async () => {
      const { data, error } = await supabase
        .from('turns')
        .select('face_analysis_data, voice_analysis_data')
        .eq('game_id', gameId)
        .eq('turn_user_id', speakingUserId)
        .eq('turn_number', currentTurn)
        .order('finished_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setModalBlinkCount(data[0].face_analysis_data?.blinkCount ?? null);
        setModalVoiceAnalysis(data[0].voice_analysis_data?.analysis ?? null);
      } else {
        setModalBlinkCount(null);
        setModalVoiceAnalysis(null);
      }
    };
    fetchAnalysisData();
  }, [showAIResult, gameId, speakingUserId, currentTurn]);

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
          blinkCount={modalBlinkCount ?? 0}
          // expression="당황한 표정"
          vagueness={modalVoiceAnalysis ?? '모호한 발언'}
          liarProbability={76}
          onClose={() => setShowAIResult(false)}
        />
      )}
    </Container>
  )
}

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