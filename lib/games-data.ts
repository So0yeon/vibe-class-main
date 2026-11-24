import "server-only";
import { getSupabaseClient } from "@/lib/supabase";
import { DEFAULT_GRADE_MIGRATION, type GameItem, type WorksheetFile } from "@/lib/games";

/** 관리자 페이지가 저장할 때 updateTag(GAMES_CACHE_TAG)로 공개 페이지 캐시를 비운다 */
export const GAMES_CACHE_TAG = "games";

export type GameRow = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  url: string | null;
  tags: string[] | null;
  date: string | null;
  published: boolean;
  priority: number;
  worksheets: WorksheetFile[] | null;
  grades: string[] | null;
  unit: string;
  play_time: string;
};

export const GAME_COLUMNS =
  "id, title, description, thumbnail_url, url, tags, date, published, priority, worksheets, grades, unit, play_time";

export function mapGameRow(row: GameRow): GameItem {
  const grades = row.grades?.length ? row.grades : [DEFAULT_GRADE_MIGRATION];
  return {
    id: row.id,
    title: row.title || "제목 없음",
    description: row.description ?? "",
    thumbnail: row.thumbnail_url,
    url: row.url,
    tags: row.tags ?? [],
    date: row.date,
    published: row.published,
    priority: row.priority ?? 0,
    worksheets: Array.isArray(row.worksheets) ? row.worksheets : [],
    grades,
    unit: row.unit ?? "",
    playTime: row.play_time ?? "",
  };
}

function getPublicClient() {
  const supabase = getSupabaseClient({
    revalidateSeconds: 300,
    tags: [GAMES_CACHE_TAG],
  });
  if (!supabase) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 .env.local에 설정되지 않았습니다.",
    );
  }
  return supabase;
}

/** 공개된 게임 목록 (우선순위 내림차순) */
export async function getPublishedGames(): Promise<GameItem[]> {
  const { data, error } = await getPublicClient()
    .from("games")
    .select(GAME_COLUMNS)
    .eq("published", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`게임 목록을 불러오지 못했습니다: ${error.message}`);
  return ((data ?? []) as GameRow[]).map(mapGameRow);
}

/** 상세 페이지용 단일 게임. 없거나 비공개면 null */
export async function getGameById(id: string): Promise<GameItem | null> {
  const { data, error } = await getPublicClient()
    .from("games")
    .select(GAME_COLUMNS)
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`게임 정보를 불러오지 못했습니다: ${error.message}`);
  return data ? mapGameRow(data as GameRow) : null;
}
