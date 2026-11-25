import "server-only";
import { requireAdmin } from "@/lib/admin/auth";
import { mapAboutRow, type AboutContent, type AboutRow } from "@/lib/about";
import { extractSubjects, type GameItem } from "@/lib/games";
import { GAME_COLUMNS, mapGameRow, type GameRow } from "@/lib/games-data";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

/** 관리자 목록: 비공개 항목까지 전부 */
export async function getAllGamesForAdmin(): Promise<GameItem[]> {
  await requireAdmin();
  const { data, error } = await getSupabaseAdminClient()
    .from("games")
    .select(GAME_COLUMNS)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`게임 목록을 불러오지 못했습니다: ${error.message}`);
  return ((data ?? []) as GameRow[]).map(mapGameRow);
}

export async function getGameForAdmin(id: string): Promise<GameItem | null> {
  await requireAdmin();
  const { data, error } = await getSupabaseAdminClient()
    .from("games")
    .select(GAME_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`게임 정보를 불러오지 못했습니다: ${error.message}`);
  return data ? mapGameRow(data as GameRow) : null;
}

/** 소개 섹션. 저장된 값이 없으면 사이트 기본 문구로 채워서 보여준다 */
export async function getAboutForAdmin(): Promise<AboutContent> {
  await requireAdmin();
  const { data, error } = await getSupabaseAdminClient()
    .from("site_about")
    .select("title, paragraphs, profile_image, banner_image")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`소개 섹션을 불러오지 못했습니다: ${error.message}`);
  return mapAboutRow(data as AboutRow | null);
}

export type AdminComment = {
  id: number;
  programId: string;
  gameTitle: string | null;
  nickname: string | null;
  content: string;
  createdAt: string;
  reportCount: number;
  hidden: boolean;
};

/** 최근 댓글 (신고로 자동 숨김된 것 포함) */
export async function getRecentCommentsForAdmin(limit = 200): Promise<AdminComment[]> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, program_id, nickname, content, created_at, report_count, hidden")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`댓글을 불러오지 못했습니다: ${error.message}`);

  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.program_id as string))];
  const titles = new Map<string, string>();
  if (ids.length) {
    const { data: games } = await supabase.from("games").select("id, title").in("id", ids);
    for (const g of games ?? []) titles.set(g.id as string, g.title as string);
  }

  return rows.map((r) => ({
    id: r.id as number,
    programId: r.program_id as string,
    gameTitle: titles.get(r.program_id as string) ?? null,
    nickname: r.nickname as string | null,
    content: r.content as string,
    createdAt: r.created_at as string,
    reportCount: r.report_count as number,
    hidden: r.hidden as boolean,
  }));
}

/** 게임 수정 화면의 과목 선택지: 지금 쓰이는 모든 태그 (기본 과목 순서 우선) */
export async function getKnownTagsForAdmin(): Promise<string[]> {
  return extractSubjects(await getAllGamesForAdmin());
}
