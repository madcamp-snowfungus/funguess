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

  // Turn state - WebSocket으로 동기화
  const [currentTurn, setCurrentTurn] = useState(0);
  const [turnTimer, setTurnTimer] = useState(15);
  const [turnInProgress, setTurnInProgress] = useState(true);
  const [showAILoading, setShowAILoading] = useState(false);
  const [showAIResult, setShowAIResult] = useState(false);
  const [message, setMessage] = useState('');
  const [turnsCount, setTurnsCount] = useState(0);
  
  // WebSocket refs
  const gameSocketRef = useRef<WebSocket | null>(null);
  const sttSocketRef = useRef<WebSocket | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [blinkCount, setBlinkCount] = useState(0);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [faceMeshReady, setFaceMeshReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [lastEAR, setLastEAR] = useState(0);
  const [blinkActive, setBlinkActive] = useState(false);
  const lastBlinkTimeRef = useRef<number>(0);

  const [modalBlinkCount, setModalBlinkCount] = useState<number | null>(null);
  const [modalVoiceAnalysis, setModalVoiceAnalysis] = useState<string | null>(null);
  const [modalVoiceAnalysisScore, setModalVoiceAnalysisScore] = useState<number | null>(null);
  // 최신 값 보존용 ref
  const messageRef = useRef(message);
  const blinkCountRef = useRef(blinkCount);
  const voiceAnalysisResultRef = useRef<string | null>(null);
  const voiceAnalysisScoreRef = useRef<number | null>(null);
  // WebSocket으로 받은 분석 데이터 저장용 state
  const [receivedAnalysisData, setReceivedAnalysisData] = useState<{
    blinkCount: number;
    voiceAnalysis: string;
    voiceAnalysisScore: number;
    transcript: string;
  } | null>(null);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    blinkCountRef.current = blinkCount;
  }, [blinkCount]);

  // STT 관련
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
    console.log('참가자 목록:', data);
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

  // 현재 발언자 정보 로그
  useEffect(() => {
    console.log('현재 턴:', currentTurn);
    console.log('참가자 수:', participants.length);
    console.log('발언자 인덱스:', speakingIdx);
    console.log('발언자:', speakingUser);
    console.log('발언자 ID:', speakingUserId);
    console.log('내 턴인가:', isMyTurn);
    console.log('내 ID:', myUserId);
  }, [currentTurn, participants, speakingIdx, speakingUser, speakingUserId, isMyTurn, myUserId]);

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

  const handleTurnEnd = async (turnNumber: number) => {
    if (!turnInProgress) return;
    setTurnInProgress(false);
  
    const finalMessage = messageRef.current;
    const finalBlinkCount = blinkCountRef.current;
  
    console.log('📊 handleTurnEnd() 실행');
    console.log('→ message:', finalMessage);
    console.log('→ blinkCount:', finalBlinkCount);
  
    let voiceAnalysisResult = null;
    let voiceAnalysisScore = null;
  
    const speakerIdx = turnNumber % participants.length;
    const currentSpeakerUserId = participants[speakerIdx]?.user_id?.toString();
    const isCurrentSpeaker = myUserId && currentSpeakerUserId === myUserId;

    console.log('gameId', gameId);
    console.log('currentSpeakerUserId', currentSpeakerUserId);
    console.log('isCurrentSpeaker', isCurrentSpeaker);
    console.log('finalMessage', finalMessage);
    console.log('keyword', keyword);

    const actualKeyword = keyword ?? localStorage.getItem('gameKeyword');

    if (gameId && currentSpeakerUserId && isCurrentSpeaker && finalMessage.trim() && actualKeyword) {
      try {
        const res = await fetch('/api/gemini-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: finalMessage, keyword: actualKeyword }),
        });
  
        const data = await res.json();
        voiceAnalysisResult = data.analysis || null;
        voiceAnalysisResultRef.current = voiceAnalysisResult;
        voiceAnalysisScore = data.score || null;
        voiceAnalysisScoreRef.current = data.score || null;
      } catch (e) {
        console.error('Gemini 분석 실패:', e);
        voiceAnalysisResult = null;
      }
    }
  
    if (gameId && currentSpeakerUserId && isCurrentSpeaker) {
      try {
        const { error } = await supabase.from('turns').insert({
          game_id: gameId,
          turn_number: turnNumber,
          turn_user_id: currentSpeakerUserId,
          transcript: finalMessage,
          face_analysis_data: { blinkCount: finalBlinkCount },
          voice_analysis_data: { analysis: voiceAnalysisResult },
          finished_at: new Date().toISOString(),
        });
  
        if (error) console.error('DB 저장 실패:', error);
        else console.log('DB 저장 성공');
      } catch (e) {
        console.error('DB 저장 오류:', e);
      }
    }
  
    setTurnsCount((prev) => prev + 1);
  
    if (!isCurrentSpeaker) {
      // 모달 데이터 즉시 설정
      setModalBlinkCount(finalBlinkCount);
      setModalVoiceAnalysis(voiceAnalysisResult || finalMessage || '발언 내용이 없습니다');
      setModalVoiceAnalysisScore(voiceAnalysisScore ?? 0);
      
      setShowAILoading(true);
      setTimeout(() => {
        setShowAILoading(false);
        setTimeout(() => setShowAIResult(true), 2000);
      }, 2000);
      setTimeout(() => setShowAIResult(false), 5000);
    }
  
    if (gameSocketRef.current?.readyState === 1) {
      gameSocketRef.current.send(JSON.stringify({
        type: 'turnEnd',
        roomId: gameCode,
        analysisData: {
          blinkCount: finalBlinkCount,
          voiceAnalysis: voiceAnalysisResult,
          voiceAnalysisScore: voiceAnalysisScore,
          transcript: finalMessage,
        },
      }));
    }
  
    // 상태 초기화
    setBlinkCount(0);
    setLastEAR(0);
    setBlinkActive(false);
    lastBlinkTimeRef.current = 0;
    setMessage('');
  };
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }

  // 게임 WebSocket 연결 및 동기화
  useEffect(() => {
    if (!gameId || !participants.length) return;

    const gameSocket = new WebSocket(`ws://${process.env.NEXT_AWS_IP}:8081`);
    gameSocketRef.current = gameSocket;

    gameSocket.onopen = () => {
      console.log('🎮 Game WebSocket connected');
      // 게임 참가
      gameSocket.send(JSON.stringify({
        type: 'join',
        roomId: gameCode,
        totalTurns: 8, // 고정 8턴
        gameId: gameId
      }));
    };

    gameSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'gameStart':
          console.log('🟢 게임 시작 메시지 수신');
          router.push(`/game/${gameCode}/play`);
          break;
        case 'turn':
          console.log(`📡 Received turn ${data.turn} from server`);
          setCurrentTurn(data.turn);
          // setMessage('');
          setTurnInProgress(false); // 턴 시작 시 비활성화
          break;
        case 'timer':
          setTurnTimer(data.timer);
          setTurnInProgress(true); // 타이머 시작과 함께 턴 활성화
          break;
        case 'gameEnd':
          // 게임 종료 시 투표 페이지로 이동
          router.push(`/game/${gameCode}/vote`);
          break;
        case 'turnEnd':
          // 타이머 만료로 인한 턴 종료인 경우
          if (data.timerExpired) {
            console.log(`⏰ Timer expired, calling handleTurnEnd for turn ${data.turn}`);
            
            // 현재 턴 번호로 발언자 계산
            const speakerIdx = data.turn % participants.length;
            const currentSpeakerUserId = participants[speakerIdx]?.user_id?.toString();
            const isCurrentSpeaker = myUserId && currentSpeakerUserId === myUserId;
            
            console.log(`🎤 Turn ${data.turn}: Speaker ID=${currentSpeakerUserId}, Is my turn=${isCurrentSpeaker}`);
            
            // 발언자인 경우에만 handleTurnEnd 호출
            if (isCurrentSpeaker) {
              // 현재 데이터를 캡처해서 전달
              const currentMessage = message;
              const currentBlinkCount = blinkCount;
              console.log(`📸 Capturing current data: message="${currentMessage}", blinkCount=${currentBlinkCount}`);
              handleTurnEnd(data.turn);
            } else {
              console.log('👥 Not my turn, showing AI modal with current data');
              // 비발언자에게 AI 분석 모달 표시 (현재 클라이언트의 데이터 사용)
              // 모달 데이터 즉시 설정
              setModalBlinkCount(blinkCount);
              setModalVoiceAnalysis(message || '발언 내용이 없습니다');
              setModalVoiceAnalysisScore(voiceAnalysisScoreRef.current ?? 0);
              
              setShowAILoading(true);
              setTimeout(() => {
                setShowAILoading(false);
                setTimeout(() => setShowAIResult(true), 2000);
              }, 2500);
              setTimeout(() => setShowAIResult(false), 6500);
            }
          }
          // 분석 데이터가 포함된 turnEnd 메시지 처리
          if (data.analysisData) {
            console.log('📊 Received analysis data:', data.analysisData);
            setReceivedAnalysisData(data.analysisData);
            // 모달 데이터 즉시 설정
            setModalBlinkCount(data.analysisData.blinkCount);
            setModalVoiceAnalysis(data.analysisData.voiceAnalysis || data.analysisData.transcript || '발언 내용이 없습니다');
            setModalVoiceAnalysisScore(data.analysisData.voiceAnalysisScore ?? 0);
          }
          break;
      }
    };

    gameSocket.onerror = (error) => {
      console.error('Game WebSocket error:', error);
    };

    gameSocket.onclose = () => {
      console.log('Game WebSocket disconnected');
    };

    return () => {
      gameSocket.close();
    };
  }, [gameId, participants.length, gameCode]);

  // STT WebSocket 연결
  useEffect(() => {
    const sttSocket = new WebSocket(`ws://${process.env.NEXT_AWS_IP}:8080`);
    // const sttSocket = new WebSocket('ws://localhost:8080');
    sttSocketRef.current = sttSocket;

    sttSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'stt') {
        console.log('🎤 STT received:', data.text);
        setMessage(data.text);
      }
    };

    const startMic = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const int16 = float32ToInt16(input);
        if (sttSocket.readyState === 1) sttSocket.send(int16);
      };
    };

    // 조건: 발언자인 경우만 마이크 시작
    if (isMyTurn && turnInProgress) {
      startMic();
    }

    return () => {
      processorRef.current?.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      sttSocket.close();
    };
  }, [isMyTurn, turnInProgress]);

  function float32ToInt16(buffer: Float32Array): Blob {
    const int16 = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      int16[i] = Math.max(-1, Math.min(1, buffer[i])) * 32767;
    }
    return new Blob([int16], { type: 'application/octet-stream' });
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

      if (data?.keyword) {
      setKeyword(data.keyword);
      localStorage.setItem('gameKeyword', data.keyword); // ✅ 저장
    }
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
          setBlinkCount(prev => {
            const newCount = prev + 1;
            console.log(`👁️ Blink detected! EAR: ${ear.toFixed(3)}, Count: ${newCount}`);
            return newCount;
          });
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
  // useEffect(() => {
  //   if (isMyTurn) {
  //     setBlinkCount(0);
  //     setLastEAR(0);
  //     setBlinkActive(false);
  //     lastBlinkTimeRef.current = 0;
  //   }
  // }, [isMyTurn, currentTurn]);

  // AIResultModal이 열릴 때, WebSocket으로 받은 분석 데이터 또는 현재 클라이언트의 데이터 사용
  useEffect(() => {
    if (!showAIResult) return;
    
    console.log('🔍 Modal data setup - showAIResult:', showAIResult);
    console.log('🔍 receivedAnalysisData:', receivedAnalysisData);
    console.log('🔍 blinkCountRef.current:', blinkCountRef.current);
    console.log('🔍 voiceAnalysisResultRef.current:', voiceAnalysisResultRef.current);
    console.log('🔍 messageRef.current:', messageRef.current);
    
    if (receivedAnalysisData) {
      console.log('🔍 Using received analysis data:', receivedAnalysisData);
      setModalBlinkCount(receivedAnalysisData.blinkCount);
      setModalVoiceAnalysis(receivedAnalysisData.voiceAnalysis || receivedAnalysisData.transcript || '발언 내용이 없습니다');
      setModalVoiceAnalysisScore(receivedAnalysisData.voiceAnalysisScore ?? 0);
    } else {
      console.log('🔍 Using local data:', {
        blinkCount: blinkCountRef.current,
        voiceAnalysis: voiceAnalysisResultRef.current,
        message: messageRef.current
      });
      setModalBlinkCount(blinkCountRef.current);
      setModalVoiceAnalysis(voiceAnalysisResultRef.current || messageRef.current || '발언 내용이 없습니다');
      setModalVoiceAnalysisScore(voiceAnalysisScoreRef.current ?? 0);
    }
  }, [showAIResult, receivedAnalysisData]);

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
          liarProbability={((modalVoiceAnalysisScore ?? 0)*0.7+(modalBlinkCount ?? 0)*10*0.3)}
          onClose={() => {
            setShowAIResult(false);
            // 모달 닫을 때 데이터 초기화
            setModalBlinkCount(null);
            setModalVoiceAnalysis(null);
            setModalVoiceAnalysisScore(null);
            setReceivedAnalysisData(null);
          }}
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