import "server-only";
import { requireAdmin } from "@/lib/admin/auth";
import { mapAboutRow, type AboutContent, type AboutRow } from "@/lib/about";
import type { GameItem } from "@/lib/games";
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
