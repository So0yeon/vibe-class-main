"use client";

import { useRef, useState, type ReactNode } from "react";

type Props = {
  accept?: string;
  multiple?: boolean;
  busy?: boolean;
  onFiles: (files: File[]) => void;
  children: ReactNode;
  className?: string;
};

/** 클릭하거나 파일을 끌어다 놓아서 고르는 영역 */
export function FileDrop({
  accept,
  multiple,
  busy,
  onFiles,
  children,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (list: FileList | null) => {
    const files = list ? [...list] : [];
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={busy}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!busy && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!busy) pick(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition ${
        dragging
          ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
          : "border-slate-600 bg-slate-900/40 text-slate-400 hover:border-slate-500 hover:text-slate-300"
      } ${busy ? "cursor-wait opacity-60" : ""} ${className}`}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
