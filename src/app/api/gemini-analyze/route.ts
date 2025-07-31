import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Gemini API 요청 받음:', body);
    
    const { transcript, keyword } = body;
    
    if (!transcript || transcript.trim() === '') {
      console.log('transcript가 비어있음:', transcript);
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.log('Gemini API 키가 설정되지 않음');
      return NextResponse.json({ error: 'No Gemini API key set' }, { status: 500 });
    }

    const prompt = `제시어: "${keyword ?? ''}"
발언: "${transcript}"

너는 라이어 게임을 도와주는 역할이야.
발언이 제시어에 얼마나 잘 부합하는지 평가해줘.
- 1에서 100 사이의 수상한 정도 점수를 숫자 하나로 반환해줘. 진짜 딱 들어맞지 않는 이상 너무 작은 수는 주지 마 너무 극단적인 수를 자주 주지 마.(1은 매우 자연스러움, 100은 매우 수상함)
- 그 다음 줄에 10글자 이내의 간단한 설명을 반환해줘.
- 설명에는 제시어를 절대 포함하면 안돼.
- 만약 제시어가 사람 이름이면 다음 내용을 참고해줘.
- 이연재: 여자, 원숭이를 좋아함, 하예영이랑 룸메이트임, 두산 베어스 좋아함
- 백서경: 여자, 고려대 FM, 무제한 데이터, 부엉이, 에겐녀, 착함, 주거침입 한 적 있음
- 박지민: 남자, 블링크(블랙핑크 팬클럽), 월드 디제이 페스티벌 좋아함
- 김재헌: 남자, 게임을 좋아함, 방탈출을 좋아함, 해외 축구 관람 좋아함
- 임하민: 남자, 댄서, 고려대 FM, 화음 잘 넣음, 비와 겨울을 좋아함
- 박기람: 여자, 삼성 라이온즈 좋아함, 맥시멀리스트, 짐이 많음, 애주가, 매운 거 엄청 잘 먹음, 겉바속촉
- 이창민: 남자, 요리가 취미임, 군대에서 취사병이었음, 키보드 소리 좋음
- 김한준: 남자, 뮤지컬 배우, 오토바이, 가죽자켓, 매화수, 프론트엔드 개발자
- 황광호: 남자, 테니스공, 인생 2회차, 영감 받기, 의자, 최강기아타이거즈 좋아함
- 이재현: 여자, 발랄함, 옷 예쁘게 입음, 긍정걸, 노래 많이 부름(흥얼흥얼), 복싱 선수
- 장서우: 남자, 해리포터 닮음, 안경 씀, 음악을 좋아함, 게임을 좋아함
- 이서진: 여자, 게임 개발자, 술 잘 마심, 좀비, 잠을 안잠, 집을 안감, 자주 아픔
- 김동현: 남자, 게임 개발자, 간식 기부 천사, 맥주 lover, 종이 먹방, 긍정보이
- 박성준: 남자, 거인, 키 190cm, 거북목, 주짓수, 빨간 바지, 스냅백, 목걸이
- 이다인: 여자, 남자 중학생 같은 성격, 햄버거, 게임 중독, 지뢰 밟기
- 박재현: 남자, 사투리, 컴퓨터 좋아함, 블록체인, 맥북, 애플 직원
- 윤신이: 여자, 발랄함, 남자 초등학생 같은 성격, 대구 여자, 테토녀, ITZY 예지 닮음
- 박지헌: 남자, 게임 개발자, 유니티의 신, 웃는 얼굴, 서브웨이 좋아함
- 하예영: 여자, 귀여움, "쉣~"을 많이 함, 아일릿 원희 닮음, 크리스티나 성대모사 잘함
- 김승준: 남자, 노래 잘 부름, 버스킹, 공포 영화 좋아함, 정준일과 자우림을 좋아함, 광호가 제일 좋아하는 형아
- 최현우: 남자, 손흥민 닮음, 많이 먹음, 밥 4공기 먹음, 맛집탐방이 취미, 게임 좋아함, 풋살 좋아함

반환 형식 예시:
점수: 10
설명: 제시어를 연상시키는 단어`;

    console.log('Gemini API 요청 프롬프트:', prompt);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API 응답 에러:', geminiRes.status, errorText);
      return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Gemini 응답 분석 텍스트:', analysisText);

    const scoreMatch = analysisText.match(/점수:\s*(\d+)/);
    const analysisMatch = analysisText.match(/설명:\s*(.+)/);

    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
    const analysis = analysisMatch ? analysisMatch[1].trim() : null;

    return NextResponse.json({
      score,
      analysis,
      raw: geminiData,
    });

  } catch (e) {
    console.error('Gemini API 처리 중 에러:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
