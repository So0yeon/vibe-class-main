"use client";

import { useState, type KeyboardEvent } from "react";

const CONTENT_MAX_LENGTH = 500;
const NICKNAME_MAX_LENGTH = 30;
const PASSWORD_MAX_LENGTH = 50;

type Props = {
  onSubmit: (nickname: string, content: string, password: string) => void;
  pending: boolean;
  error?: string | null;
};

export function CommentForm({ onSubmit, pending, error }: Props) {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = content.trim().length > 0 && !pending;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(nickname, content, password);
    setContent("");
    setPassword("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-ink-2/70 p-4 sm:p-5">
      <div className="mb-2 grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) =>
            setNickname(e.target.value.slice(0, NICKNAME_MAX_LENGTH))
          }
          placeholder="닉네임 (선택, 비워두면 익명 선생님)"
          disabled={pending}
          maxLength={NICKNAME_MAX_LENGTH}
          className="w-full rounded-xl border border-line bg-ink/60 px-3 py-2 text-sm text-ivory placeholder:text-fog transition focus:border-gold/50 focus:outline-none focus:ring-4 focus:ring-gold/10 disabled:opacity-50"
        />
        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value.slice(0, PASSWORD_MAX_LENGTH))
          }
          placeholder="비밀번호 (선택, 내 댓글 삭제용)"
          autoComplete="new-password"
          disabled={pending}
          maxLength={PASSWORD_MAX_LENGTH}
          className="w-full rounded-xl border border-line bg-ink/60 px-3 py-2 text-sm text-ivory placeholder:text-fog transition focus:border-gold/50 focus:outline-none focus:ring-4 focus:ring-gold/10 disabled:opacity-50"
        />
      </div>
      <textarea
        value={content}
        onChange={(e) =>
          setContent(e.target.value.slice(0, CONTENT_MAX_LENGTH))
        }
        onKeyDown={handleKeyDown}
        placeholder="댓글을 남겨주세요 (Enter 제출, Shift+Enter 줄바꿈)"
        disabled={pending}
        rows={3}
        maxLength={CONTENT_MAX_LENGTH}
        className="w-full resize-none rounded-xl border border-line bg-ink/60 px-3 py-2 text-sm text-ivory placeholder:text-fog transition focus:border-gold/50 focus:outline-none focus:ring-4 focus:ring-gold/10 disabled:opacity-50"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-fog">
          {content.length}/{CONTENT_MAX_LENGTH}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-ivory px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "게시 중…" : "댓글 등록"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
