"use client";

import { useEffect, useState } from "react";

type Stats = { today: number; total: number };

const SESSION_KEY = "vc_visited";

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

export function VisitorCounter() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const alreadyCounted = sessionStorage.getItem(SESSION_KEY) === "1";
    const method = alreadyCounted ? "GET" : "POST";

    fetch("/api/visit", { method })
      .then((r) => r.json())
      .then((data: Stats) => {
        if (!alreadyCounted) sessionStorage.setItem(SESSION_KEY, "1");
        setStats(data);
      })
      .catch(() => {});
  }, []);

  return (
    <p
      className={`inline-flex items-center gap-2 font-mono text-[11px] text-fog transition-opacity duration-700 ${
        stats ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!stats}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
      </span>
      오늘 {fmt(stats?.today ?? 0)}명<span className="opacity-40">/</span>
      누적 {fmt(stats?.total ?? 0)}명
    </p>
  );
}
