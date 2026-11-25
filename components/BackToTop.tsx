"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

/** 어느 정도 내려왔을 때만 나타나는 맨 위로 버튼 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setVisible(window.scrollY > window.innerHeight * 1.2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="맨 위로"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-line-strong bg-ink-2/80 text-ivory shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl transition duration-500 hover:border-gold/60 hover:text-gold sm:right-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
