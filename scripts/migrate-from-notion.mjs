// Notion DB → Supabase 1회성 이전 스크립트
//
// 사용법 (프로젝트 폴더에서):
//   node --env-file=.env.local scripts/migrate-from-notion.mjs --dry-run   # 미리보기만
//   node --env-file=.env.local scripts/migrate-from-notion.mjs             # 실제 이전
//   node --env-file=.env.local scripts/migrate-from-notion.mjs --overwrite # 이미 옮긴 항목도 다시 덮어쓰기
//
// 필요한 환경변수: NOTION_TOKEN, NOTION_DATABASE_ID, (선택) NOTION_ABOUT_PAGE_ID,
//                 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// - Notion에 올린 썸네일/활동지/소개 이미지를 내려받아 Supabase Storage(media)에 올린다.
// - 게임 id는 Notion 페이지 id를 그대로 써서 조회수·좋아요·댓글이 이어지게 한다.
// - 기본값은 이미 Supabase에 있는 게임은 건너뛴다 (관리자 페이지에서 고친 내용 보호).

import { createClient } from "@supabase/supabase-js";

const NOTION_VERSION = "2022-06-28";
const BUCKET = "media";
const DRY_RUN = process.argv.includes("--dry-run");
const OVERWRITE = process.argv.includes("--overwrite");

const P = {
  title: "제목",
  tags: "과목",
  description: "설명",
  thumbnail: "썸네일",
  url: "URL",
  date: "날짜",
  published: "공개여부",
  priority: "우선순위",
  worksheet: "활동지",
  grade: "학년",
  unit: "단원",
  playTime: "플레이 시간",
};

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`✖ 환경변수 ${name}이(가) 비어 있습니다. .env.local을 확인하세요.`);
    process.exit(1);
  }
  return v;
}

const NOTION_TOKEN = requireEnv("NOTION_TOKEN");
const NOTION_DATABASE_ID = requireEnv("NOTION_DATABASE_ID");
const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const ABOUT_PAGE_ID = process.env.NOTION_ABOUT_PAGE_ID;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Notion API
// ---------------------------------------------------------------------------

async function notion(path, init = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function queryAllPages() {
  const pages = [];
  let cursor;
  do {
    const data = await notion(`/databases/${NOTION_DATABASE_ID}/query`, {
      method: "POST",
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages.filter((p) => !p.archived && !p.in_trash);
}

async function listAllBlocks(blockId) {
  const blocks = [];
  let cursor;
  do {
    const qs = new URLSearchParams({ page_size: "100" });
    if (cursor) qs.set("start_cursor", cursor);
    const data = await notion(`/blocks/${blockId}/children?${qs}`);
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

// ---------------------------------------------------------------------------
// 속성 읽기 (기존 lib/notion.ts와 같은 규칙)
// ---------------------------------------------------------------------------

const plain = (rich) => (rich ?? []).map((t) => t.plain_text).join("");
const getText = (p) => plain(p?.rich_text);
const getTitle = (p) => plain(p?.title) || "제목 없음";
const getSelectList = (p) =>
  p?.multi_select?.length
    ? p.multi_select.map((s) => s.name)
    : p?.select?.name
      ? [p.select.name]
      : [];
const getTextOrSelect = (p) =>
  getText(p) || p?.select?.name || (p?.number != null ? String(p.number) : "");

/** { kind: 'notion' | 'external', url, name } */
function fileRef(f) {
  if (!f) return null;
  const url = f.type === "external" ? f.external?.url : f.file?.url;
  if (!url) return null;
  return { kind: f.type === "external" ? "external" : "notion", url, name: f.name };
}

// ---------------------------------------------------------------------------
// 파일 옮기기
// ---------------------------------------------------------------------------

function extFrom(url, contentType) {
  const fromPath = new URL(url).pathname.split(".").pop()?.toLowerCase();
  if (fromPath && /^[a-z0-9]{1,8}$/.test(fromPath)) return fromPath;
  const map = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "application/pdf": "pdf" };
  return map[contentType] ?? "bin";
}

/** Notion에 올린 파일만 옮기고, 외부 링크는 그대로 둔다 */
async function transfer(ref, storageKey) {
  if (!ref) return null;
  if (ref.kind === "external") return ref.url;
  if (DRY_RUN) return `(옮길 예정) ${storageKey}`;

  const res = await fetch(ref.url);
  if (!res.ok) throw new Error(`파일 내려받기 실패 ${res.status}: ${storageKey}`);
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const path = `${storageKey}.${extFrom(ref.url, contentType)}`;
  const body = new Uint8Array(await res.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`Storage 업로드 실패 (${path}): ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------------------
// 실행
// ---------------------------------------------------------------------------

async function migrateGames() {
  const pages = await queryAllPages();
  console.log(`Notion에서 ${pages.length}개 항목을 찾았습니다.`);

  const { data: existing, error } = await supabase.from("games").select("id");
  if (error) throw new Error(`games 표를 읽지 못했습니다 (content.sql을 먼저 실행했나요?): ${error.message}`);
  const existingIds = new Set(existing.map((r) => r.id));

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const page of pages) {
    const p = page.properties;
    const title = getTitle(p[P.title]);

    if (existingIds.has(page.id) && !OVERWRITE) {
      console.log(`- 건너뜀 (이미 있음): ${title}`);
      skipped++;
      continue;
    }

    try {
      const key = page.id.replace(/-/g, "");
      const thumbRef = fileRef(p[P.thumbnail]?.files?.[0]) ?? fileRef(page.cover);
      const thumbnail_url = await transfer(thumbRef, `thumbnail/notion/${key}`);

      const worksheets = [];
      const files = p[P.worksheet]?.files ?? [];
      for (const [i, f] of files.entries()) {
        const ref = fileRef(f);
        if (!ref) continue;
        const url = await transfer(ref, `worksheet/notion/${key}-${i + 1}`);
        worksheets.push({ name: f.name?.trim() || `활동지 ${i + 1}`, url });
      }

      const grades = getSelectList(p[P.grade]);
      const row = {
        id: page.id,
        title,
        description: getText(p[P.description]),
        thumbnail_url,
        url: p[P.url]?.url ?? null,
        tags: getSelectList(p[P.tags]),
        date: p[P.date]?.date?.start?.slice(0, 10) ?? null,
        published: p[P.published]?.checkbox ?? false,
        priority: p[P.priority]?.number ?? 0,
        worksheets,
        grades: grades.length ? grades : ["전학년"],
        unit: getText(p[P.unit]),
        play_time: getTextOrSelect(p[P.playTime]),
        created_at: page.created_time,
      };

      if (DRY_RUN) {
        console.log(`✓ (미리보기) ${title}`, {
          공개: row.published,
          우선순위: row.priority,
          썸네일: row.thumbnail_url ? "있음" : "없음",
          활동지: worksheets.length,
        });
      } else {
        const { error: upsertError } = await supabase.from("games").upsert(row);
        if (upsertError) throw new Error(upsertError.message);
        console.log(`✓ ${title}`);
      }
      done++;
    } catch (e) {
      failed++;
      console.error(`✖ ${title}: ${e.message}`);
    }
  }

  console.log(`\n게임: 옮김 ${done} · 건너뜀 ${skipped} · 실패 ${failed}`);
  return failed;
}

async function migrateAbout() {
  if (!ABOUT_PAGE_ID) {
    console.log("NOTION_ABOUT_PAGE_ID가 없어 소개 섹션은 건너뜁니다 (관리자 페이지에서 직접 입력하세요).");
    return 0;
  }

  const { data: existing } = await supabase.from("site_about").select("id").eq("id", 1).maybeSingle();
  if (existing && !OVERWRITE) {
    console.log("- 소개 섹션은 이미 있어서 건너뜁니다.");
    return 0;
  }

  try {
    const id = ABOUT_PAGE_ID.replace(/-/g, "").match(/[0-9a-fA-F]{32}/)?.[0] ?? ABOUT_PAGE_ID;
    const page = await notion(`/pages/${id}`);
    const blocks = await listAllBlocks(id);

    const titleProp = Object.values(page.properties ?? {}).find((v) => v.type === "title");
    const firstImage = blocks.findIndex((b) => b.type === "image");
    const paragraphs = blocks
      .slice(firstImage >= 0 ? firstImage + 1 : 0)
      .map((b) => plain(b[b.type]?.rich_text).trim())
      .filter(Boolean);

    const row = {
      id: 1,
      title: plain(titleProp?.title).trim(),
      paragraphs,
      banner_image: firstImage >= 0 ? await transfer(fileRef(blocks[firstImage].image), "about/notion/banner") : null,
      profile_image: await transfer(fileRef(page.cover), "about/notion/profile"),
    };

    if (DRY_RUN) {
      console.log("✓ (미리보기) 소개 섹션", { 제목: row.title, 문단: paragraphs.length });
    } else {
      const { error } = await supabase.from("site_about").upsert(row);
      if (error) throw new Error(error.message);
      console.log("✓ 소개 섹션");
    }
    return 0;
  } catch (e) {
    console.error(`✖ 소개 섹션: ${e.message}`);
    return 1;
  }
}

if (DRY_RUN) console.log("※ 미리보기 모드 — 아무것도 저장하지 않습니다.\n");
const failures = (await migrateGames()) + (await migrateAbout());
process.exit(failures ? 1 : 0);
