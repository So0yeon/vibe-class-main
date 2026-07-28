"use client";

import { useState, useTransition } from "react";
import { addComment, reportComment } from "@/lib/actions/community";
import type { CommentItem } from "@/lib/community";
import { CommentForm } from "@/components/community/CommentForm";
import { CommentListItem } from "@/components/community/CommentListItem";

const REPORTED_STORAGE_KEY = "vibeclass:reportedComments";

function getReportedIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REPORTED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function rememberReportedId(id: number) {
  try {
    const ids = new Set(getReportedIds());
    ids.add(id);
    window.localStorage.setItem(
      REPORTED_STORAGE_KEY,
      JSON.stringify([...ids]),
    );
  } catch {
    // localStorage를 쓸 수 없는 환경(사생활 보호 모드 등) - 조용히 무시
  }
}

type Props = {
  programId: string;
  initialComments: CommentItem[];
  commentsAvailable: boolean;
};

export function CommentSection({
  programId,
  initialComments,
  commentsAvailable,
}: Props) {
  const [comments, setComments] = useState(initialComments);
  const [reportedIds, setReportedIds] = useState<Set<number>>(
    () => new Set(getReportedIds()),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [, startReportTransition] = useTransition();

  const handleAddComment = (nickname: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const tempId = -Date.now();
    const optimisticComment: CommentItem = {
      id: tempId,
      nickname: nickname.trim() || null,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setFormError(null);
    setComments((prev) => [optimisticComment, ...prev]);

    startSubmitTransition(async () => {
      const result = await addComment(programId, nickname, content);
      if ("error" in result) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setFormError(result.error);
        return;
      }
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? result.comment : c)),
      );
    });
  };

  const handleReport = (commentId: number) => {
    if (reportedIds.has(commentId)) return;

    setReportedIds((prev) => new Set(prev).add(commentId));
    rememberReportedId(commentId);

    startReportTransition(async () => {
      const result = await reportComment(commentId);
      if (!("error" in result) && result.hidden) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    });
  };

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">
        💬 댓글 {comments.length.toLocaleString("ko-KR")}개
      </h2>

      {commentsAvailable && (
        <div className="mb-6">
          <CommentForm
            onSubmit={handleAddComment}
            pending={isSubmitting}
            error={formError}
          />
        </div>
      )}

      {!commentsAvailable ? (
        <p className="rounded-xl border border-dashed border-slate-600/50 bg-slate-800/30 px-6 py-10 text-center text-sm text-slate-500">
          댓글을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
        </p>
      ) : comments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-600/50 bg-slate-800/30 px-6 py-10 text-center text-sm text-slate-500">
          아직 댓글이 없어요. 첫 댓글을 남겨보세요!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentListItem
              key={comment.id}
              comment={comment}
              alreadyReported={reportedIds.has(comment.id)}
              onReport={handleReport}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
