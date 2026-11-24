"use client";

import { createClient } from "@supabase/supabase-js";
import { createUploadUrl, type UploadKind } from "@/lib/actions/admin";

const MEDIA_BUCKET = "media";

let browserClient: ReturnType<typeof createClient> | null = null;

function getBrowserClient() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

/**
 * 서버에서 1회용 업로드 주소를 받아 Storage로 직접 올리고, 만료되지 않는
 * 공개 주소를 돌려준다.
 */
export async function uploadFile(kind: UploadKind, file: File): Promise<string> {
  const ticket = await createUploadUrl({
    kind,
    fileName: file.name,
    size: file.size,
  });
  if ("error" in ticket) throw new Error(ticket.error);

  const { error } = await getBrowserClient()
    .storage.from(MEDIA_BUCKET)
    .uploadToSignedUrl(ticket.path, ticket.token, file, {
      contentType: file.type || undefined,
    });
  if (error) throw new Error(`업로드 실패: ${error.message}`);

  return ticket.publicUrl;
}
