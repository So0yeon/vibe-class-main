"use client";

import { ArrowDown } from "lucide-react";

export function HeroActions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href="#archive"
        className="group inline-flex items-center gap-2 rounded-full bg-ivory px-6 py-3.5 text-[15px] font-semibold text-ink transition duration-500 hover:bg-gold-soft hover:shadow-[0_10px_40px_-10px_rgba(214,180,122,0.7)]"
      >
        수업자료 둘러보기
        <ArrowDown
          className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-0.5"
          aria-hidden
        />
      </a>
    </div>
  );
}
