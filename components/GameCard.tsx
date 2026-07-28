import Image from "next/image";
import Link from "next/link";
import type { ProgramStats } from "@/lib/community";
import { buildMetaPills, formatGameDate, type GameItem } from "@/lib/notion";
import { PlayButton } from "@/components/game/PlayButton";
import { WorksheetLinks } from "@/components/game/WorksheetLinks";

type Props = { game: GameItem; stats?: ProgramStats };

const MAX_VISIBLE_TAGS = 3;

export function GameCard({ game, stats }: Props) {
  const formattedDate = formatGameDate(game.date);
  const visibleTags = game.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTags = game.tags.slice(MAX_VISIBLE_TAGS);
  const metaPills = buildMetaPills(game);
  const hasMeta = metaPills.length > 0;
  const detailHref = `/program/${game.id}`;

  return (
    <article className="card-neon-glow group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-600/50 bg-[#1e293b] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      <div className="relative z-10 flex h-full flex-col">
        <Link
          href={detailHref}
          className="relative block aspect-[16/10] overflow-hidden bg-slate-800"
        >
          {game.thumbnail ? (
            <>
              <Image
                src={game.thumbnail}
                alt={game.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.04] group-hover:brightness-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent opacity-80" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <span className="text-5xl opacity-60 transition group-hover:scale-110 group-hover:opacity-90">
                🎮
              </span>
            </div>
          )}

          {game.tags.length > 0 && (
            <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-cyan-500/30 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
              {hiddenTags.length > 0 && (
                <span
                  className="cursor-default rounded-md border border-slate-500/40 bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-slate-400 backdrop-blur-sm"
                  title={hiddenTags.join(", ")}
                >
                  +{hiddenTags.length}
                </span>
              )}
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          {formattedDate && (
            <time
              dateTime={game.date ?? undefined}
              className="font-mono text-[11px] font-medium tracking-wider text-cyan-500/70 uppercase"
            >
              {formattedDate}
            </time>
          )}

          <h2 className="line-clamp-2 text-lg font-semibold tracking-tight text-slate-100">
            <Link
              href={detailHref}
              className="transition hover:text-white group-hover:text-white"
            >
              {game.title}
            </Link>
          </h2>

          {stats && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>❤️</span>
                {stats.likes.toLocaleString("ko-KR")}
              </span>
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>👀</span>
                {stats.views.toLocaleString("ko-KR")}
              </span>
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>💬</span>
                {stats.commentCount.toLocaleString("ko-KR")}
              </span>
            </div>
          )}

          {hasMeta && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {metaPills.map((meta, index) => (
                <span
                  key={`${meta}-${index}`}
                  className="max-w-full truncate rounded-md border border-cyan-500/30 bg-slate-900/70 px-2 py-1 text-[11px] font-medium leading-none text-cyan-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:max-w-[12rem]"
                  title={meta}
                >
                  {meta}
                </span>
              ))}
            </div>
          )}

          {game.description && (
            <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-slate-400 group-hover:text-slate-300">
              {game.description}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2">
            <PlayButton url={game.url} />
            <WorksheetLinks worksheets={game.worksheets} />
          </div>
        </div>
      </div>
    </article>
  );
}
