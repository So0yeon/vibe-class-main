"use client";

import { Clock, Eye, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { FavoriteButton } from "@/components/game/FavoriteButton";
import { PlayButton } from "@/components/game/PlayButton";
import { WorksheetLinks } from "@/components/game/WorksheetLinks";
import type { ProgramStats } from "@/lib/community";
import { formatGameDate, type GameItem } from "@/lib/games";
import { useInteractiveCard } from "@/lib/use-interactive-card";

type Props = { game: GameItem; stats?: ProgramStats };

const MAX_VISIBLE_TAGS = 2;

function compact(n: number) {
  return new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(n);
}

export function GameCard({ game, stats }: Props) {
  const { ref, onPointerMove, onPointerLeave } =
    useInteractiveCard<HTMLElement>();
  const formattedDate = formatGameDate(game.date);
  const visibleTags = game.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = game.tags.length - visibleTags.length;
  const meta = [...game.grades, game.unit.trim()].filter(Boolean);
  const detailHref = `/program/${game.id}`;

  return (
    <article
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="spotlight tilt group relative flex h-full flex-col rounded-[26px] border border-line bg-ink-2/80 p-2 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="relative">
          <Link
            href={detailHref}
            className="relative block aspect-[16/10] overflow-hidden rounded-[20px] bg-ink-3"
            aria-label={`${game.title} 자세히 보기`}
          >
            <ViewTransition
              name={`thumb-${game.id}`}
              share="morph"
              default="none"
            >
              <div className="absolute inset-0">
                {game.thumbnail ? (
                  <Image
                    src={game.thumbnail}
                    alt=""
                    fill
                    className="object-cover transition duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#1f3a2f,#0f1613)]">
                    <span className="font-display text-5xl italic text-gold/60">
                      {game.title.slice(0, 1)}
                    </span>
                  </div>
                )}
              </div>
            </ViewTransition>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
          </Link>

          {game.tags.length > 0 && (
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md"
                >
                  {tag}
                </span>
              ))}
              {hiddenCount > 0 && (
                <span
                  className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white/60 backdrop-blur-md"
                  title={game.tags.slice(MAX_VISIBLE_TAGS).join(", ")}
                >
                  +{hiddenCount}
                </span>
              )}
            </div>
          )}

          <div className="absolute right-3 top-3">
            <FavoriteButton gameId={game.id} title={game.title} />
          </div>

          {game.playTime.trim() && (
            <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur-md">
              <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
              {game.playTime.trim()}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 pb-3 pt-4 sm:px-4">
          <div className="flex items-center justify-between gap-3 text-[11px] text-fog">
            {formattedDate ? (
              <time
                dateTime={game.date ?? undefined}
                className="font-mono tracking-wider"
              >
                {formattedDate}
              </time>
            ) : (
              <span />
            )}
            {stats && (
              <span className="flex items-center gap-3 font-mono">
                <span className="inline-flex items-center gap-1" title="좋아요">
                  <Heart className="h-3 w-3" strokeWidth={2} aria-hidden />
                  <span className="sr-only">좋아요</span>
                  {compact(stats.likes)}
                </span>
                <span className="inline-flex items-center gap-1" title="조회수">
                  <Eye className="h-3 w-3" strokeWidth={2} aria-hidden />
                  <span className="sr-only">조회수</span>
                  {compact(stats.views)}
                </span>
                <span className="inline-flex items-center gap-1" title="댓글">
                  <MessageCircle
                    className="h-3 w-3"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="sr-only">댓글</span>
                  {compact(stats.commentCount)}
                </span>
              </span>
            )}
          </div>

          <h2 className="mt-2.5 line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight text-ivory">
            <Link
              href={detailHref}
              className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]"
            >
              {game.title}
            </Link>
          </h2>

          {meta.length > 0 && (
            <p className="mt-1.5 truncate text-xs text-gold/80">
              {meta.join("  ·  ")}
            </p>
          )}

          {game.description && (
            <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-mist">
              {game.description}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <PlayButton url={game.url} />
            {game.worksheets.length > 0 && (
              <div className="grid gap-2">
                <WorksheetLinks worksheets={game.worksheets} />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
