"use client";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GameCard } from "@/components/GameCard";
import type { ProgramStats } from "@/lib/community";
import {
  extractGrades,
  extractSubjects,
  extractUnits,
  filterGames,
  type GameItem,
} from "@/lib/games";
import { favoritesStore } from "@/lib/local-store";

const PAGE_SIZE = 9;

type SortOption = "latest" | "popular" | "likes" | "views";

const SORT_LABELS: Record<SortOption, string> = {
  latest: "최신",
  popular: "인기",
  likes: "좋아요",
  views: "조회",
};
const SORT_KEYS = Object.keys(SORT_LABELS) as SortOption[];

// 인기순 가중치: 댓글 작성이 가장 적극적인 반응이라 가장 크게, 좋아요가 그다음
const POPULARITY_WEIGHT = { views: 1, likes: 3, comments: 5 } as const;

function statsOf(
  game: GameItem,
  statsMap: Record<string, ProgramStats>,
): ProgramStats {
  return statsMap[game.id] ?? { views: 0, likes: 0, commentCount: 0 };
}

function sortGames(
  games: GameItem[],
  sortOption: SortOption,
  statsMap: Record<string, ProgramStats>,
): GameItem[] {
  if (sortOption === "latest") return games;

  const scored = games.map((game) => ({
    game,
    stats: statsOf(game, statsMap),
  }));

  scored.sort((a, b) => {
    if (sortOption === "views") return b.stats.views - a.stats.views;
    if (sortOption === "likes") return b.stats.likes - a.stats.likes;

    const scoreOf = (s: ProgramStats) =>
      s.views * POPULARITY_WEIGHT.views +
      s.likes * POPULARITY_WEIGHT.likes +
      s.commentCount * POPULARITY_WEIGHT.comments;
    return scoreOf(b.stats) - scoreOf(a.stats);
  });

  return scored.map(({ game }) => game);
}

type Props = {
  games: GameItem[];
  statsMap: Record<string, ProgramStats>;
  statsAvailable: boolean;
};

export function GameGallery({ games, statsMap, statsAvailable }: Props) {
  const subjects = useMemo(() => extractSubjects(games), [games]);
  const grades = useMemo(() => extractGrades(games), [games]);
  const units = useMemo(() => extractUnits(games), [games]);
  const favorites = favoritesStore.useIds();

  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState("전체");
  const [activeGrade, setActiveGrade] = useState("전체");
  const [activeUnit, setActiveUnit] = useState("전체");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const gameListRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredGames = useMemo(() => {
    const filtered = filterGames(games, {
      search,
      subject: activeSubject,
      grade: activeGrade,
      unit: activeUnit,
    });
    return favoritesOnly
      ? filtered.filter((g) => favorites.includes(g.id))
      : filtered;
  }, [
    games,
    search,
    activeSubject,
    activeGrade,
    activeUnit,
    favoritesOnly,
    favorites,
  ]);

  const sortedGames = useMemo(
    () => sortGames(filteredGames, sortOption, statsMap),
    [filteredGames, sortOption, statsMap],
  );

  const totalPages = Math.max(1, Math.ceil(sortedGames.length / PAGE_SIZE));

  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedGames.slice(start, start + PAGE_SIZE);
  }, [sortedGames, currentPage]);

  // 필터/정렬이 바뀌면 1페이지로, 필터링 후 현재 페이지가 범위를 벗어나면 마지막
  // 페이지로 - 렌더링 도중 바로 보정해 깜빡임 없는 useEffect 없는 방식으로 처리
  const filterKey = `${search}|${activeSubject}|${activeGrade}|${activeUnit}|${sortOption}|${favoritesOnly}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  } else if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const activeFilters = [
    search.trim() && {
      label: `“${search.trim()}”`,
      clear: () => setSearch(""),
    },
    activeGrade !== "전체" && {
      label: activeGrade,
      clear: () => setActiveGrade("전체"),
    },
    activeSubject !== "전체" && {
      label: activeSubject,
      clear: () => setActiveSubject("전체"),
    },
    activeUnit !== "전체" && {
      label: activeUnit,
      clear: () => setActiveUnit("전체"),
    },
    favoritesOnly && {
      label: "찜한 자료",
      clear: () => setFavoritesOnly(false),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const panelFilterCount = [activeGrade, activeSubject, activeUnit].filter(
    (v) => v !== "전체",
  ).length;

  const resetFilters = () => {
    setSearch("");
    setActiveSubject("전체");
    setActiveGrade("전체");
    setActiveUnit("전체");
    setFavoritesOnly(false);
    setCurrentPage(1);
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    gameListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  // "/" 키로 검색창 포커스 (입력 중일 때는 무시)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sortIndex = SORT_KEYS.indexOf(sortOption);

  return (
    <section id="archive" className="scroll-mt-24">
      {/* 섹션 머리말 */}
      <div className="reveal mb-8 flex flex-col gap-6 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">The Archive</p>
          <h2 className="mt-3 font-display text-[40px] leading-[1.05] tracking-tight text-ivory sm:text-5xl">
            교실을 위한 <em className="text-gold">작은</em> 선물들
          </h2>
          <p className="mt-3 text-sm text-mist">
            지금{" "}
            <span className="font-mono text-ivory tabular-nums">
              {sortedGames.length}
            </span>
            개의 수업자료가 기다리고 있어요
            {totalPages > 1 && (
              <span className="text-fog">
                {" "}
                · {currentPage}/{totalPages} 페이지
              </span>
            )}
          </p>
        </div>

        {/* 정렬: 슬라이딩 인디케이터 세그먼트 */}
        <div
          role="radiogroup"
          aria-label="정렬"
          className="relative grid w-full grid-cols-4 rounded-full border border-line bg-ink-2/70 p-1 backdrop-blur sm:w-auto"
        >
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 rounded-full bg-ivory transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: "calc((100% - 0.5rem) / 4)",
              transform: `translateX(${sortIndex * 100}%)`,
            }}
          />
          {SORT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={sortOption === key}
              onClick={() => setSortOption(key)}
              className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 sm:px-5 ${
                sortOption === key ? "text-ink" : "text-mist hover:text-ivory"
              }`}
            >
              {SORT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 + 도구 */}
      <div className="sticky top-16 z-30 -mx-4 mb-4 bg-ink/80 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex gap-2">
          <label className="group/search relative flex min-w-0 flex-1 items-center">
            <span className="sr-only">수업자료 검색</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 z-10 h-4 w-4 text-fog transition-colors group-focus-within/search:text-gold"
              strokeWidth={1.75}
            />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목이나 설명으로 찾기"
              autoComplete="off"
              className="h-12 w-full rounded-full border border-line bg-ink-2/90 pl-11 pr-12 text-[15px] text-ivory backdrop-blur-xl transition duration-300 placeholder:text-fog focus:border-gold/50 focus:bg-ink-2 focus:outline-none focus:ring-4 focus:ring-gold/10"
            />
            <kbd className="pointer-events-none absolute right-4 hidden rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[11px] text-fog sm:block">
              /
            </kbd>
          </label>

          <button
            type="button"
            onClick={() => setIsFilterOpen((v) => !v)}
            aria-expanded={isFilterOpen}
            aria-controls="filter-panel"
            className={`relative inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-xl transition duration-300 sm:px-5 ${
              isFilterOpen || panelFilterCount
                ? "border-gold/50 bg-gold/10 text-gold-soft"
                : "border-line bg-ink-2/90 text-mist hover:border-line-strong hover:text-ivory"
            }`}
          >
            <SlidersHorizontal
              className="h-4 w-4"
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="hidden sm:inline">필터</span>
            {panelFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 font-mono text-[11px] font-semibold text-ink">
                {panelFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-xl transition duration-300 sm:px-5 ${
              favoritesOnly
                ? "border-gold/60 bg-gold/15 text-gold-soft"
                : "border-line bg-ink-2/90 text-mist hover:border-line-strong hover:text-ivory"
            }`}
          >
            <Bookmark
              className="h-4 w-4"
              strokeWidth={1.75}
              fill={favoritesOnly ? "currentColor" : "none"}
              aria-hidden
            />
            <span className="hidden sm:inline">찜</span>
            <span className="font-mono text-xs tabular-nums opacity-80">
              {favorites.length}
            </span>
          </button>
        </div>
      </div>

      {/* 접힘/펼침 필터 패널 — grid-rows 트릭으로 높이를 부드럽게 */}
      <div
        id="filter-panel"
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isFilterOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        inert={!isFilterOpen}
      >
        <div className="overflow-hidden">
          <div className="mb-4 space-y-4 rounded-3xl border border-line bg-ink-2/60 p-4 backdrop-blur sm:p-5">
            <FilterGroup label="학년">
              {["전체", ...grades].map((grade) => (
                <FilterButton
                  key={grade}
                  label={grade}
                  isActive={activeGrade === grade}
                  onClick={() => setActiveGrade(grade)}
                />
              ))}
            </FilterGroup>

            {subjects.length > 0 && (
              <FilterGroup label="교과">
                {["전체", ...subjects].map((subject) => (
                  <FilterButton
                    key={subject}
                    label={subject}
                    isActive={activeSubject === subject}
                    onClick={() => setActiveSubject(subject)}
                  />
                ))}
              </FilterGroup>
            )}

            {units.length > 0 && (
              <FilterGroup label="단원">
                {["전체", ...units].map((unit) => (
                  <FilterButton
                    key={unit}
                    label={unit}
                    isActive={activeUnit === unit}
                    onClick={() => setActiveUnit(unit)}
                  />
                ))}
              </FilterGroup>
            )}
          </div>
        </div>
      </div>

      {/* 적용된 필터 칩 */}
      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={f.clear}
              className="group/chip inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 py-1 pl-3 pr-2 text-xs text-gold-soft transition hover:border-gold/60"
              aria-label={`${f.label} 필터 해제`}
            >
              {f.label}
              <X
                className="h-3 w-3 opacity-60 group-hover/chip:opacity-100"
                aria-hidden
              />
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className="px-2 py-1 text-xs text-fog underline-offset-4 transition hover:text-ivory hover:underline"
          >
            모두 지우기
          </button>
        </div>
      )}

      <div ref={gameListRef} className="scroll-mt-40 pt-2">
        {sortedGames.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line-strong px-6 py-20 text-center">
            <p className="font-display text-3xl italic text-gold/80">
              Nothing here, yet.
            </p>
            <p className="mt-2 text-sm text-mist">
              {favoritesOnly && favorites.length === 0
                ? "카드 오른쪽 위 책갈피를 눌러 수업 바구니를 채워보세요."
                : "조건에 맞는 수업자료가 없어요. 필터를 조금 풀어볼까요?"}
            </p>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
              {paginatedGames.map((game, i) => (
                <li
                  key={game.id}
                  className="fade-up h-full"
                  style={{ animationDelay: `${(i % 6) * 70}ms` }}
                >
                  <GameCard
                    game={game}
                    stats={statsAvailable ? statsOf(game, statsMap) : undefined}
                  />
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav
                aria-label="페이지 네비게이션"
                className="mt-14 flex items-center justify-center gap-1.5"
              >
                <PageArrow
                  label="이전 페이지"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PageArrow>
                {getPageNumbers(currentPage, totalPages).map((page, i) =>
                  page === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-fog">
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`h-10 min-w-10 rounded-full px-3 font-mono text-sm tabular-nums transition duration-300 ${
                        currentPage === page
                          ? "bg-ivory text-ink"
                          : "text-mist hover:bg-white/5 hover:text-ivory"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <PageArrow
                  label="다음 페이지"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </PageArrow>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={`${label} 필터`}
      className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4"
    >
      <p className="w-10 shrink-0 pt-1.5 text-xs font-medium tracking-wider text-fog">
        {label}
      </p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {children}
      </div>
    </div>
  );
}

function FilterButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition duration-300 ${
        isActive
          ? "border-ivory bg-ivory font-medium text-ink"
          : "border-line text-mist hover:border-line-strong hover:text-ivory"
      }`}
    >
      {label}
    </button>
  );
}

function PageArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-line text-mist transition hover:border-line-strong hover:text-ivory disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
