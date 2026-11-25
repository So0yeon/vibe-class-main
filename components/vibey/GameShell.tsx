"use client";

import { Play, RotateCcw } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Vibey } from "@/components/vibey/Vibey";
import { GAME_H, GAME_W } from "@/components/vibey/useCanvasGame";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  phase: "ready" | "playing" | "over";
  onStart: () => void;
  title: string;
  howTo: string;
  score: number;
  best: number;
  unit?: string;
  hud?: ReactNode;
};

/** 미니게임 공통 틀: 점수 표시줄 + 캔버스 + 시작/게임오버 화면 */
export function GameShell({
  canvasRef,
  phase,
  onStart,
  title,
  howTo,
  score,
  best,
  unit = "점",
  hud,
}: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1 font-mono text-[11px] text-mist">
        <span>
          <span className="text-ivory tabular-nums">
            {score.toLocaleString("ko-KR")}
          </span>
          {unit}
          <span className="ml-2 text-fog">
            최고 {best.toLocaleString("ko-KR")}
          </span>
        </span>
        {hud}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label={`${title} 게임 화면. 마우스나 손가락, 또는 좌우 방향키로 움직여요`}
          className="block w-full touch-none outline-none"
          style={{ aspectRatio: `${GAME_W} / ${GAME_H}` }}
        />

        {phase !== "playing" && (
          <div className="overlay-in absolute inset-0 flex flex-col items-center justify-center bg-ink/75 px-4 text-center backdrop-blur-[2px]">
            <Vibey
              mood={phase === "over" ? "surprised" : "happy"}
              stage={2}
              className="h-16 w-16 animate-[fade-up_0.6s_ease-out]"
            />
            {phase === "over" ? (
              <>
                <p className="mt-2 font-display text-2xl italic text-ivory">
                  {score.toLocaleString("ko-KR")}
                  {unit}!
                </p>
                <p className="mt-1 text-xs text-mist">
                  {score > 0 && score >= best
                    ? "최고 기록이에요 ✦"
                    : `최고 기록 ${best}${unit}`}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-serif-kr text-base font-bold text-ivory">
                  {title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-mist">
                  {howTo}
                </p>
              </>
            )}
            <button
              type="button"
              onClick={onStart}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ivory px-4 py-2 text-xs font-semibold text-ink transition hover:bg-gold-soft"
            >
              {phase === "over" ? (
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
              )}
              {phase === "over" ? "다시 하기" : "시작"}
            </button>
            <p className="mt-3 text-[10px] text-fog">마우스·터치 또는 ← →</p>
          </div>
        )}
      </div>
    </div>
  );
}
