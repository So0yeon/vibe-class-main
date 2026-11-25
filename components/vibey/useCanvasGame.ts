"use client";

import { useEffect, useRef } from "react";
import { vibeyDataUri, type VibeyLook } from "@/lib/vibey";

/** 미니게임 캔버스의 논리 크기. 화면에서는 너비에 맞춰 늘어난다 */
export const GAME_W = 240;
export const GAME_H = 360;

export type GameInput = {
  /** 포인터가 가리키는 x (논리 좌표). 키보드로 움직이면 null */
  pointerX: number | null;
  left: boolean;
  right: boolean;
};

type Frame = (
  ctx: CanvasRenderingContext2D,
  dt: number,
  input: GameInput,
) => void;

/**
 * 캔버스 하나에 게임 루프를 돌린다.
 * - DPR 보정, 포인터/터치 드래그, 방향키(캔버스에 포커스가 있을 때만) 입력
 * - 탭 전환 등으로 프레임이 멀리 벌어지면 dt를 잘라 순간이동을 막는다
 */
export function useCanvasGame(running: boolean, frame: Frame) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(frame);
  const input = useRef<GameInput>({
    pointerX: null,
    left: false,
    right: false,
  });

  useEffect(() => {
    frameRef.current = frame;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = GAME_W * dpr;
    canvas.height = GAME_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const toLocalX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * GAME_W;
    };
    const onPointer = (e: PointerEvent) => {
      input.current.pointerX = toLocalX(e.clientX);
    };
    const onLeave = () => {
      input.current.pointerX = null;
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") input.current.left = down;
      else if (e.key === "ArrowRight" || e.key === "d")
        input.current.right = down;
      else return;
      input.current.pointerX = null;
      e.preventDefault();
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);

    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("keydown", keyDown);
    canvas.addEventListener("keyup", keyUp);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(2, (now - last) / (1000 / 60));
      last = now;
      frameRef.current(ctx, running ? dt : 0, input.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("keydown", keyDown);
      canvas.removeEventListener("keyup", keyUp);
    };
  }, [running]);

  return canvasRef;
}

/** 캔버스에 그릴 바이비 이미지 (한 번만 로드) */
export function useVibeyImage(look: VibeyLook) {
  const ref = useRef<HTMLImageElement | null>(null);
  const key = `${look.mood}-${look.stage}`;
  useEffect(() => {
    const img = new Image();
    img.src = vibeyDataUri(look);
    ref.current = img;
    // look 객체 대신 key로 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return ref;
}

/** 다음 이동 목표로 부드럽게 다가가는 x 좌표 계산 */
export function steer(
  x: number,
  input: GameInput,
  dt: number,
  speed = 4.2,
): number {
  if (input.pointerX !== null)
    return x + (input.pointerX - x) * Math.min(1, 0.22 * dt);
  if (input.left) return x - speed * dt;
  if (input.right) return x + speed * dt;
  return x;
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  g.addColorStop(0, "#0d1814");
  g.addColorStop(1, "#16201b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  // 멀리 반짝이는 별
  for (let i = 0; i < 18; i++) {
    const x = (i * 53) % GAME_W;
    const y = (i * 97) % (GAME_H - 80);
    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t / 30 + i);
    ctx.fillStyle = "#ead5a8";
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
}
