"use client";

import {
  ArrowUpRight,
  CornerDownLeft,
  History,
  Search,
  Snowflake,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { GameItem } from "@/lib/games";
import { recentStore, snowStore } from "@/lib/local-store";
import { toast } from "@/lib/ui-events";
import { useModal } from "@/lib/use-modal";

const INSTAGRAM_URL = "https://www.instagram.com/vibeclas.s/";
const MAX_RESULTS = 8;

type Entry = {
  id: string;
  icon: ReactNode;
  title: string;
  hint?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  games: GameItem[];
  winter: boolean;
  onOpenAbout: () => void;
};

/** 제목·설명·과목·학년·단원을 한 번에 훑는 검색 (공백으로 나눈 단어가 모두 들어 있어야 함) */
function searchGames(games: GameItem[], query: string): GameItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return games
    .filter((g) => {
      const haystack = [g.title, g.description, g.unit, ...g.tags, ...g.grades]
        .join(" ")
        .toLowerCase();
      return words.every((w) => haystack.includes(w));
    })
    .slice(0, MAX_RESULTS);
}

export function CommandPalette({
  open,
  onClose,
  games,
  winter,
  onOpenAbout,
}: Props) {
  useModal(open, onClose);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <PaletteBody
      games={games}
      winter={winter}
      onClose={onClose}
      onOpenAbout={onOpenAbout}
    />,
    document.body,
  );
}

function PaletteBody({
  games,
  winter,
  onClose,
  onOpenAbout,
}: Omit<Props, "open">) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const recentIds = recentStore.useIds();
  const snowOn = snowStore.useFlag();

  const gameEntry = (g: GameItem, icon?: ReactNode): Entry => ({
    id: `game-${g.id}`,
    icon: icon ?? (
      <span className="relative block h-8 w-11 overflow-hidden rounded-md bg-ink-3">
        {g.thumbnail && (
          <Image
            src={g.thumbnail}
            alt=""
            fill
            className="object-cover"
            sizes="44px"
          />
        )}
      </span>
    ),
    title: g.title,
    hint: [...g.tags.slice(0, 2), ...g.grades.slice(0, 1)].join(" · "),
    run: () => {
      onClose();
      router.push(`/program/${g.id}`);
    },
  });

  const sections = useMemo(() => {
    const q = query.trim();
    if (q) {
      return [
        {
          title: "수업자료",
          entries: searchGames(games, q).map((g) => gameEntry(g)),
        },
      ];
    }

    const byId = new Map(games.map((g) => [g.id, g]));
    const recent = recentIds
      .map((id) => byId.get(id))
      .filter((g): g is GameItem => Boolean(g))
      .slice(0, 4)
      .map((g) =>
        gameEntry(
          g,
          <History className="h-4 w-4 text-fog" strokeWidth={1.75} />,
        ),
      );

    const actions: Entry[] = [
      ...(winter
        ? [
            {
              id: "snow",
              icon: (
                <Snowflake className="h-4 w-4 text-gold" strokeWidth={1.75} />
              ),
              title: snowOn ? "눈 내리기 끄기" : "눈 내리기 켜기",
              run: () => {
                snowStore.set(!snowOn);
                toast(
                  snowOn ? "눈이 그쳤어요" : "눈이 내리기 시작해요",
                  "gold",
                );
                onClose();
              },
            },
          ]
        : []),
      {
        id: "about",
        icon: <UserRound className="h-4 w-4 text-gold" strokeWidth={1.75} />,
        title: "제작자 소개",
        run: () => {
          onClose();
          onOpenAbout();
        },
      },
      {
        id: "insta",
        icon: <ArrowUpRight className="h-4 w-4 text-gold" strokeWidth={1.75} />,
        title: "인스타그램에서 소식 보기",
        run: () => {
          onClose();
          window.open(INSTAGRAM_URL, "_blank", "noopener,noreferrer");
        },
      },
    ];

    return [
      ...(recent.length ? [{ title: "최근 본 자료", entries: recent }] : []),
      { title: "바로가기", entries: actions },
    ];
    // gameEntry는 매 렌더 새로 만들어지지만 결과는 아래 값들에만 의존한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, games, recentIds, snowOn, winter]);

  const flat = sections.flatMap((s) => s.entries);
  const activeIndex = Math.min(active, Math.max(0, flat.length - 1));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((activeIndex + 1) % Math.max(1, flat.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((activeIndex - 1 + flat.length) % Math.max(1, flat.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[activeIndex]?.run();
    }
  };

  let cursor = -1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center px-3 pt-[12vh] sm:px-4">
      <button
        type="button"
        aria-label="검색 닫기"
        onClick={onClose}
        className="overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="빠른 검색"
        className="panel-in relative w-full max-w-xl overflow-hidden rounded-3xl border border-line-strong bg-ink-2/95 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search
            className="h-4 w-4 shrink-0 text-gold"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="수업자료, 과목, 학년, 단원… (예: 5학년 과학)"
            className="h-14 w-full bg-transparent text-[15px] text-ivory placeholder:text-fog focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={
              flat[activeIndex] ? `palette-${flat[activeIndex].id}` : undefined
            }
          />
          <kbd className="hidden rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[10px] text-fog sm:block">
            ESC
          </kbd>
        </div>

        <div
          id="palette-list"
          role="listbox"
          className="max-h-[56vh] overflow-y-auto p-2"
        >
          {flat.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-mist">
              “{query}”에 맞는 자료가 없어요.
            </p>
          ) : (
            sections.map((section) => (
              <div key={section.title} className="mb-1">
                <p className="px-3 pb-1 pt-3 text-[11px] font-medium tracking-wide text-fog">
                  {section.title}
                </p>
                {section.entries.map((entry) => {
                  cursor += 1;
                  const index = cursor;
                  const selected = index === activeIndex;
                  return (
                    <div
                      key={entry.id}
                      id={`palette-${entry.id}`}
                      role="option"
                      aria-selected={selected}
                      onMouseMove={() => setActive(index)}
                      onClick={entry.run}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                        selected ? "bg-white/[0.06]" : ""
                      }`}
                    >
                      <span className="grid w-11 shrink-0 place-items-center">
                        {entry.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ivory">
                          {entry.title}
                        </span>
                        {entry.hint && (
                          <span className="block truncate text-xs text-fog">
                            {entry.hint}
                          </span>
                        )}
                      </span>
                      {selected && (
                        <CornerDownLeft
                          className="h-3.5 w-3.5 shrink-0 text-gold"
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-2.5 font-mono text-[10px] text-fog">
          <span>↑↓ 이동 · ↵ 열기</span>
          <span className="hidden sm:inline">⌘K / Ctrl K 로 언제든</span>
        </div>
      </div>
    </div>
  );
}
