import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_REVALIDATE_SECONDS = 30;

/**
 * 서버 전용 Supabase 클라이언트. env가 설정되지 않은 환경(로컬 셋업 전 등)에서도
 * 앱 전체가 죽지 않도록 throw 대신 null을 반환하며, 호출부는 이를 "커뮤니티
 * 기능 비활성화"로 처리한다.
 *
 * tags를 주면 관리자 페이지에서 저장할 때 updateTag()로 캐시를 즉시 비울 수 있다.
 */
export function getSupabaseClient(options?: {
  revalidateSeconds?: number;
  tags?: string[];
}): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  const revalidate = options?.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS;
  const tags = options?.tags;

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate, tags } }),
    },
  });
}
