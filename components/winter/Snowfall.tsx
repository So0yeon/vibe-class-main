"use client";

import { useEffect, useRef } from "react";
import { snowStore } from "@/lib/local-store";

type Flake = {
  x: number;
  y: number;
  r: number;
  depth: number; // 0(멀리) ~ 1(가까이)
  speed: number;
  sway: number;
  phase: number;
  gold: boolean;
};

/**
 * 화면 전체에 은은하게 내리는 눈. 가까운 눈송이는 크고 빠르며 마우스 쪽으로 살짝 흐른다.
 * 일부는 샴페인 골드 빛 — 반짝이는 금박 가루처럼 보이게.
 * 탭이 숨겨지면 멈추고, 끄기 설정·동작 줄이기 설정을 따른다.
 */
export function Snowfall() {
  const enabled = snowStore.useFlag(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    let raf = 0;
    let wind = 0;
    let targetWind = 0;

    const makeFlake = (randomY: boolean): Flake => {
      const depth = Math.random();
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -10,
        r: 0.5 + depth * 2.1,
        depth,
        speed: 0.25 + depth * 0.9,
        sway: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        gold: Math.random() < 0.14,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(140, Math.round((width * height) / 14000));
      flakes = Array.from({ length: count }, () => makeFlake(true));
    };

    const onPointer = (e: PointerEvent) => {
      targetWind = (e.clientX / width - 0.5) * 1.2;
    };

    let t = 0;
    const tick = () => {
      t += 0.01;
      wind += (targetWind - wind) * 0.02;
      ctx.clearRect(0, 0, width, height);

      for (const f of flakes) {
        f.y += f.speed;
        f.x += Math.sin(t * f.sway * 2 + f.phase) * 0.35 + wind * f.depth;
        if (f.y > height + 10) Object.assign(f, makeFlake(false));
        if (f.x > width + 10) f.x = -10;
        if (f.x < -10) f.x = width + 10;

        const alpha = 0.18 + f.depth * 0.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = f.gold
          ? `rgba(234, 213, 168, ${alpha + Math.sin(t * 6 + f.phase) * 0.15})`
          : `rgba(244, 240, 230, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[55] mix-blend-screen"
    />
  );
}
