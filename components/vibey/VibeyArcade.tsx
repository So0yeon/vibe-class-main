"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CatchGame } from "@/components/vibey/CatchGame";
import { JumpGame } from "@/components/vibey/JumpGame";
import { PetVibey } from "@/components/vibey/PetVibey";
import { Vibey } from "@/components/vibey/Vibey";
import {
  bestScoreStore,
  petStore,
  petXp,
  stageOf,
  type VibeyLook,
} from "@/lib/vibey";

export type ArcadeGame = "pet" | "catch" | "jump";

const GAMES: Record<
  ArcadeGame,
  { name: string; desc: string; look: VibeyLook }
> = {
  pet: {
    name: "바이비 키우기",
    desc: "쓰다듬고 코코아 주며 키워요",
    look: { mood: "happy", stage: 1 },
  },
  catch: {
    name: "눈송이 받기",
    desc: "눈송이·선물은 받고 석탄은 피해요",
    look: { mood: "normal", stage: 2 },
  },
  jump: {
    name: "바이비 점프",
    desc: "눈 덮인 가지를 밟고 높이높이",
    look: { mood: "surprised", stage: 2 },
  },
};

/** 목록 오른쪽에 붙는 작은 기록 (키우기는 성장 단계, 게임은 최고 점수) */
function useRecords(): Record<ArcadeGame, string> {
  const pet = petStore.useValue();
  const best = bestScoreStore.useValue();
  return {
    pet: stageOf(petXp(pet)).name,
    catch: best.catch > 0 ? `최고 ${best.catch}점` : "",
    jump: best.jump > 0 ? `최고 ${best.jump}m` : "",
  };
}

/** 고를 수 있는 미니게임 목록 */
export function ArcadeMenu({
  games,
  onPick,
}: {
  games: ArcadeGame[];
  onPick: (game: ArcadeGame) => void;
}) {
  const records = useRecords();

  return (
    <ul className="space-y-2">
      {games.map((game, i) => {
        const g = GAMES[game];
        return (
          <li
            key={game}
            className="fade-up"
            style={{ animationDelay: `${0.12 + i * 0.07}s` }}
          >
            <button
              type="button"
              onClick={() => onPick(game)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-ink/50 p-2.5 text-left transition hover:border-gold/50 hover:bg-ink-3"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.04]">
                <Vibey
                  {...g.look}
                  className="h-10 w-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-cute text-[17px] leading-tight text-ivory">
                  {g.name}
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] text-mist">
                  {g.desc}
                </span>
                {records[game] && (
                  <span className="mt-0.5 block font-mono text-[10px] text-gold-soft">
                    {records[game]}
                  </span>
                )}
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-fog transition group-hover:translate-x-0.5 group-hover:text-ivory"
                aria-hidden
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** 목록에서 고른 게임을 실행한다. 언마운트되면 게임 루프도 멈춘다 */
export function ArcadeStage({
  game,
  onBack,
}: {
  game: ArcadeGame;
  onBack: () => void;
}) {
  return (
    <div className="fade-up">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-mist transition hover:bg-white/5 hover:text-ivory"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        게임 목록
      </button>
      {game === "pet" && <PetVibey />}
      {game === "catch" && <CatchGame />}
      {game === "jump" && <JumpGame />}
    </div>
  );
}

export function gameName(game: ArcadeGame) {
  return GAMES[game].name;
}
