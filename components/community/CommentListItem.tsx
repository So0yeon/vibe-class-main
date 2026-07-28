"use client";

import { useEffect, useRef, useState } from "react";
import type { CommentItem } from "@/lib/community";

function formatCommentDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  comment: CommentItem;
  alreadyReported: boolean;
  onReport: (id: number) => void;
};

export function CommentListItem({
  comment,
  alreadyReported,
  onReport,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const displayName = comment.nickname?.trim() || "익명 선생님";

  return (
    <li className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200">
            {displayName}
          </p>
          <time
            dateTime={comment.createdAt}
            className="text-xs text-slate-500"
          >
            {formatCommentDate(comment.createdAt)}
          </time>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="댓글 메뉴 열기"
            aria-expanded={menuOpen}
            className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-700/50 hover:text-slate-300"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="community-menu-pop absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-lg border border-slate-600/50 bg-slate-900 shadow-lg">
              <button
                type="button"
                disabled={alreadyReported}
                onClick={() => {
                  onReport(comment.id);
                  setMenuOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-600"
              >
                {alreadyReported ? "신고 접수됨" : "신고하기"}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
        {comment.content}
      </p>
    </li>
  );
}
