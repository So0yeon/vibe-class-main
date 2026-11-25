"use client";

import { useRef, useState } from "react";
import { GameShell } from "@/components/vibey/GameShell";
import {
  GAME_H,
  GAME_W,
  drawBackdrop,
  steer,
  useCanvasGame,
  useVibeyImage,
} from "@/components/vibey/useCanvasGame";
import { bestScoreStore } from "@/lib/vibey";

type Platform = { x: number; y: number; w: number; vx: number };

const SIZE = 44;
const GRAVITY = 0.22;
const BOUNCE = -7.3;
const CAMERA_LINE = 150;

function makePlatform(y: number, height: number): Platform {
  const w = Math.max(34, 54 - height / 400);
  const moving = height > 600 && Math.random() < 0.3;
  return {
    x: Math.random() * (GAME_W - w),
    y,
    w,
    vx: moving
      ? (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6)
      : 0,
  };
}

function newWorld() {
  const platforms: Platform[] = [
    { x: GAME_W / 2 - 30, y: GAME_H - 30, w: 60, vx: 0 },
  ];
  for (let y = GAME_H - 76; y > -20; y -= 46)
    platforms.push(makePlatform(y, 0));
  return {
    x: GAME_W / 2,
    y: GAME_H - 30 - SIZE / 2,
    vy: BOUNCE,
    t: 0,
    height: 0,
    platforms,
  };
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform) {
  // 나뭇가지 + 위에 쌓인 눈
  ctx.fillStyle = "#6b4f33";
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = p.vx ? "#ead5a8" : "#f1ece1";
  ctx.beginPath();
  ctx.roundRect(p.x - 2, p.y - 3, p.w + 4, 6, 3);
  ctx.fill();
}

/** 눈 덮인 나뭇가지를 밟고 하늘 높이 올라가는 게임 */
export function JumpGame() {
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [meters, setMeters] = useState(0);
  const best = bestScoreStore.useValue().jump;
  const world = useRef(newWorld());
  const up = useVibeyImage({ mood: "happy", stage: 2 });
  const down = useVibeyImage({ mood: "surprised", stage: 2 });

  const canvasRef = useCanvasGame(phase === "playing", (ctx, dt, input) => {
    const w = world.current;

    if (dt > 0) {
      w.t += dt;
      w.x = Math.max(
        SIZE / 2 - 6,
        Math.min(GAME_W - SIZE / 2 + 6, steer(w.x, input, dt, 3.6)),
      );

      const prevBottom = w.y + SIZE / 2;
      w.vy += GRAVITY * dt;
      w.y += w.vy * dt;
      const bottom = w.y + SIZE / 2;

      for (const p of w.platforms) {
        if (p.vx) {
          p.x += p.vx * dt;
          if (p.x < 0 || p.x + p.w > GAME_W) p.vx *= -1;
        }
        const over = w.x > p.x - 8 && w.x < p.x + p.w + 8;
        if (w.vy > 0 && over && prevBottom <= p.y + 2 && bottom >= p.y - 3) {
          w.y = p.y - 3 - SIZE / 2;
          w.vy = BOUNCE;
        }
      }

      // 카메라: 기준선 위로 올라가면 세상을 아래로 민다
      if (w.y < CAMERA_LINE) {
        const shift = CAMERA_LINE - w.y;
        w.y = CAMERA_LINE;
        w.height += shift;
        w.platforms.forEach((p) => (p.y += shift));
        w.platforms = w.platforms.filter((p) => p.y < GAME_H + 10);
        let top = Math.min(...w.platforms.map((p) => p.y));
        const gap = 44 + Math.min(26, w.height / 300);
        while (top > -10) {
          top -= gap;
          w.platforms.push(makePlatform(top, w.height));
        }
        const m = Math.floor(w.height / 10);
        setMeters((prev) => (prev === m ? prev : m));
      }

      if (w.y - SIZE / 2 > GAME_H) {
        setPhase("over");
        const m = Math.floor(w.height / 10);
        if (m > bestScoreStore.get().jump) {
          bestScoreStore.update((b) => ({ ...b, jump: m }));
        }
      }
    }

    drawBackdrop(ctx, w.t + w.height / 4);
    w.platforms.forEach((p) => drawPlatform(ctx, p));

    const img = w.vy < 0 ? up.current : down.current;
    if (img?.complete) {
      const squash = w.vy < -5 ? 1.08 : 1;
      ctx.drawImage(
        img,
        w.x - SIZE / 2 / squash,
        w.y - (SIZE / 2) * squash,
        SIZE / squash,
        SIZE * squash,
      );
    }
  });

  const start = () => {
    world.current = newWorld();
    setMeters(0);
    setPhase("playing");
    canvasRef.current?.focus();
  };

  return (
    <GameShell
      canvasRef={canvasRef}
      phase={phase}
      onStart={start}
      title="바이비 점프"
      howTo="눈 덮인 가지를 밟고 높이높이! 골드 가지는 움직여요."
      score={meters}
      best={best}
      unit="m"
    />
  );
}
