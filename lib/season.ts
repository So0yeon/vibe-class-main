/**
 * 겨울 시즌(크리스마스) 관련 날짜 계산. 서버·클라이언트 공용.
 * 날짜는 모두 한국 시간(Asia/Seoul) 기준 "YYYY-MM-DD" 키로 다룬다.
 */

import type { GameItem } from "@/lib/games";

export const ADVENT_DAYS = 25;

/** 지금 한국 날짜 키 (예: "2026-12-07") */
export function kstDateKey(date: Date = new Date()): string {
  // en-CA 로캘은 YYYY-MM-DD 형식으로 출력된다
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

/** 11월 15일 ~ 1월 6일(주현절)을 겨울 시즌으로 본다 */
export function isWinterSeason(key: string): boolean {
  const { m, d } = parseKey(key);
  return m === 12 || (m === 11 && d >= 15) || (m === 1 && d <= 6);
}

/** 이번 시즌의 크리스마스가 속한 연도 (1월이면 작년) */
export function seasonYear(key: string): number {
  const { y, m } = parseKey(key);
  return m === 1 ? y - 1 : y;
}

/** 크리스마스까지 남은 일수. 지났으면 0 */
export function daysUntilChristmas(key: string): number {
  const { y, m, d } = parseKey(key);
  const today = Date.UTC(y, m - 1, d);
  const christmas = Date.UTC(seasonYear(key), 11, 25);
  return Math.max(0, Math.round((christmas - today) / 86_400_000));
}

/** 12월 1일까지 남은 일수. 이미 12월 이후면 0 */
export function daysUntilAdvent(key: string): number {
  const { y, m, d } = parseKey(key);
  if (m !== 11) return 0;
  return Math.round((Date.UTC(y, 11, 1) - Date.UTC(y, m - 1, d)) / 86_400_000);
}

/** 오늘까지 열 수 있는 어드벤트 창 개수 (0~25) */
export function openableAdventDays(key: string): number {
  const { m, d } = parseKey(key);
  if (m === 12) return Math.min(d, ADVENT_DAYS);
  if (m === 1) return ADVENT_DAYS;
  return 0;
}

/** 오늘이 어드벤트 몇 번째 날인지 (12월 1~25일이 아니면 null) */
export function adventToday(key: string): number | null {
  const { m, d } = parseKey(key);
  return m === 12 && d <= ADVENT_DAYS ? d : null;
}

/** 시드 고정 난수 (mulberry32) — 서버와 브라우저에서 같은 순서를 만든다 */
function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 12월 1~25일 각각에 수업자료 하나씩 배정한다.
 * 연도를 시드로 섞어서 매년 순서가 바뀌고, 자료가 25개보다 적으면 순환한다.
 */
export function buildAdventSchedule(
  games: GameItem[],
  year: number,
): GameItem[] {
  if (games.length === 0) return [];
  const sorted = [...games].sort((a, b) => a.id.localeCompare(b.id));
  const rand = seededRandom(year * 7919);
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }
  return Array.from(
    { length: ADVENT_DAYS },
    (_, i) => sorted[i % sorted.length],
  );
}

/** 12월 1일의 요일 (0=일) — 데스크톱 달력 정렬용 */
export function decemberFirstWeekday(year: number): number {
  return new Date(Date.UTC(year, 11, 1)).getUTCDay();
}
