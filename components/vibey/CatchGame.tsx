"use client";

import { Heart } from "lucide-react";
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

type Kind = "snow" | "gift" | "coal";
type Item = { x: number; y: number; vy: number; kind: Kind; spin: number };
type Pop = { x: number; y: number; text: string; life: number };

const LIVES = 3;
const PLAYER_Y = 296;

function newWorld() {
  return {
    x: GAME_W / 2,
    t: 0,
    spawn: 0,
    items: [] as Item[],
    pops: [] as Pop[],
    score: 0,
    lives: LIVES,
    hurt: 0,
  };
}

function pickKind(): Kind {
  const r = Math.random();
  if (r < 0.12) return "gift";
  if (r < 0.32) return "coal";
  return "snow";
}

function drawItem(ctx: CanvasRenderingContext2D, it: Item) {
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate(it.spin);
  if (it.kind === "snow") {
    ctx.strokeStyle = "#f4f0e6";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
    }
  } else if (it.kind === "gift") {
    ctx.fillStyle = "#d6b47a";
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = "#b9415a";
    ctx.fillRect(-2, -8, 4, 16);
    ctx.fillRect(-8, -2, 16, 4);
  } else {
    ctx.fillStyle = "#2b2f2d";
    ctx.beginPath();
    ctx.moveTo(-8, -3);
    ctx.lineTo(-3, -8);
    ctx.lineTo(6, -6);
    ctx.lineTo(8, 3);
    ctx.lineTo(2, 8);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(-3, -4, 3, 2);
  }
  ctx.restore();
}

/** 떨어지는 눈송이(+1)와 선물(+5)을 받고, 석탄은 피하는 게임 */
export function CatchGame() {
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const best = bestScoreStore.useValue().catch;
  const world = useRef(newWorld());
  const happy = useVibeyImage({ mood: "happy", stage: 2 });
  const ouch = useVibeyImage({ mood: "surprised", stage: 2 });

  const canvasRef = useCanvasGame(phase === "playing", (ctx, dt, input) => {
    const w = world.current;

    if (dt > 0) {
      w.t += dt;
      w.x = Math.max(22, Math.min(GAME_W - 22, steer(w.x, input, dt)));
      w.hurt = Math.max(0, w.hurt - dt);

      w.spawn -= dt;
      if (w.spawn <= 0) {
        w.spawn = Math.max(16, 44 - w.score * 0.12);
        w.items.push({
          x: 12 + Math.random() * (GAME_W - 24),
          y: -12,
          vy: 1.25 + Math.min(2.2, w.score * 0.01) + Math.random() * 0.6,
          kind: pickKind(),
          spin: Math.random() * Math.PI,
        });
      }

      for (const it of w.items) {
        it.y += it.vy * dt;
        it.spin += 0.03 * dt;
        const caught =
          Math.abs(it.x - w.x) < 24 &&
          it.y > PLAYER_Y + 4 &&
          it.y < PLAYER_Y + 40;
        if (!caught) continue;
        it.y = GAME_H + 100; // 지운다
        if (it.kind === "coal") {
          w.lives -= 1;
          w.hurt = 36;
          w.pops.push({ x: w.x, y: PLAYER_Y, text: "앗!", life: 40 });
          setLives(w.lives);
          if (w.lives <= 0) {
            setPhase("over");
            if (w.score > bestScoreStore.get().catch) {
              bestScoreStore.update((b) => ({ ...b, catch: w.score }));
            }
          }
        } else {
          const gain = it.kind === "gift" ? 5 : 1;
          w.score += gain;
          w.pops.push({ x: it.x, y: PLAYER_Y, text: `+${gain}`, life: 36 });
          setScore(w.score);
        }
      }
      w.items = w.items.filter((it) => it.y < GAME_H + 20);
      for (const p of w.pops) {
        p.life -= dt;
        p.y -= 0.6 * dt;
      }
      w.pops = w.pops.filter((p) => p.life > 0);
    }

    drawBackdrop(ctx, w.t);
    // 쌓인 눈 언덕
    ctx.fillStyle = "#e9e4d8";
    ctx.beginPath();
    ctx.moveTo(0, GAME_H);
    ctx.lineTo(0, 344);
    ctx.quadraticCurveTo(GAME_W * 0.3, 332, GAME_W * 0.6, 342);
    ctx.quadraticCurveTo(GAME_W * 0.85, 350, GAME_W, 338);
    ctx.lineTo(GAME_W, GAME_H);
    ctx.fill();

    w.items.forEach((it) => drawItem(ctx, it));

    const img = w.hurt > 0 ? ouch.current : happy.current;
    if (img?.complete) {
      const bob = Math.sin(w.t / 6) * 1.5;
      if (w.hurt > 0 && Math.floor(w.hurt / 4) % 2 === 0) ctx.globalAlpha = 0.5;
      ctx.drawImage(img, w.x - 26, PLAYER_Y + bob, 52, 52);
      ctx.globalAlpha = 1;
    }

    ctx.font = "600 13px system-ui";
    ctx.textAlign = "center";
    for (const p of w.pops) {
      ctx.globalAlpha = Math.min(1, p.life / 20);
      ctx.fillStyle = p.text === "앗!" ? "#f3c3cd" : "#ead5a8";
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  });

  const start = () => {
    world.current = newWorld();
    setScore(0);
    setLives(LIVES);
    setPhase("playing");
    canvasRef.current?.focus();
  };

  return (
    <GameShell
      canvasRef={canvasRef}
      phase={phase}
      onStart={start}
      title="눈송이 받기"
      howTo="눈송이 +1, 선물 +5. 석탄은 피해요!"
      score={score}
      best={best}
      hud={
        <span
          className="flex items-center gap-0.5"
          aria-label={`남은 목숨 ${lives}`}
        >
          {Array.from({ length: LIVES }, (_, i) => (
            <Heart
              key={i}
              className={`h-3.5 w-3.5 ${i < lives ? "text-garnet" : "text-fog/40"}`}
              fill="currentColor"
              strokeWidth={0}
            />
          ))}
        </span>
      }
    />
  );
}
