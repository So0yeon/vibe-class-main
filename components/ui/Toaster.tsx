"use client";

import { useEffect, useState } from "react";
import { onToast, type ToastDetail } from "@/lib/ui-events";

type Item = ToastDetail & { id: number };

const TOAST_MS = 2600;

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(
    () =>
      onToast((detail) => {
        const id = Date.now() + Math.random();
        setItems((prev) => [...prev.slice(-2), { ...detail, id }]);
        window.setTimeout(() => {
          setItems((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_MS);
      }),
    [],
  );

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[10000] flex flex-col items-center gap-2 px-4"
    >
      {items.map((t) => (
        <p
          key={t.id}
          className={`toast-in rounded-full border px-4 py-2 text-sm shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl ${
            t.tone === "gold"
              ? "border-gold/40 bg-ink-3/90 text-gold-soft"
              : "border-line-strong bg-ink-3/90 text-ivory"
          }`}
        >
          {t.message}
        </p>
      ))}
    </div>
  );
}
