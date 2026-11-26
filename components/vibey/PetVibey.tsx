"use client";

import { Coffee, Hand } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Vibey } from "@/components/vibey/Vibey";
import { kstDateKey } from "@/lib/season";
import { toast } from "@/lib/ui-events";
import {
  VIBEY_LINES,
  petStore,
  petXp,
  stageOf,
  type VibeyMood,
} from "@/lib/vibey";

const IDLE_MS = 25_000;
const SNACK_COOLDOWN_MS = 8_000;

function yesterdayKey(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

/** 하루 한 번 방문을 기록한다 (연속 방문 일수 포함) */
export function recordVisit() {
  const today = kstDateKey();
  petStore.update((s) => {
    if (s.lastVisit === today) return s;
    const streak = s.lastVisit === yesterdayKey(today) ? s.streak + 1 : 1;
    return { ...s, visits: s.visits + 1, streak, lastVisit: today };
  });
}

/** 쓰다듬고 코코아를 주면 자라는 다마고치 같은 바이비 */
export function PetVibey() {
  const state = petStore.useValue();
  const xp = petXp(state);
  const stage = stageOf(xp);
  const [mood, setMood] = useState<VibeyMood>("normal");
  const [line, setLine] = useState("안녕하세요! 저는 바이비예요");
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [snackReady, setSnackReady] = useState(true);
  const [lastAction, setLastAction] = useState(0);
  const moodTimer = useRef<number>(0);

  // 한동안 아무도 안 놀아주면 꾸벅꾸벅 존다
  useEffect(() => {
    const id = window.setTimeout(() => {
      setMood("sleepy");
      setLine("쿨… 쿨… (쓰다듬어서 깨워주세요)");
    }, IDLE_MS);
    return () => clearTimeout(id);
  }, [lastAction]);

  const react = (nextMood: VibeyMood, nextLine: string) => {
    setMood(nextMood);
    setLine(nextLine);
    setLastAction(Date.now());
    clearTimeout(moodTimer.current);
    moodTimer.current = window.setTimeout(() => setMood("normal"), 1600);
  };

  const growCheck = (before: number) => {
    const after = stageOf(petXp(petStore.get()));
    if (after.stage > stageOf(before).stage) {
      toast(`바이비가 ${after.name}(으)로 자랐어요! ✦`, "gold");
    }
  };

  const pet = () => {
    const before = petXp(petStore.get());
    petStore.update((s) => ({ ...s, pets: s.pets + 1 }));
    growCheck(before);
    const id = Date.now() + Math.random();
    setHearts((h) => [...h.slice(-6), { id, x: 20 + Math.random() * 60 }]);
    window.setTimeout(
      () => setHearts((h) => h.filter((v) => v.id !== id)),
      1000,
    );
    react("happy", VIBEY_LINES[Math.floor(Math.random() * VIBEY_LINES.length)]);
  };

  const snack = () => {
    if (!snackReady) return;
    const before = petXp(petStore.get());
    petStore.update((s) => ({ ...s, snacks: s.snacks + 1 }));
    growCheck(before);
    setSnackReady(false);
    window.setTimeout(() => setSnackReady(true), SNACK_COOLDOWN_MS);
    react("happy", "따뜻한 코코아 최고예요 ☕");
  };

  return (
    <div className="text-center">
      {/* 말풍선 */}
      <div className="relative mx-auto min-h-[52px] max-w-[220px] rounded-2xl border border-line-strong bg-ink-3 px-3 py-2 font-cute text-[15px] leading-snug text-ivory">
        <p key={line} className="fade-up">
          {line}
        </p>
        <span className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-line-strong bg-ink-3" />
      </div>

      <button
        type="button"
        onClick={pet}
        aria-label="바이비 쓰다듬기"
        className="group relative mx-auto mt-2 block cursor-grab active:cursor-grabbing"
      >
        <span className="vibey-bob block">
          <Vibey
            mood={mood}
            stage={stage.stage}
            className={`transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 ${
              stage.stage === 1
                ? "h-24 w-24"
                : stage.stage === 2
                  ? "h-28 w-28"
                  : "h-32 w-32"
            }`}
          />
        </span>
        {hearts.map((h) => (
          <span
            key={h.id}
            aria-hidden
            className="vibey-heart pointer-events-none absolute top-6 text-sm text-garnet"
            style={{ left: `${h.x}%` }}
          >
            ♥
          </span>
        ))}
      </button>

      <p className="mt-1 font-cute text-lg text-ivory">{stage.name}</p>
      <div className="mx-auto mt-2 h-1.5 max-w-[180px] overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft transition-[width] duration-700"
          style={{ width: `${Math.round(stage.progress * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-fog">
        {stage.next
          ? `${stage.next.name}까지 ${stage.next.from - xp} 남음`
          : "다 자랐어요! 계속 놀아주세요"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={pet}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line-strong py-2 text-xs text-mist transition hover:border-gold/50 hover:text-ivory"
        >
          <Hand className="h-3.5 w-3.5" aria-hidden />
          쓰다듬기
        </button>
        <button
          type="button"
          onClick={snack}
          disabled={!snackReady}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line-strong py-2 text-xs text-mist transition hover:border-gold/50 hover:text-ivory disabled:opacity-40"
        >
          <Coffee className="h-3.5 w-3.5" aria-hidden />
          {snackReady ? "코코아" : "후후…"}
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-1 border-t border-line pt-3 text-[10px] text-fog">
        <div>
          <dt>연속 방문</dt>
          <dd className="mt-0.5 font-mono text-xs text-ivory">
            {state.streak}일
          </dd>
        </div>
        <div>
          <dt>쓰다듬기</dt>
          <dd className="mt-0.5 font-mono text-xs text-ivory">{state.pets}</dd>
        </div>
        <div>
          <dt>코코아</dt>
          <dd className="mt-0.5 font-mono text-xs text-ivory">
            {state.snacks}
          </dd>
        </div>
      </dl>
    </div>
  );
}
