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

이 발언이 제시어와 얼마나 잘 부합하는지 평가해줘.
- 1에서 100 사이의 수상한 정도 점수를 숫자 하나로 반환해줘. (1은 매우 자연스러움, 100은 매우 수상함)
- 그 다음 줄에 10글자 이내의 간단한 설명을 반환해줘.
- 설명에는 제시어를 절대 포함하면 안돼.

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
