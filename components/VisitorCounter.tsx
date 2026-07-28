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

  if (!stats) return null;

  return (
    <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-slate-500 sm:text-xs">
      <span aria-hidden>👁</span>
      <span>오늘 {fmt(stats.today)}명</span>
      <span aria-hidden className="opacity-40">·</span>
      <span>누적 {fmt(stats.total)}명</span>
    </p>
  );
}
