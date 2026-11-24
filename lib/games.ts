/**
 * 게임(프로그램) 데이터 타입과 목록 필터/정렬 헬퍼.
 * 클라이언트 컴포넌트(GameGallery 등)에서도 import하므로 서버 전용 코드는 두지 않는다.
 * 데이터 조회는 lib/games-data.ts를 사용한다.
 */

export type WorksheetFile = {
  name: string;
  url: string;
};

export type GameItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  url: string | null;
  tags: string[];
  date: string | null;
  published: boolean;
  priority: number;
  worksheets: WorksheetFile[];
  grades: string[];
  unit: string;
  playTime: string;
};

/** 학년 미입력 시 기본값 */
export const DEFAULT_GRADE_MIGRATION = "전학년";

/** 우선순위 내림차순 (큰 숫자가 먼저) */
export function sortByPriority(games: GameItem[]): GameItem[] {
  return [...games].sort((a, b) => b.priority - a.priority);
}

/** 과목(다중 선택) 태그에서 필터 목록 추출 */
export const SUBJECT_ORDER = [
  "국어",
  "수학",
  "사회",
  "과학",
  "영어",
  "도덕",
  "음악",
  "미술",
  "체육",
  "실과",
  "창의",
  "통합",
];

export function extractSubjects(games: GameItem[]): string[] {
  const set = new Set<string>();
  for (const game of games) {
    for (const tag of game.tags) {
      set.add(tag);
    }
  }
  return [...set].sort((a, b) => {
    const ai = SUBJECT_ORDER.indexOf(a);
    const bi = SUBJECT_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b, "ko");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export const GRADE_ORDER = ["3학년", "4학년", "5학년", "6학년", "전학년"];

export function extractGrades(games: GameItem[]): string[] {
  const set = new Set<string>();
  for (const game of games) {
    for (const grade of game.grades) {
      set.add(grade);
    }
  }
  return [...set].sort((a, b) => {
    const ai = GRADE_ORDER.indexOf(a);
    const bi = GRADE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b, "ko");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/** 학년 필터 매칭: 5학년 → 5학년 또는 전학년 태그 게임 포함 */
export function matchesGradeFilter(game: GameItem, filter: string): boolean {
  if (filter === "전체") return true;
  if (filter === "전학년") return game.grades.includes("전학년");
  return (
    game.grades.includes(filter) || game.grades.includes("전학년")
  );
}

/** 단원 필터 목록 (비어 있지 않은 단원만) */
export function extractUnits(games: GameItem[]): string[] {
  const set = new Set<string>();
  for (const game of games) {
    const unit = game.unit.trim();
    if (unit) set.add(unit);
  }
  return [...set].sort((a, b) =>
    a.localeCompare(b, "ko", { numeric: true, sensitivity: "base" }),
  );
}

export function matchesSearch(game: GameItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    game.title.toLowerCase().includes(q) ||
    game.description.toLowerCase().includes(q)
  );
}

export function filterGames(
  games: GameItem[],
  {
    search = "",
    subject = "전체",
    grade = "전체",
    unit = "전체",
  }: {
    search?: string;
    subject?: string;
    grade?: string;
    unit?: string;
  },
): GameItem[] {
  return games.filter((game) => {
    if (!matchesSearch(game, search)) return false;
    if (subject !== "전체" && !game.tags.includes(subject)) return false;
    if (!matchesGradeFilter(game, grade)) return false;
    if (unit !== "전체" && game.unit.trim() !== unit) return false;
    return true;
  });
}

/** 카드/상세 페이지가 공통으로 사용하는 부가 정보 태그(플레이 시간·학년·단원) */
export function buildMetaPills(game: GameItem): string[] {
  return [
    ...(game.playTime.trim() ? [`⏱ ${game.playTime.trim()}`] : []),
    ...game.grades,
    ...(game.unit.trim() ? [game.unit.trim()] : []),
  ];
}

export function formatGameDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
