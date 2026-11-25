import { StarMark } from "@/components/ui/StarMark";

/** 과목 이름이 천천히 흐르는 띠 — 히어로와 본문 사이의 쉼표 */
export function Marquee({ words }: { words: string[] }) {
  if (words.length === 0) return null;
  // 화면을 넉넉히 채우도록 반복한 뒤, 같은 줄을 한 번 더 이어 붙여 끊김 없이 순환
  const row = Array.from(
    { length: Math.max(2, Math.ceil(14 / words.length)) },
    () => words,
  ).flat();

  return (
    <div
      className="marquee relative overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
      aria-hidden
    >
      <div className="marquee-track flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {row.map((word, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span
                  className={`px-6 font-display text-3xl sm:text-4xl ${
                    i % 2 ? "italic text-gold/80" : "text-ivory/70"
                  }`}
                >
                  {word}
                </span>
                <StarMark className="h-4 w-4 text-gold/50" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
