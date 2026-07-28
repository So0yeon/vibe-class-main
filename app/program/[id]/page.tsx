import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/community/CommentSection";
import { ProgramStats } from "@/components/community/ProgramStats";
import { PlayButton } from "@/components/game/PlayButton";
import { WorksheetLinks } from "@/components/game/WorksheetLinks";
import { getComments, getProgramStats } from "@/lib/community";
import { buildMetaPills, formatGameDate, getGameById } from "@/lib/notion";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
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
      href="/"
      className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-200"
    >
      ← 목록으로 돌아가기
    </Link>
  );
}

export default async function ProgramPage({ params }: Props) {
  const { id } = await params;

  let game;
  try {
    game = await getGameById(id);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
    return (
      <div className="relative flex min-h-full flex-col bg-[#0f172a] text-slate-200">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
          <BackLink />
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          >
            {message}
          </div>
        </main>
      </div>
    );
  }

  if (!game) notFound();

  const [{ stats }, { comments, available: commentsAvailable }] =
    await Promise.all([getProgramStats(id), getComments(id)]);

  const metaPills = buildMetaPills(game);
  const formattedDate = formatGameDate(game.date);

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-[#0f172a] text-slate-200">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]"
      />
      <div
        aria-hidden
        className="bg-tech-grid pointer-events-none absolute inset-0 opacity-60"
      />

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <BackLink />

        <article className="overflow-hidden rounded-2xl border border-slate-600/50 bg-[#1e293b] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
            {game.thumbnail ? (
              <Image
                src={game.thumbnail}
                alt={game.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <span className="text-6xl opacity-60">🎮</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-7">
            {game.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {game.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-cyan-500/30 bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {formattedDate && (
              <time
                dateTime={game.date ?? undefined}
                className="font-mono text-[11px] font-medium tracking-wider text-cyan-500/70 uppercase"
              >
                {formattedDate}
              </time>
            )}

            <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              {game.title}
            </h1>

            {metaPills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {metaPills.map((meta, index) => (
                  <span
                    key={`${meta}-${index}`}
                    className="max-w-full truncate rounded-md border border-cyan-500/30 bg-slate-900/70 px-2 py-1 text-[11px] font-medium leading-none text-cyan-200/90"
                  >
                    {meta}
                  </span>
                ))}
              </div>
            )}

            {game.description && (
              <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
                {game.description}
              </p>
            )}

            <ProgramStats
              programId={game.id}
              initialViews={stats.views}
              initialLikes={stats.likes}
            />

            <div className="flex flex-col gap-2 pt-2">
              <PlayButton url={game.url} />
              <WorksheetLinks worksheets={game.worksheets} />
            </div>
          </div>
        </article>

        <CommentSection
          programId={game.id}
          initialComments={comments}
          commentsAvailable={commentsAvailable}
        />
      </main>
    </div>
  );
}
