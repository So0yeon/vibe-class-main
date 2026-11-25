import { ArrowUpRight } from "lucide-react";

type Props = { url: string | null; size?: "md" | "lg" };

export function PlayButton({ url, size = "md" }: Props) {
  const isExternal = Boolean(url);
  const sizeClass =
    size === "lg" ? "px-6 py-3.5 text-[15px]" : "px-4 py-2.5 text-sm";

  if (!isExternal) {
    return (
      <span
        aria-disabled
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-line text-fog ${sizeClass}`}
      >
        서버 한도 도달 · 잠시 후 다시 열려요
      </span>
    );
  }

  return (
    <a
      href={url!}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/play relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-ivory font-semibold text-ink transition duration-500 hover:shadow-[0_10px_40px_-10px_rgba(214,180,122,0.7)] ${sizeClass}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-gold-soft via-gold to-gold-soft transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/play:translate-x-0"
      />
      <span className="relative">게임 열기</span>
      <ArrowUpRight
        aria-hidden
        className="relative h-4 w-4 transition-transform duration-500 group-hover/play:-translate-y-0.5 group-hover/play:translate-x-0.5"
        strokeWidth={2}
      />
    </a>
  );
}
