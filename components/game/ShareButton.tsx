"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/ui-events";

/** 모바일은 기본 공유 시트, 데스크톱은 링크 복사 */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const url = window.location.href;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: `${title} │ Vibe Class`, url });
        return;
      } catch {
        // 사용자가 공유 시트를 닫은 경우 - 아무것도 하지 않음
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("링크를 복사했어요. 동료 선생님께 보내보세요", "gold");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("링크를 복사하지 못했어요");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm text-mist transition duration-300 hover:border-gold/50 hover:text-ivory"
    >
      {copied ? (
        <Check className="h-4 w-4 text-gold" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      )}
      {copied ? "복사됨" : "공유"}
    </button>
  );
}
