"use server";

import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/supabase";
import type { CommentItem } from "@/lib/community";

const VIEW_DEDUPE_COOKIE = "pv_map";
const VIEW_DEDUPE_WINDOW_MS = 60 * 60 * 1000; // 동일 사용자 중복 조회 방지 기간: 1시간
const NICKNAME_MAX_LENGTH = 30;
const CONTENT_MAX_LENGTH = 500;

/** "id:timestamp,id:timestamp" 형태의 압축 쿠키 값을 파싱하며 만료된 항목은 버린다 */
function parseViewMap(
  raw: string | undefined,
  now: number,
): Map<string, number> {
  const entries = new Map<string, number>();
  if (!raw) return entries;
  for (const pair of raw.split(",")) {
    const [id, tsRaw] = pair.split(":");
    const ts = Number(tsRaw);
    if (!id || !Number.isFinite(ts)) continue;
    if (now - ts < VIEW_DEDUPE_WINDOW_MS) entries.set(id, ts);
  }
  return entries;
}

function serializeViewMap(entries: Map<string, number>): string {
  return [...entries.entries()].map(([id, ts]) => `${id}:${ts}`).join(",");
}

function setViewMapCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  entries: Map<string, number>,
) {
  cookieStore.set(VIEW_DEDUPE_COOKIE, serializeViewMap(entries), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: VIEW_DEDUPE_WINDOW_MS / 1000,
    path: "/",
  });
}

/** 프로그램 상세 페이지 진입 시 호출. 1시간 이내 재조회는 집계하지 않고 null 반환 */
export async function incrementView(
  programId: string,
): Promise<{ views: number } | null> {
  const cookieStore = await cookies();
  const now = Date.now();
  const entries = parseViewMap(
    cookieStore.get(VIEW_DEDUPE_COOKIE)?.value,
    now,
  );

  if (entries.has(programId)) {
    setViewMapCookie(cookieStore, entries);
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .rpc("increment_view", { p_program_id: programId })
      .single();
    if (error) throw error;

    entries.set(programId, now);
    setViewMapCookie(cookieStore, entries);

    return { views: (data as { views: number }).views };
  } catch (e) {
    console.error("incrementView failed:", e);
    return null;
  }
}

export async function likeProgram(
  programId: string,
): Promise<{ likes: number } | { error: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "커뮤니티 기능을 사용할 수 없습니다." };

  try {
    const { data, error } = await supabase
      .rpc("increment_like", { p_program_id: programId })
      .single();
    if (error) throw error;
    return { likes: (data as { likes: number }).likes };
  } catch (e) {
    console.error("likeProgram failed:", e);
    return { error: "좋아요 처리에 실패했습니다." };
  }
}

export async function addComment(
  programId: string,
  nickname: string,
  content: string,
): Promise<{ comment: CommentItem } | { error: string }> {
  const trimmedContent = content.trim();
  if (!trimmedContent) return { error: "댓글 내용을 입력해주세요." };
  if (trimmedContent.length > CONTENT_MAX_LENGTH) {
    return { error: `댓글은 ${CONTENT_MAX_LENGTH}자 이내로 작성해주세요.` };
  }

  const trimmedNickname = nickname.trim().slice(0, NICKNAME_MAX_LENGTH);

  const supabase = getSupabaseClient();
  if (!supabase) return { error: "커뮤니티 기능을 사용할 수 없습니다." };

  try {
    const { data, error } = await supabase
      .rpc("add_comment", {
        p_program_id: programId,
        p_nickname: trimmedNickname || null,
        p_content: trimmedContent,
      })
      .single();
    if (error) throw error;

    const row = data as {
      id: number;
      nickname: string | null;
      content: string;
      created_at: string;
    };

    return {
      comment: {
        id: row.id,
        nickname: row.nickname,
        content: row.content,
        createdAt: row.created_at,
      },
    };
  } catch (e) {
    console.error("addComment failed:", e);
    return { error: "댓글 등록에 실패했습니다." };
  }
}

export async function reportComment(
  commentId: number,
): Promise<{ hidden: boolean } | { error: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "커뮤니티 기능을 사용할 수 없습니다." };

  try {
    const { data, error } = await supabase
      .rpc("report_comment", { p_comment_id: commentId })
      .single();
    if (error) throw error;
    return { hidden: (data as { hidden: boolean }).hidden };
  } catch (e) {
    console.error("reportComment failed:", e);
    return { error: "신고 처리에 실패했습니다." };
  }
}
