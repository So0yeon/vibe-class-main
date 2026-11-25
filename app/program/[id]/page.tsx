import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { BackToTop } from "@/components/BackToTop";
import { VibeyCorner } from "@/components/vibey/VibeyCorner";
import { CommentSection } from "@/components/community/CommentSection";
import { ProgramStats } from "@/components/community/ProgramStats";
import { FavoriteButton } from "@/components/game/FavoriteButton";
import { PlayButton } from "@/components/game/PlayButton";
import { ShareButton } from "@/components/game/ShareButton";
import { WorksheetLinks } from "@/components/game/WorksheetLinks";
import { SiteNav } from "@/components/nav/SiteNav";
import { RecentlyViewed, RecordRecent } from "@/components/RecentlyViewed";
import { SiteFooter } from "@/components/SiteFooter";
import { Snowfall } from "@/components/winter/Snowfall";
import { getAbout } from "@/lib/about";
import { isAdmin } from "@/lib/admin/auth";
import { getComments, getProgramStats } from "@/lib/community";
import { formatGameDate, type GameItem } from "@/lib/games";
import { getGameById, getPublishedGames } from "@/lib/games-data";
import { isWinterSeason, kstDateKey } from "@/lib/season";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const game = await getGameById(id);
    if (!game) return {};

    return {
      title: `${game.title} │ Vibe Class`,
      description: game.description || undefined,
      openGraph: game.thumbnail
        ? { images: [{ url: game.thumbnail }] }
        : undefined,
    };
  } catch {
    return {};
  }
}

function BackLink() {
  return (
    <Link
      href="/#archive"
      className="group inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-ivory"
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
        aria-hidden
      />
      아카이브로 돌아가기
    </Link>
  );
}

/** 같은 과목·학년이 많이 겹치는 자료부터 추천 */
function relatedGames(game: GameItem, all: GameItem[], limit = 3): GameItem[] {
  return all
    .filter((g) => g.id !== game.id)
    .map((g) => ({
      g,
      score:
        g.tags.filter((t) => game.tags.includes(t)).length * 2 +
        g.grades.filter((t) => game.grades.includes(t)).length +
        (g.unit && g.unit === game.unit ? 3 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.g.priority - a.g.priority)
    .slice(0, limit)
    .map((x) => x.g);
}

export default async function ProgramPage({ params }: Props) {
  const { id } = await params;
  const today = kstDateKey();
  const winter = isWinterSeason(today);

  let game;
  try {
    game = await getGameById(id);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
    return (
      <div className="relative flex min-h-full flex-col">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-24 sm:px-6">
          <BackLink />
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-garnet/40 bg-garnet/10 px-5 py-4 text-sm text-[#f3c3cd]"
          >
            {message}
          </div>
        </main>
        <SiteFooter winter={winter} />
      </div>
    );
  }

  if (!game) notFound();

  const [
    { stats },
    { comments, available: commentsAvailable },
    admin,
    about,
    allGames,
  ] = await Promise.all([
    getProgramStats(id),
    getComments(id),
    isAdmin(),
    getAbout(),
    getPublishedGames().catch(() => [] as GameItem[]),
  ]);

  const formattedDate = formatGameDate(game.date);
  const related = relatedGames(game, allGames);
  const facts = [
    game.playTime.trim() && {
      label: "플레이 시간",
      value: game.playTime.trim(),
    },
    game.grades.length > 0 && { label: "학년", value: game.grades.join(", ") },
    game.unit.trim() && { label: "단원", value: game.unit.trim() },
    formattedDate && { label: "공개일", value: formattedDate },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="grain relative flex min-h-full flex-col overflow-x-clip">
      {/* 썸네일을 크게 흐려 깐 배경 — 자료마다 다른 분위기 */}
      {game.thumbnail && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[80vh] overflow-hidden"
        >
          <Image
            src={game.thumbnail}
            alt=""
            fill
            sizes="100vw"
            className="scale-125 object-cover opacity-30 blur-[90px] saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/70 to-ink" />
        </div>
      )}
      {winter && <Snowfall />}
      <RecordRecent gameId={game.id} />

      <SiteNav about={about} games={allGames} winter={winter} />

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <BackLink />

        <article className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[30px] border border-line bg-ink-2/60 p-2 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
              <ViewTransition
                name={`thumb-${game.id}`}
                share="morph"
                default="none"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-ink-3">
                  {game.thumbnail ? (
                    <Image
                      src={game.thumbnail}
                      alt={game.title}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 640px"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#1f3a2f,#0f1613)] font-display text-7xl italic text-gold/60">
                      {game.title.slice(0, 1)}
                    </div>
                  )}
                </div>
              </ViewTransition>
            </div>
          </div>

          <div className="fade-up flex flex-col">
            {game.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {game.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gold/30 px-3 py-1 text-xs text-gold-soft"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="mt-5 font-serif-kr text-3xl font-bold leading-[1.3] tracking-tight text-ivory sm:text-[40px]">
              {game.title}
            </h1>

            {game.description && (
              <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.9] text-mist sm:text-base">
                {game.description}
              </p>
            )}

            {facts.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
                {facts.map((f, i) => (
                  <div
                    key={f.label}
                    className={`bg-ink-2 px-4 py-3.5 ${
                      facts.length % 2 === 1 && i === facts.length - 1
                        ? "col-span-2"
                        : ""
                    }`}
                  >
                    <dt className="flex items-center gap-1.5 text-xs text-fog">
                      {f.label === "플레이 시간" && (
                        <Clock className="h-3 w-3" aria-hidden />
                      )}
                      {f.label}
                    </dt>
                    <dd className="mt-1 text-sm text-ivory">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8 flex flex-col gap-2.5">
              <PlayButton url={game.url} size="lg" />
              <WorksheetLinks worksheets={game.worksheets} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-6">
              <ProgramStats
                programId={game.id}
                initialViews={stats.views}
                initialLikes={stats.likes}
              />
              <span className="flex-1" />
              <FavoriteButton
                gameId={game.id}
                title={game.title}
                variant="pill"
              />
              <ShareButton title={game.title} />
            </div>
          </div>
        </article>

        <div className="mx-auto mt-20 max-w-3xl">
          <CommentSection
            programId={game.id}
            initialComments={comments}
            commentsAvailable={commentsAvailable}
            isAdmin={admin}
          />
        </div>

        {related.length > 0 && (
          <section className="reveal mt-24" aria-labelledby="related-title">
            <p className="eyebrow">You might also like</p>
            <h2
              id="related-title"
              className="mt-3 font-display text-4xl text-ivory sm:text-5xl"
            >
              함께 쓰기 좋은 <em className="text-gold">수업</em>
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {related.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/program/${g.id}`}
                    className="group block rounded-[24px] border border-line bg-ink-2/70 p-2 transition duration-500 hover:-translate-y-1 hover:border-gold/40"
                  >
                    <span className="relative block aspect-[16/10] overflow-hidden rounded-[18px] bg-ink-3">
                      {g.thumbnail && (
                        <Image
                          src={g.thumbnail}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="block px-2 pb-2 pt-3">
                      <span className="line-clamp-1 text-[15px] font-medium text-ivory">
                        {g.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-gold/80">
                        {[...g.tags, ...g.grades].slice(0, 3).join("  ·  ")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-20">
          <RecentlyViewed games={allGames} excludeId={game.id} />
        </div>
      </main>

      <SiteFooter winter={winter} />
      <BackToTop />
      <VibeyCorner />
    </div>
  );
}
