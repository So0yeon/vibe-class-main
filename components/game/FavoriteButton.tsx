"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { favoritesStore } from "@/lib/local-store";
import { toast } from "@/lib/ui-events";

type Props = {
  gameId: string;
  title: string;
  variant?: "glass" | "pill";
};

/** 이 기기에 저장되는 "찜" — 로그인 없이 내 수업 바구니를 만든다 */
export function FavoriteButton({ gameId, title, variant = "glass" }: Props) {
  const favorites = favoritesStore.useIds();
  const active = favorites.includes(gameId);
  const [burst, setBurst] = useState(0);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = favoritesStore.toggle(gameId);
    if (added) setBurst((n) => n + 1);
    toast(
      added ? `“${title}” 찜 완료` : "찜 목록에서 뺐어요",
      added ? "gold" : "default",
    );
  };

  const label = active ? `${title} 찜 해제` : `${title} 찜하기`;

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-300 ${
          active
            ? "border-gold/60 bg-gold/15 text-gold-soft"
            : "border-line-strong text-mist hover:border-gold/50 hover:text-ivory"
        }`}
      >
        <Bookmark
          key={burst}
          className={`h-4 w-4 ${burst ? "community-like-pop" : ""}`}
          fill={active ? "currentColor" : "none"}
          strokeWidth={1.75}
        />
        {active ? "찜한 자료" : "찜하기"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md transition duration-300 ${
        active
          ? "border-gold/70 bg-gold/85 text-ink"
          : "border-white/15 bg-black/35 text-white/80 hover:scale-110 hover:bg-black/55 hover:text-white"
      }`}
    >
      <Bookmark
        key={burst}
        className={`h-4 w-4 ${burst ? "community-like-pop" : ""}`}
        fill={active ? "currentColor" : "none"}
        strokeWidth={1.75}
      />
    </button>
  );
}
