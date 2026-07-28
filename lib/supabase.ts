import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_REVALIDATE_SECONDS = 30;

/**
 * 서버 전용 Supabase 클라이언트. env가 설정되지 않은 환경(로컬 셋업 전 등)에서도
 * 앱 전체가 죽지 않도록 throw 대신 null을 반환하며, 호출부는 이를 "커뮤니티
 * 기능 비활성화"로 처리한다.
 */
export function getSupabaseClient(options?: {
  revalidateSeconds?: number;
}): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  const revalidate = options?.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS;

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate } }),
    },
  });
}
