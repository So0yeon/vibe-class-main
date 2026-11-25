"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { Vibey } from "@/components/vibey/Vibey";
import {
  ArcadeMenu,
  ArcadeStage,
  type ArcadeGame,
} from "@/components/vibey/VibeyArcade";
import { recordVisit } from "@/components/vibey/PetVibey";

/** 본문(72rem) 바깥 여백의 폭. 여백이 충분한 1600px 이상에서만 날개를 단다 */
const WIDE_QUERY = "(min-width: 1600px)";

const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

function useIsWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
}

const WING_WIDTH = "min(250px, calc((100vw - 72rem) / 2 - 2.5rem))";

/** 게임 목록 ↔ 실행 중인 게임. 날개와 모바일 패널이 함께 쓴다 */
function Launcher({
  games,
  game,
  setGame,
}: {
  games: ArcadeGame[];
  game: ArcadeGame | null;
  setGame: (game: ArcadeGame | null) => void;
}) {
  return game ? (
    <ArcadeStage key={game} game={game} onBack={() => setGame(null)} />
  ) : (
    <ArcadeMenu games={games} onPick={setGame} />
  );
}

/**
 * 화면 가장자리에 접혀 있는 날개.
 * 손잡이를 누르면 가장자리를 축으로 펼쳐지며 게임 목록이 뜨고, 고른 게임은 날개 안에서 실행된다.
 */
function Wing({
  side,
  title,
  games,
}: {
  side: "left" | "right";
  title: string;
  games: ArcadeGame[];
}) {
  const [open, setOpen] = useState(false);
  const [game, setGame] = useState<ArcadeGame | null>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const foldRef = useRef<HTMLButtonElement>(null);
  const left = side === "left";
  const FoldIcon = left ? ChevronLeft : ChevronRight;
  const id = `vibey-wing-${side}`;

  const unfold = () => {
    setOpen(true);
    requestAnimationFrame(() => foldRef.current?.focus());
  };
  const fold = () => {
    setOpen(false);
    handleRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") fold();
  };

  return (
    <>
      {/* 접힌 날개: 가장자리에 살짝 걸친 손잡이 */}
      <button
        ref={handleRef}
        type="button"
        onClick={unfold}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${title} 펼치기`}
        tabIndex={open ? -1 : 0}
        className={`group fixed top-1/2 z-40 flex w-12 flex-col items-center gap-2 border border-line-strong bg-ink-2/85 py-4 shadow-[0_20px_40px_-14px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-[transform,opacity,border-color] duration-500 ease-[var(--ease-out-expo)] hover:border-gold/60 ${
          left
            ? "left-0 rounded-r-[22px] border-l-0"
            : "right-0 rounded-l-[22px] border-r-0"
        }`}
        style={{
          transform: `translateY(-50%) translateX(${
            open ? (left ? "-110%" : "110%") : "0"
          })`,
          opacity: open ? 0 : 1,
        }}
      >
        <Vibey
          mood="sleepy"
          stage={1}
          className="vibey-bob h-9 w-9 transition group-hover:scale-110"
        />
        <span
          className="eyebrow text-[9px] tracking-[0.3em] text-mist group-hover:text-ivory"
          style={{ writingMode: "vertical-rl" }}
        >
          PLAY
        </span>
        <FoldIcon
          className="h-3.5 w-3.5 rotate-180 text-fog transition group-hover:text-gold-soft"
          aria-hidden
        />
      </button>

      {/* 펼친 날개 */}
      <aside
        id={id}
        aria-label={title}
        inert={!open}
        onKeyDown={onKeyDown}
        onTransitionEnd={(e) => {
          // 다 접힌 뒤에 게임을 내려 루프를 멈춘다
          if (
            e.target === e.currentTarget &&
            e.propertyName === "transform" &&
            !open
          )
            setGame(null);
        }}
        className="fixed top-1/2 z-40 transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]"
        style={{
          [side]: "1.25rem",
          width: WING_WIDTH,
          transformOrigin: left ? "left center" : "right center",
          transform: `translateY(-50%) perspective(900px) rotateY(${
            open ? 0 : left ? 92 : -92
          }deg)`,
          opacity: open ? 1 : 0,
        }}
      >
        <div className="max-h-[calc(100svh-6rem)] overflow-y-auto rounded-[26px] border border-line bg-ink-2/85 p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div
            className={`mb-3 flex items-center gap-2 ${left ? "" : "flex-row-reverse"}`}
          >
            <button
              ref={foldRef}
              type="button"
              onClick={fold}
              aria-label={`${title} 접기`}
              className="grid h-7 w-7 place-items-center rounded-full text-fog transition hover:bg-white/5 hover:text-ivory"
            >
              <FoldIcon className="h-4 w-4" aria-hidden />
            </button>
            <p className="eyebrow flex-1 text-center text-[10px]">{title}</p>
            <span className="w-7" aria-hidden />
          </div>
          <Launcher games={games} game={game} setGame={setGame} />
        </div>
      </aside>
    </>
  );
}

/**
 * 바이비와 함께하는 미니게임.
 * 넓은 화면: 양옆에 접힌 날개 → 펼치면 게임 목록 → 날개 안에서 실행.
 * 좁은 화면: 왼쪽 아래 바이비 버튼 → 같은 목록을 담은 패널.
 */
export function VibeyCorner() {
  const [open, setOpen] = useState(false);
  const [game, setGame] = useState<ArcadeGame | null>(null);
  const wide = useIsWide();

  useEffect(() => {
    recordVisit();
  }, []);

  if (wide) {
    return (
      <>
        <Wing side="left" title="Vibey's Room" games={["pet"]} />
        <Wing side="right" title="Play with Vibey" games={["catch", "jump"]} />
      </>
    );
  }

  const toggle = () => {
    setOpen((v) => !v);
    setGame(null);
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="vibey-panel"
        aria-label={open ? "바이비 놀이터 닫기" : "바이비랑 놀기"}
        className="group fixed bottom-6 left-4 z-40 grid h-14 w-14 place-items-center rounded-full border border-line-strong bg-ink-2/85 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl transition duration-500 hover:border-gold/60 sm:left-6"
      >
        {open ? (
          <X className="h-5 w-5 text-ivory" />
        ) : (
          <Vibey mood="happy" stage={2} className="vibey-bob h-11 w-11" />
        )}
      </button>

      {open && (
        <div
          id="vibey-panel"
          role="dialog"
          aria-label="바이비 놀이터"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="panel-in fixed inset-x-3 bottom-24 z-40 max-h-[calc(100svh-8rem)] overflow-y-auto rounded-[26px] border border-line-strong bg-ink-2/95 p-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:inset-x-auto sm:left-6 sm:w-[300px]"
        >
          <p className="eyebrow mb-3 text-center text-[10px]">
            Play with Vibey
          </p>
          <div className="mx-auto max-w-[280px]">
            <Launcher
              games={["pet", "catch", "jump"]}
              game={game}
              setGame={setGame}
            />
          </div>
        </div>
      )}
    </div>
  );
}
