"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { StarMark } from "@/components/ui/StarMark";
import { daysUntilChristmas } from "@/lib/season";
import { useKstToday } from "@/lib/use-today";

type Props = {
  image: string;
  winter: boolean;
  serverToday: string;
};

/**
 * 아치형 겨울 창문 프레임. 마우스를 따라 사진이 반대 방향으로 살짝 흐르는 패럴랙스,
 * 시즌에는 크리스마스까지 남은 날을 회전하는 원형 레터링 배지에 담는다.
 */
export function ArchFrame({ image, winter, serverToday }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const today = useKstToday(serverToday);
  const dday = daysUntilChristmas(today);

  useEffect(() => {
    const el = frameRef.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--px", `${x * -18}px`);
        el.style.setProperty("--py", `${y * -14}px`);
        el.style.setProperty("--fx", `${x * 8}px`);
        el.style.setProperty("--fy", `${y * 6}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const badgeText = winter
    ? "MERRY CHRISTMAS ✦ HAPPY TEACHING ✦ "
    : "VIBE CODING ✦ FOR THE CLASSROOM ✦ ";

  return (
    <div
      ref={frameRef}
      className="relative mx-auto w-full max-w-[440px] [--fx:0px] [--fy:0px] [--px:0px] [--py:0px]"
    >
      {/* 바깥 골드 헤어라인 */}
      <div
        aria-hidden
        className="absolute -inset-3 rounded-t-[999px] rounded-b-[36px] border border-gold/25 transition-transform duration-700 ease-out"
        style={{ transform: "translate(var(--fx), var(--fy))" }}
      />

      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[28px] border border-line-strong bg-ink-3 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)]">
        {/* 가로로 긴 대문 그림의 오른쪽 끝(바이비)이 보이도록 오른쪽 정렬.
            오른쪽 여유는 패럴랙스 이동폭(±9px)만큼만 남겨 끝이 덜 잘리게 한다 */}
        <div
          className="absolute -inset-y-6 -left-6 -right-3 transition-transform duration-700 ease-out"
          style={{ transform: "translate(var(--px), var(--py))" }}
        >
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 80vw, 440px"
            className="object-cover object-right"
          />
        </div>
        {/* 성에 낀 유리 + 아래쪽 어둠 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-ink/85" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(236,230,217,0.12)]" />
        {/* 창살 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-ivory/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[46%] h-px bg-ivory/15"
        />

        <p className="absolute inset-x-0 bottom-6 text-center font-display text-lg italic text-ivory/90">
          {winter
            ? "a quiet winter in the classroom"
            : "made with care, for the classroom"}
        </p>
      </div>

      {/* 회전 원형 배지 */}
      <div className="absolute -bottom-8 -left-6 h-32 w-32 sm:-left-12 sm:h-36 sm:w-36">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full animate-[spin_24s_linear_infinite] text-gold"
        >
          <defs>
            <path
              id="badge-circle"
              d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
            />
          </defs>
          <circle
            cx="50"
            cy="50"
            r="49"
            fill="#0f1613"
            stroke="currentColor"
            strokeOpacity=".35"
            strokeWidth=".6"
          />
          <text
            fontSize="7"
            fill="currentColor"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {/* 원 둘레(2π·38 ≈ 238)에 딱 맞게 자간을 자동 조정 */}
            <textPath
              href="#badge-circle"
              textLength="236"
              lengthAdjust="spacing"
            >
              {badgeText}
            </textPath>
          </text>
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          {winter && dday > 0 ? (
            <div>
              <p className="font-display text-[34px] italic leading-none text-ivory">
                {dday}
              </p>
              <p className="mt-0.5 font-mono text-[8px] tracking-[0.2em] text-gold">
                DAYS TO XMAS
              </p>
            </div>
          ) : winter ? (
            <p className="font-display text-xl italic leading-tight text-ivory">
              Merry
              <br />
              Christmas
            </p>
          ) : (
            <StarMark className="h-8 w-8 text-gold" />
          )}
        </div>
      </div>
    </div>
  );
}
