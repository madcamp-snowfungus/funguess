import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    console.log('API 라우트 시작')
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // service_role_key 대신 anon_key 사용
    
    console.log('Supabase URL:', supabaseUrl ? '설정됨' : '설정되지 않음')
    console.log('Supabase Key:', supabaseKey ? '설정됨' : '설정되지 않음')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('환경 변수가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '서버 설정 오류' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { gameId, liarUserId } = await req.json()
    console.log('받은 데이터:', { gameId, liarUserId })

    if (!gameId || !liarUserId) {
      console.error('필수 데이터가 누락되었습니다.')
      return NextResponse.json(
        { error: '게임 ID와 라이어 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('라이어 설정 시작:', { gameId, liarUserId })

    // 1. games 테이블에 라이어 설정
    console.log('게임 테이블 업데이트 시작')
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .update({ 
        liar_user_id: liarUserId,
        status: 'playing'
      })
      .eq('id', gameId)
      .select()

    if (gameError) {
      console.error('게임 테이블 업데이트 오류:', gameError)
      return NextResponse.json(
        { error: '게임 테이블 업데이트에 실패했습니다.', details: gameError },
        { status: 500 }
      )
    }

    console.log('게임 테이블 업데이트 성공:', gameData)

    // 2. game_participants 테이블에서 라이어의 role을 'liar'로 변경
    console.log('참가자 테이블 업데이트 시작')
    const { data: participantData, error: participantError } = await supabase
      .from('game_participants')
      .update({ 
        role: 'liar'
      })
      .eq('game_id', gameId)
      .eq('user_id', liarUserId)
      .select()

    if (participantError) {
      console.error('참가자 테이블 업데이트 오류:', participantError)
      return NextResponse.json(
        { error: '참가자 테이블 업데이트에 실패했습니다.', details: participantError },
        { status: 500 }
      )
    }

    console.log('참가자 테이블 업데이트 성공:', participantData)
    console.log('라이어 설정 성공:', { gameData, participantData })

    return NextResponse.json(
      { 
        message: '라이어 설정 성공', 
        gameData, 
        participantData 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error },
      { status: 500 }
    )
  }
} 