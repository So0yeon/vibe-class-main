import { getSupabaseClient } from "@/lib/supabase";

export type AboutContent = {
  title: string;
  paragraphs: string[];
  profileImage: string | null;
  bannerImage: string;
};

export const DEFAULT_ABOUT: AboutContent = {
  title: "바이브클래스 소개",
  paragraphs: [
    "안녕하세요. 저는 서울의 초등학교에서 근무하는 현직 교사입니다.",
    "학생들이 수업 속에서 더 몰입하고 즐겁게 배울 수 있도록 교육용 게임과 시뮬레이션을 직접 제작하고 있습니다.",
    "이 사이트의 콘텐츠는 실제 수업 경험을 바탕으로 설계되었으며, 교실에서 바로 활용할 수 있도록 제작되었습니다.",
  ],
  profileImage: null,
  bannerImage: "/og-image.png",
};

/** 관리자 페이지가 저장할 때 updateTag(ABOUT_CACHE_TAG)로 캐시를 비운다 */
export const ABOUT_CACHE_TAG = "about";

export type AboutRow = {
  title: string;
  paragraphs: string[] | null;
  profile_image: string | null;
  banner_image: string | null;
};

export function mapAboutRow(row: AboutRow | null): AboutContent {
  if (!row) return DEFAULT_ABOUT;
  const paragraphs = (row.paragraphs ?? []).filter((p) => p.trim());
  return {
    title: row.title.trim() || DEFAULT_ABOUT.title,
    paragraphs: paragraphs.length ? paragraphs : DEFAULT_ABOUT.paragraphs,
    profileImage: row.profile_image,
    bannerImage: row.banner_image || DEFAULT_ABOUT.bannerImage,
  };
}

/** Supabase site_about(id = 1)에서 소개 섹션을 불러온다. 없거나 실패하면 기본 문구 */
export async function getAbout(): Promise<AboutContent> {
  const supabase = getSupabaseClient({
    revalidateSeconds: 300,
    tags: [ABOUT_CACHE_TAG],
  });
  if (!supabase) return DEFAULT_ABOUT;

  try {
    const { data, error } = await supabase
      .from("site_about")
      .select("title, paragraphs, profile_image, banner_image")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return mapAboutRow(data as AboutRow | null);
  } catch (e) {
    console.error("getAbout failed:", e);
    return DEFAULT_ABOUT;
  }
}
