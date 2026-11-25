"use client";

import { useEffect, useRef } from "react";

/** 화면에 들어오면 0부터 값까지 올라가는 숫자. 리렌더 없이 textContent만 바꾼다 */
export function CountUp({
  value,
  duration = 1600,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");
    let raf = 0;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          el.textContent = fmt(value * (1 - Math.pow(1 - t, 4)));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        el.textContent = "0";
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("ko-KR")}
    </span>
  );
}
