"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteCommentAsAdmin } from "@/lib/actions/community";

export function DeleteCommentButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("이 댓글을 삭제할까요?")) return;
        startTransition(async () => {
          const result = await deleteCommentAsAdmin(id);
          if ("error" in result) alert(result.error);
          else router.refresh();
        });
      }}
      className="shrink-0 rounded-md border border-red-500/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50"
    >
      {pending ? "삭제 중…" : "삭제"}
    </button>
  );
}
