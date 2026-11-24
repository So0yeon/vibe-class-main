import { getSupabaseClient } from "@/lib/supabase";

/** 댓글 작성/삭제 시 updateTag(COMMENTS_CACHE_TAG)로 댓글·통계 캐시를 비운다 */
export const COMMENTS_CACHE_TAG = "comments";

export type ProgramStats = {
  views: number;
  likes: number;
  commentCount: number;
};

export type CommentItem = {
  id: number;
  nickname: string | null;
  content: string;
  createdAt: string;
};

const ZERO_STATS: ProgramStats = { views: 0, likes: 0, commentCount: 0 };

type ProgramStatsRow = {
  program_id: string;
  views: number;
  likes: number;
  comment_count: number;
};

type CommentRow = {
  id: number;
  nickname: string | null;
  content: string;
  created_at: string;
};

function mapCommentRow(row: CommentRow): CommentItem {
  return {
    id: row.id,
    nickname: row.nickname,
    content: row.content,
    createdAt: row.created_at,
  };
}

/** 목록 페이지용: 프로그램 id별 통계를 한 번의 쿼리로 조회 */
export async function getAllProgramStats(): Promise<{
  stats: Record<string, ProgramStats>;
  available: boolean;
}> {
  const supabase = getSupabaseClient({ tags: [COMMENTS_CACHE_TAG] });
  if (!supabase) return { stats: {}, available: false };

  try {
    const { data, error } = await supabase
      .from("program_stats")
      .select("program_id, views, likes, comment_count");

    if (error) throw error;

    const stats: Record<string, ProgramStats> = {};
    for (const row of (data ?? []) as ProgramStatsRow[]) {
      stats[row.program_id] = {
        views: row.views,
        likes: row.likes,
        commentCount: row.comment_count,
      };
    }
    return { stats, available: true };
  } catch (e) {
    console.error("getAllProgramStats failed:", e);
    return { stats: {}, available: false };
  }
}

/** 상세 페이지용: 단일 프로그램 통계 조회. 상호작용이 없던 프로그램은 0으로 취급 */
export async function getProgramStats(
  programId: string,
): Promise<{ stats: ProgramStats; available: boolean }> {
  const supabase = getSupabaseClient({ tags: [COMMENTS_CACHE_TAG] });
  if (!supabase) return { stats: ZERO_STATS, available: false };

  try {
    const { data, error } = await supabase
      .from("program_stats")
      .select("views, likes, comment_count")
      .eq("program_id", programId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { stats: ZERO_STATS, available: true };

    return {
      stats: {
        views: data.views,
        likes: data.likes,
        commentCount: data.comment_count,
      },
      available: true,
    };
  } catch (e) {
    console.error("getProgramStats failed:", e);
    return { stats: ZERO_STATS, available: false };
  }
}

/** 상세 페이지용: 최신순 댓글 목록 (hidden=false는 RLS가 이미 필터링) */
export async function getComments(
  programId: string,
): Promise<{ comments: CommentItem[]; available: boolean }> {
  const supabase = getSupabaseClient({ tags: [COMMENTS_CACHE_TAG] });
  if (!supabase) return { comments: [], available: false };

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("id, nickname, content, created_at")
      .eq("program_id", programId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      comments: ((data ?? []) as CommentRow[]).map(mapCommentRow),
      available: true,
    };
  } catch (e) {
    console.error("getComments failed:", e);
    return { comments: [], available: false };
  }
}
