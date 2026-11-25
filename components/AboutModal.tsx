"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { StarMark } from "@/components/ui/StarMark";
import type { AboutContent } from "@/lib/about";
import { useModal } from "@/lib/use-modal";

type Props = {
  open: boolean;
  onClose: () => void;
  about: AboutContent;
};

export function AboutModal({ open, onClose, about }: Props) {
  useModal(open, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="닫기"
        className="about-modal-backdrop absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        className="about-modal-panel relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-line-strong bg-ink-2 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] sm:rounded-[32px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-pine/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-garnet/15 blur-3xl"
        />

        <div className="relative flex items-center justify-between px-6 pt-5">
          <p className="eyebrow flex items-center gap-2">
            <StarMark className="h-3.5 w-3.5" />
            About the Maker
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="모달 닫기"
            className="grid h-9 w-9 place-items-center rounded-full text-mist transition hover:bg-white/5 hover:text-ivory"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative overflow-y-auto px-6 pb-8 pt-6 sm:px-9">
          <div className="flex flex-col items-center text-center sm:flex-row sm:gap-6 sm:text-left">
            <div className="about-modal-avatar relative mb-5 h-24 w-24 shrink-0 overflow-hidden rounded-full border border-gold/40 p-1 sm:mb-0">
              <div className="relative h-full w-full overflow-hidden rounded-full bg-ink-3">
                {about.profileImage ? (
                  <Image
                    src={about.profileImage}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-3xl">
                    🐙
                  </span>
                )}
              </div>
            </div>

            <h2
              id="about-modal-title"
              className="font-serif-kr text-2xl font-bold leading-snug tracking-tight text-ivory"
            >
              {about.title}
            </h2>
          </div>

          <div className="mt-7 space-y-4 border-t border-line pt-6">
            {about.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className="about-modal-paragraph text-[15px] leading-[1.85] text-mist"
                style={{ animationDelay: `${120 + index * 80}ms` }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
