"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  /** password가 null이면 관리자 삭제. 실패 시 오류 문구를 돌려준다 */
  onDelete: (id: number, password: string | null) => Promise<string | null>;
  isAdmin: boolean;
};

export function CommentListItem({
  comment,
  alreadyReported,
  onReport,
  onDelete,
  isAdmin,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  // 낙관적으로 먼저 보여준 댓글(음수 id)은 아직 저장 전이라 메뉴를 숨긴다
  const saved = comment.id > 0;

  const runDelete = (pw: string | null) => {
    setDeleteError(null);
    startDelete(async () => {
      const error = await onDelete(comment.id, pw);
      if (error) setDeleteError(error);
    });
  };
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const displayName = comment.nickname?.trim() || "익명 선생님";

  return (
    <li className="rounded-2xl border border-line bg-ink-2/50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ivory">{displayName}</p>
          <time dateTime={comment.createdAt} className="text-xs text-fog">
            {formatCommentDate(comment.createdAt)}
          </time>
        </div>

        {saved && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="댓글 메뉴 열기"
              aria-expanded={menuOpen}
              className="rounded-md px-2 py-1 text-fog transition hover:bg-white/5 hover:text-ivory/90"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="community-menu-pop absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-lg border border-line-strong bg-ink-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)]">
                <button
                  type="button"
                  disabled={alreadyReported}
                  onClick={() => {
                    onReport(comment.id);
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-ivory/90 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:text-fog/60"
                >
                  {alreadyReported ? "신고 접수됨" : "신고하기"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(true);
                    setDeleteError(null);
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-ivory/90 transition hover:bg-white/5"
                >
                  삭제하기
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (confirm("이 댓글을 삭제할까요? (관리자)"))
                        runDelete(null);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/5"
                  >
                    관리자 삭제
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ivory/90">
        {comment.content}
      </p>

      {deleteOpen && (
        <form
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            runDelete(password);
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="작성할 때 정한 비밀번호"
            autoComplete="off"
            autoFocus
            disabled={deleting}
            className="min-w-0 flex-1 rounded-xl border border-line bg-ink/60 px-3 py-1.5 text-sm text-ivory placeholder:text-fog focus:border-gold/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={deleting || !password}
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
          >
            {deleting ? "삭제 중…" : "삭제"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteOpen(false);
              setPassword("");
              setDeleteError(null);
            }}
            className="px-2 py-1.5 text-sm text-fog hover:text-ivory/90"
          >
            취소
          </button>
        </form>
      )}
      {deleteError && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {deleteError}
        </p>
      )}
    </li>
  );
}
