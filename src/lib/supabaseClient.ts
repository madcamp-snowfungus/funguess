// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';

// RLS 문제를 해결하기 위해 서비스 롤 키 사용
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)