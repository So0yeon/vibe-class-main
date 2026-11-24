"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { COMMENTS_CACHE_TAG, type CommentItem } from "@/lib/community";

const VIEW_DEDUPE_COOKIE = "pv_map";
const VIEW_DEDUPE_WINDOW_MS = 60 * 60 * 1000; // 동일 사용자 중복 조회 방지 기간: 1시간
const NICKNAME_MAX_LENGTH = 30;
const CONTENT_MAX_LENGTH = 500;
const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 50;

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
  password = "",
): Promise<{ comment: CommentItem } | { error: string }> {
  const trimmedContent = content.trim();
  if (!trimmedContent) return { error: "댓글 내용을 입력해주세요." };
  if (trimmedContent.length > CONTENT_MAX_LENGTH) {
    return { error: `댓글은 ${CONTENT_MAX_LENGTH}자 이내로 작성해주세요.` };
  }
  if (
    password &&
    (password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH)
  ) {
    return {
      error: `비밀번호는 ${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자로 입력해주세요.`,
    };
  }

  const trimmedNickname = nickname.trim().slice(0, NICKNAME_MAX_LENGTH);

  const supabase = getSupabaseClient();
  if (!supabase) return { error: "커뮤니티 기능을 사용할 수 없습니다." };

  try {
    // 비밀번호가 있을 때만 4인자 RPC를 쓴다 (없으면 기존 3인자 그대로)
    const { data, error } = await supabase
      .rpc("add_comment", {
        p_program_id: programId,
        p_nickname: trimmedNickname || null,
        p_content: trimmedContent,
        ...(password ? { p_password: password } : {}),
      })
      .single();
    if (error) throw error;
    updateTag(COMMENTS_CACHE_TAG);

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

/** 작성자 삭제: 댓글 작성 때 정한 비밀번호로 확인 */
export async function deleteCommentWithPassword(
  commentId: number,
  password: string,
): Promise<{ ok: true } | { error: string }> {
  if (!password) return { error: "비밀번호를 입력해주세요." };

  const supabase = getSupabaseClient({ revalidateSeconds: 0 });
  if (!supabase) return { error: "커뮤니티 기능을 사용할 수 없습니다." };

  try {
    const { data, error } = await supabase.rpc("delete_comment_with_password", {
      p_comment_id: commentId,
      p_password: password,
    });
    if (error) throw error;

    switch (data as string) {
      case "deleted":
      case "not_found":
        updateTag(COMMENTS_CACHE_TAG);
        return { ok: true };
      case "wrong_password":
        return { error: "비밀번호가 맞지 않습니다." };
      case "no_password":
        return { error: "비밀번호 없이 작성된 댓글은 관리자만 삭제할 수 있습니다." };
      case "locked":
        return { error: "비밀번호를 여러 번 틀려 잠겼습니다. 관리자에게 문의해주세요." };
      default:
        return { error: "삭제에 실패했습니다." };
    }
  } catch (e) {
    console.error("deleteCommentWithPassword failed:", e);
    return { error: "삭제에 실패했습니다." };
  }
}

/** 관리자 삭제: 관리자로 로그인한 상태에서만 */
export async function deleteCommentAsAdmin(
  commentId: number,
): Promise<{ ok: true } | { error: string }> {
  if (!(await isAdmin())) return { error: "관리자만 삭제할 수 있습니다." };

  const { error } = await getSupabaseAdminClient()
    .from("comments")
    .delete()
    .eq("id", commentId);
  if (error) {
    console.error("deleteCommentAsAdmin failed:", error);
    return { error: "삭제에 실패했습니다." };
  }
  updateTag(COMMENTS_CACHE_TAG);
  return { ok: true };
}
