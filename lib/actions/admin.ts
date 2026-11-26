"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionValue,
  safeEqual,
} from "@/lib/admin/session";
import { ABOUT_CACHE_TAG } from "@/lib/about";
import { GAMES_CACHE_TAG } from "@/lib/games-data";
import type { WorksheetFile } from "@/lib/games";
import { kstDateKey } from "@/lib/season";
import { getSupabaseAdminClient, MEDIA_BUCKET } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// 로그인 / 로그아웃
// ---------------------------------------------------------------------------

export type LoginState = { error: string | null };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !process.env.ADMIN_SESSION_SECRET) {
    return { error: "ADMIN_PASSWORD / ADMIN_SESSION_SECRET 환경변수가 설정되지 않았습니다." };
  }

  const password = String(formData.get("password") ?? "");
  if (!(await safeEqual(password, expected))) {
    // 무작위 대입을 느리게 만들기 위한 지연
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, await createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// 파일 업로드: 서버가 1회용 업로드 주소를 발급하고, 브라우저가 Storage로 직접
// 올린다. (Server Action 본문 크기 제한 1MB / Vercel 4.5MB를 피하기 위함)
// ---------------------------------------------------------------------------

export type UploadKind = "thumbnail" | "worksheet" | "about";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_WORKSHEET_BYTES = 50 * 1024 * 1024; // Supabase 무료 플랜 기본 업로드 한도

export async function createUploadUrl(input: {
  kind: UploadKind;
  fileName: string;
  size: number;
}): Promise<
  { path: string; token: string; publicUrl: string } | { error: string }
> {
  await requireAdmin();

  const ext = input.fileName.split(".").pop()?.toLowerCase() ?? "";
  const isImageKind = input.kind !== "worksheet";

  if (isImageKind && !IMAGE_EXTENSIONS.includes(ext)) {
    return { error: "이미지 파일(jpg, png, gif, webp 등)만 올릴 수 있습니다." };
  }
  const limit = isImageKind ? MAX_IMAGE_BYTES : MAX_WORKSHEET_BYTES;
  if (input.size > limit) {
    return { error: `파일이 너무 큽니다 (최대 ${limit / 1024 / 1024}MB).` };
  }

  // Storage 경로에는 한글을 쓸 수 없으므로 무작위 이름 + 확장자만 사용한다.
  // 활동지의 원래 파일명은 DB(worksheets[].name)에 따로 저장한다.
  const safeExt = /^[a-z0-9]{1,8}$/.test(ext) ? `.${ext}` : "";
  const month = kstDateKey().slice(0, 7);
  const path = `${input.kind}/${month}/${crypto.randomUUID()}${safeExt}`;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { error: `업로드 주소를 만들지 못했습니다: ${error?.message}` };
  }

  const publicUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    .data.publicUrl;
  return { path: data.path, token: data.token, publicUrl };
}

/** 우리 버킷의 공개 주소면 Storage 경로를, 아니면 null */
function storagePathFromUrl(url: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !base) return null;
  const prefix = `${base}/storage/v1/object/public/${MEDIA_BUCKET}/`;
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}

/** 더 이상 쓰지 않는 파일 정리. 실패해도 저장 자체는 성공으로 둔다 */
async function removeUnusedFiles(urls: (string | null | undefined)[]) {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => !!p);
  if (!paths.length) return;
  const { error } = await getSupabaseAdminClient()
    .storage.from(MEDIA_BUCKET)
    .remove(paths);
  if (error) console.error("removeUnusedFiles failed:", error);
}

// ---------------------------------------------------------------------------
// 게임 저장 / 삭제
// ---------------------------------------------------------------------------

export type GameInput = {
  id?: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  url: string;
  tags: string[];
  date: string;
  published: boolean;
  worksheets: WorksheetFile[];
  grades: string[];
  unit: string;
  playTime: string;
};

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function cleanList(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export async function saveGame(
  input: GameInput,
): Promise<{ id: string } | { error: string }> {
  await requireAdmin();

  const title = input.title.trim();
  if (!title) return { error: "제목을 입력해주세요." };

  const url = input.url.trim();
  if (url && !isHttpUrl(url)) {
    return { error: "게임 주소는 https://로 시작하는 주소여야 합니다." };
  }
  if (input.thumbnailUrl && !isHttpUrl(input.thumbnailUrl)) {
    return { error: "썸네일 주소가 올바르지 않습니다." };
  }
  const worksheets = input.worksheets
    .filter((w) => isHttpUrl(w.url))
    .map((w) => ({ name: w.name.trim() || "활동지", url: w.url }));

  const date = input.date.trim();
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "날짜 형식이 올바르지 않습니다." };
  }

  const row = {
    title,
    description: input.description.trim(),
    thumbnail_url: input.thumbnailUrl || null,
    url: url || null,
    tags: cleanList(input.tags),
    date: date || null,
    published: input.published,
    worksheets,
    grades: cleanList(input.grades),
    unit: input.unit.trim(),
    play_time: input.playTime.trim(),
  };

  const supabase = getSupabaseAdminClient();
  let id = input.id;
  let previousFiles: string[] = [];

  if (id) {
    const { data: prev } = await supabase
      .from("games")
      .select("thumbnail_url, worksheets")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("games").update(row).eq("id", id);
    if (error) return { error: `저장하지 못했습니다: ${error.message}` };

    if (prev) {
      const kept = new Set([row.thumbnail_url, ...worksheets.map((w) => w.url)]);
      previousFiles = [
        prev.thumbnail_url,
        ...((prev.worksheets ?? []) as WorksheetFile[]).map((w) => w.url),
      ].filter((u): u is string => !!u && !kept.has(u));
    }
  } else {
    // 새 게임은 목록 맨 위에 오도록 지금 가장 큰 순서값 + 1
    const { data: top } = await supabase
      .from("games")
      .select("priority")
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("games")
      .insert({ ...row, priority: (top?.priority ?? 0) + 1 })
      .select("id")
      .single();
    if (error || !data) return { error: `저장하지 못했습니다: ${error?.message}` };
    id = data.id as string;
  }

  await removeUnusedFiles(previousFiles);
  updateTag(GAMES_CACHE_TAG);
  return { id };
}

export async function deleteGame(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  const { data: prev } = await supabase
    .from("games")
    .select("thumbnail_url, worksheets")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) return { error: `삭제하지 못했습니다: ${error.message}` };

  if (prev) {
    await removeUnusedFiles([
      prev.thumbnail_url,
      ...((prev.worksheets ?? []) as WorksheetFile[]).map((w) => w.url),
    ]);
  }
  updateTag(GAMES_CACHE_TAG);
  return { ok: true };
}

/** 목록에서 공개/비공개를 바로 전환 */
export async function setGamePublished(
  id: string,
  published: boolean,
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();
  const { error } = await getSupabaseAdminClient()
    .from("games")
    .update({ published })
    .eq("id", id);
  if (error) return { error: `변경하지 못했습니다: ${error.message}` };
  updateTag(GAMES_CACHE_TAG);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 목록 순서 (priority는 화면에 보이지 않는 내부 정렬값: 클수록 앞)
// ---------------------------------------------------------------------------

/** 관리자 목록에서 끌어다 놓은 순서를 그대로 저장한다 (맨 앞이 가장 큰 값) */
export async function saveGameOrder(
  orderedIds: string[],
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: readError } = await supabase
    .from("games")
    .select("id");
  if (readError) return { error: `순서를 저장하지 못했습니다: ${readError.message}` };

  // 목록을 연 뒤 다른 곳에서 추가/삭제된 게임이 있으면 덮어쓰지 않는다
  const known = new Set((existing ?? []).map((r) => r.id as string));
  const unique = new Set(orderedIds);
  if (
    unique.size !== orderedIds.length ||
    orderedIds.length !== known.size ||
    orderedIds.some((id) => !known.has(id))
  ) {
    return { error: "목록이 바뀌었습니다. 새로고침한 뒤 다시 시도해주세요." };
  }

  const total = orderedIds.length;
  const { error } = await supabase
    .from("games")
    .upsert(orderedIds.map((id, i) => ({ id, priority: total - i })), {
      onConflict: "id",
    });
  if (error) return { error: `순서를 저장하지 못했습니다: ${error.message}` };

  updateTag(GAMES_CACHE_TAG);
  return { ok: true };
}

/** 날짜(없으면 등록일)가 최근인 순서로 전체를 다시 정렬한다 */
export async function resetGameOrderByDate(): Promise<
  { ok: true } | { error: string }
> {
  await requireAdmin();

  const { data, error } = await getSupabaseAdminClient()
    .from("games")
    .select("id, date, created_at");
  if (error) return { error: `정렬하지 못했습니다: ${error.message}` };

  const key = (r: { date: string | null; created_at: string }) =>
    r.date ?? r.created_at.slice(0, 10);
  const sorted = [...(data ?? [])].sort(
    (a, b) =>
      key(b).localeCompare(key(a)) || b.created_at.localeCompare(a.created_at),
  );
  return saveGameOrder(sorted.map((r) => r.id as string));
}

// ---------------------------------------------------------------------------
// 소개 섹션
// ---------------------------------------------------------------------------

export type AboutInput = {
  title: string;
  paragraphs: string[];
  profileImage: string | null;
  bannerImage: string | null;
};

export async function saveAbout(
  input: AboutInput,
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  for (const img of [input.profileImage, input.bannerImage]) {
    if (img && !isHttpUrl(img) && !img.startsWith("/")) {
      return { error: "이미지 주소가 올바르지 않습니다." };
    }
  }

  const supabase = getSupabaseAdminClient();
  const { data: prev } = await supabase
    .from("site_about")
    .select("profile_image, banner_image")
    .eq("id", 1)
    .maybeSingle();

  const row = {
    id: 1,
    title: input.title.trim(),
    paragraphs: input.paragraphs.map((p) => p.trim()).filter(Boolean),
    profile_image: input.profileImage || null,
    banner_image: input.bannerImage || null,
  };

  const { error } = await supabase.from("site_about").upsert(row);
  if (error) return { error: `저장하지 못했습니다: ${error.message}` };

  if (prev) {
    const kept = new Set([row.profile_image, row.banner_image]);
    await removeUnusedFiles(
      [prev.profile_image, prev.banner_image].filter((u) => !kept.has(u)),
    );
  }
  updateTag(ABOUT_CACHE_TAG);
  return { ok: true };
}
