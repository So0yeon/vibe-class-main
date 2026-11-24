"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setGamePublished } from "@/lib/actions/admin";

export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(published);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = !value;
        setValue(next);
        startTransition(async () => {
          const result = await setGamePublished(id, next);
          if ("error" in result) {
            setValue(!next);
            alert(result.error);
          } else {
            router.refresh();
          }
        });
      }}
      className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
        value
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          : "border-slate-600 bg-slate-900/40 text-slate-500"
      }`}
      title="눌러서 공개/비공개 전환"
    >
      {value ? "공개" : "비공개"}
    </button>
  );
}
