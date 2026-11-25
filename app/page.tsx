import { BackToTop } from "@/components/BackToTop";
import { VibeyCorner } from "@/components/vibey/VibeyCorner";
import { GameGallery } from "@/components/GameGallery";
import { Hero } from "@/components/hero/Hero";
import { Marquee } from "@/components/hero/Marquee";
import { SiteNav } from "@/components/nav/SiteNav";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { SiteFooter } from "@/components/SiteFooter";
import { AdventCalendar } from "@/components/winter/AdventCalendar";
import { Snowfall } from "@/components/winter/Snowfall";
import { getAbout } from "@/lib/about";
import { getAllProgramStats } from "@/lib/community";
import { extractSubjects, type GameItem } from "@/lib/games";
import { getPublishedGames } from "@/lib/games-data";
import { isWinterSeason, kstDateKey } from "@/lib/season";

export default async function Home() {
  let games: GameItem[] = [];
  let error: string | null = null;

  const about = await getAbout();

  try {
    games = await getPublishedGames();
  } catch (e) {
    error = e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
  }

  const { stats: statsMap, available: statsAvailable } =
    await getAllProgramStats();

  const today = kstDateKey();
  const winter = isWinterSeason(today);

  const totals =
    games.length > 0
      ? {
          games: games.length,
          views: games.reduce(
            (sum, g) => sum + (statsMap[g.id]?.views ?? 0),
            0,
          ),
          likes: games.reduce(
            (sum, g) => sum + (statsMap[g.id]?.likes ?? 0),
            0,
          ),
        }
      : null;

  const subjects = extractSubjects(games);
  const marqueeWords = winter
    ? [...subjects, "Merry Christmas", "Happy Teaching"]
    : [...subjects, "Vibe Coding", "Happy Teaching"];

  return (
    <div className="grain relative flex min-h-full flex-col overflow-x-clip">
      <div aria-hidden className="aurora h-[120vh]" />
      {winter && <Snowfall />}

      <SiteNav about={about} games={games} winter={winter} />

      <main className="relative flex-1">
        <Hero
          about={about}
          winter={winter}
          today={today}
          totals={statsAvailable ? totals : null}
        />

        <Marquee words={marqueeWords} />

        {winter && games.length > 0 && (
          <AdventCalendar games={games} serverToday={today} />
        )}

        <div
          className={`mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 lg:px-8 ${
            winter ? "pt-6" : "pt-20 sm:pt-28"
          }`}
        >
          <RecentlyViewed games={games} />

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-garnet/40 bg-garnet/10 px-5 py-4 text-sm text-[#f3c3cd]"
            >
              {error}
            </div>
          ) : games.length === 0 ? (
            <p className="rounded-[28px] border border-dashed border-line-strong px-6 py-20 text-center text-sm text-mist">
              공개된 게임이 없습니다. 관리자 페이지에서 공개로 설정한 항목만
              표시됩니다.
            </p>
          ) : (
            <GameGallery
              games={games}
              statsMap={statsMap}
              statsAvailable={statsAvailable}
            />
          )}
        </div>
      </main>

      <SiteFooter winter={winter} />
      <BackToTop />
      <VibeyCorner />
    </div>
  );
}
