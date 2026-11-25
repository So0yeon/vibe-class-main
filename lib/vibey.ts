/**
 * 바이비 — Vibe Class의 문어 마스코트.
 * 같은 그림을 <img>(React)와 캔버스(미니게임) 양쪽에서 쓰도록 SVG 문자열로 만든다.
 */

import { createJsonStore } from "@/lib/local-store";

export type VibeyMood = "normal" | "happy" | "surprised" | "sleepy";

export type VibeyLook = {
  mood?: VibeyMood;
  /** 1: 아기(장식 없음) 2: 꼬마(골드 목도리) 3: 어른(목도리 + 니트 모자) */
  stage?: 1 | 2 | 3;
};

const BODY = "#A98BEA";
const BODY_SHADE = "#9475DB";
const INK = "#1B1426";

/** 눈은 언제나 작은 검은 점 두 개. 살짝 멀찍이 떨어져 있어 멍한 인상을 준다 */
function eyes(mood: VibeyMood): string {
  switch (mood) {
    case "sleepy":
      return `<path d="M37 53h9M74 53h9" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
    case "surprised":
      return `<circle cx="41.5" cy="52" r="5.2" fill="${INK}"/><circle cx="78.5" cy="52" r="5.2" fill="${INK}"/>`;
    default:
      return `<circle cx="41.5" cy="53" r="4" fill="${INK}"/><circle cx="78.5" cy="53" r="4" fill="${INK}"/>`;
  }
}

/** 옅은 미소. 가운데에서 살짝 비껴 있어 어딘가 어리숙하다 */
function mouth(mood: VibeyMood): string {
  if (mood === "surprised")
    return `<ellipse cx="61" cy="66" rx="3" ry="3.6" fill="${INK}"/>`;
  if (mood === "happy")
    return `<path d="M53 63q8 7.5 15 -0.5" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`;
  return `<path d="M55 64q5.5 4 11 -0.8" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
}

export function vibeySvg({
  mood = "normal",
  stage = 2,
}: VibeyLook = {}): string {
  const tentacles = [
    "M30 72q-10 18 0 32",
    "M44 77q-6 20 2 32",
    "M60 79v31",
    "M76 77q6 20-2 32",
    "M90 72q10 18 0 32",
  ]
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${BODY_SHADE}" stroke-width="11" stroke-linecap="round"/>`,
    )
    .join("");

  // 장식은 무늬 없이 단색으로만
  const scarf =
    stage >= 2
      ? `<path d="M23 69q37 16 74 0v8q-37 16-74 0z" fill="#D6B47A"/><path d="M78 76l6 20 9-3-5-18z" fill="#C9A160"/>`
      : "";

  const hat =
    stage >= 3
      ? `<path d="M31 30q29-30 58 0q-29-9-58 0z" fill="#ECE6D9"/><path d="M30 31q30-10 60 0v7q-30-10-60 0z" fill="#ECE6D9"/><circle cx="60" cy="8" r="7" fill="#ECE6D9"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${tentacles}<path d="M60 14c28 0 40 22 40 44 0 15-9 22-40 22s-40-7-40-22c0-22 12-44 40-44z" fill="${BODY}"/>${eyes(mood)}${mouth(mood)}${scarf}${hat}</svg>`;
}

export function vibeyDataUri(look: VibeyLook = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(vibeySvg(look))}`;
}

/* ───────────────────────── 키우기 상태 ───────────────────────── */

export type PetState = {
  pets: number;
  snacks: number;
  visits: number;
  streak: number;
  lastVisit: string | null;
};

export const petStore = createJsonStore<PetState>("vibeclass:vibey-pet", {
  pets: 0,
  snacks: 0,
  visits: 0,
  streak: 0,
  lastVisit: null,
});

export const bestScoreStore = createJsonStore<{ catch: number; jump: number }>(
  "vibeclass:vibey-best",
  { catch: 0, jump: 0 },
);

export function petXp(s: PetState): number {
  return s.pets + s.snacks * 3 + s.visits * 15;
}

export const STAGES = [
  { stage: 1 as const, name: "아기 바이비", from: 0 },
  { stage: 2 as const, name: "꼬마 바이비", from: 60 },
  { stage: 3 as const, name: "어른 바이비", from: 240 },
];

export function stageOf(xp: number) {
  const index = STAGES.findLastIndex((s) => xp >= s.from);
  const current = STAGES[index];
  const next = STAGES[index + 1] ?? null;
  const progress = next ? (xp - current.from) / (next.from - current.from) : 1;
  return { ...current, next, progress };
}

export const VIBEY_LINES = [
  "오늘 수업도 화이팅이에요!",
  "다리 여덟 개로 박수 짝짝짝 👏",
  "쉬는 시간엔 저랑 놀아요",
  "눈 온다! 눈사람 만들까요?",
  "선생님, 오늘도 멋져요",
  "코코아 한 잔 어때요?",
  "먹물은 아껴두는 중이에요",
  "아이들이 웃으면 저도 좋아요",
  "크리스마스엔 어떤 수업을 할까요?",
  "간질간질… 헤헤",
];
