"use client";

import { useState, useTransition } from "react";
import {
  addComment,
  deleteCommentAsAdmin,
  deleteCommentWithPassword,
  reportComment,
} from "@/lib/actions/community";
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
    window.localStorage.setItem(REPORTED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage를 쓸 수 없는 환경(사생활 보호 모드 등) - 조용히 무시
  }
}

type Props = {
  programId: string;
  initialComments: CommentItem[];
  commentsAvailable: boolean;
  isAdmin?: boolean;
};

export function CommentSection({
  programId,
  initialComments,
  commentsAvailable,
  isAdmin = false,
}: Props) {
  const [comments, setComments] = useState(initialComments);
  const [reportedIds, setReportedIds] = useState<Set<number>>(
    () => new Set(getReportedIds()),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [, startReportTransition] = useTransition();

  const handleAddComment = (
    nickname: string,
    content: string,
    password: string,
  ) => {
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
      const result = await addComment(programId, nickname, content, password);
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

  /** 성공하면 목록에서 빼고 null, 실패하면 오류 문구를 돌려준다 */
  const handleDelete = async (
    commentId: number,
    password: string | null,
  ): Promise<string | null> => {
    const result =
      password === null
        ? await deleteCommentAsAdmin(commentId)
        : await deleteCommentWithPassword(commentId, password);
    if ("error" in result) return result.error;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    return null;
  };

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Notes from teachers</p>
          <h2 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">
            선생님들의 <em className="text-gold">한마디</em>
          </h2>
        </div>
        <p className="font-mono text-sm text-fog tabular-nums">
          {comments.length.toLocaleString("ko-KR")}개
        </p>
      </div>

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
        <p className="rounded-3xl border border-dashed border-line-strong px-6 py-10 text-center text-sm text-fog">
          댓글을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
        </p>
      ) : comments.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line-strong px-6 py-10 text-center text-sm text-fog">
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
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
