"use client";

import { History, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { GameItem } from "@/lib/games";
import { recentStore } from "@/lib/local-store";

/** 상세 페이지에 들어가면 "최근 본 자료"에 기록한다 */
export function RecordRecent({ gameId }: { gameId: string }) {
  useEffect(() => {
    recentStore.touch(gameId);
  }, [gameId]);
  return null;
}

/** 다시 찾기 쉽도록 최근에 본 자료를 가로로 보여준다 (이 기기 기준) */
export function RecentlyViewed({
  games,
  excludeId,
}: {
  games: GameItem[];
  excludeId?: string;
}) {
  const ids = recentStore.useIds();
  const items = useMemo(() => {
    const byId = new Map(games.map((g) => [g.id, g]));
    return ids
      .filter((id) => id !== excludeId)
      .map((id) => byId.get(id))
      .filter((g): g is GameItem => Boolean(g))
      .slice(0, 8);
  }, [ids, games, excludeId]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recent-title" className="fade-up mb-14">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="recent-title"
          className="flex items-center gap-2 text-sm text-mist"
        >
          <History
            className="h-4 w-4 text-gold"
            strokeWidth={1.75}
            aria-hidden
          />
          최근 본 자료
        </h2>
        <button
          type="button"
          onClick={() => recentStore.clear()}
          className="inline-flex items-center gap-1 text-xs text-fog transition hover:text-ivory"
        >
          <X className="h-3 w-3" aria-hidden />
          기록 지우기
        </button>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {items.map((g) => (
          <li key={g.id} className="w-56 shrink-0 snap-start">
            <Link
              href={`/program/${g.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-ink-2/70 p-2 pr-4 transition duration-300 hover:border-gold/40 hover:bg-ink-2"
            >
              <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-3">
                {g.thumbnail && (
                  <Image
                    src={g.thumbnail}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                )}
              </span>
              <span className="line-clamp-2 text-[13px] leading-snug text-ivory">
                {g.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
