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
    
    // 프롬프트: 제시어와 발언을 함께 보여주고, 부합 정도와 수상함 점수/설명을 요청
    const prompt = `제시어: "${keyword ?? ''}"
발언: "${transcript}"
이 발언이 제시어와 얼마나 잘 부합하는지, 수상한 정도(10글자 이내의 간단한 설명)를 알려줘. 예시: 제시어를 연상시키는 단어
설명에는 제시어를 절대 포함하면 안돼"`;
    
    console.log('Gemini API 요청 프롬프트:', prompt);
    
    // 최신 엔드포인트(v1)로 수정
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    
    console.log('Gemini API 호출 시작');
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
    console.log('Gemini API 응답 전체:', geminiData);
    
    const analysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('추출된 분석 결과:', analysis);
    
    return NextResponse.json({ analysis, raw: geminiData });
  } catch (e) {
    console.error('Gemini API 처리 중 에러:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
} 