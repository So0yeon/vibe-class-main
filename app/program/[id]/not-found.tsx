import Link from "next/link";
import { StarMark } from "@/components/ui/StarMark";

export default function ProgramNotFound() {
  return (
    <div className="grain relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
      <div aria-hidden className="aurora" />
      <StarMark className="relative h-10 w-10 text-gold" />
      <p className="relative mt-6 font-display text-6xl italic text-ivory sm:text-7xl">
        Lost in the snow.
      </p>
      <h1 className="relative mt-4 font-serif-kr text-lg text-ivory/90">
        존재하지 않거나 비공개 처리된 자료입니다
      </h1>
      <p className="relative mt-2 text-sm text-mist">
        주소가 정확한지 확인하거나 아카이브로 돌아가주세요.
      </p>
      <Link
        href="/"
        className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
      >
        아카이브로 돌아가기
      </Link>
    </div>
  );
}
