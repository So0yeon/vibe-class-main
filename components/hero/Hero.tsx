import { ArchFrame } from "@/components/hero/ArchFrame";
import { CountUp } from "@/components/hero/CountUp";
import { HeroActions } from "@/components/hero/HeroActions";
import { VisitorCounter } from "@/components/VisitorCounter";
import type { AboutContent } from "@/lib/about";
import { seasonYear } from "@/lib/season";

type Props = {
  about: AboutContent;
  winter: boolean;
  today: string;
  totals: { games: number; views: number; likes: number } | null;
};

/** 글자마다 지연을 주어 순서대로 떠오르게 */
function Letters({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="letter-rise" aria-hidden>
      {[...text].map((ch, i) => (
        <span key={i} style={{ animationDelay: `${delay + i * 60}ms` }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export function Hero({ about, winter, today, totals }: Props) {
  return (
    <section className="relative overflow-hidden pb-24 pt-28 sm:pt-36 lg:pb-32">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 lg:px-8">
        <div className="relative">
          <p className="eyebrow fade-up flex items-center gap-3">
            <span className="h-px w-8 bg-gold/60" />
            {winter
              ? `Winter Edition — ${seasonYear(today)}`
              : "Vibe Coding × Classroom"}
          </p>

          <h1 className="mt-6 font-display leading-[0.82] tracking-[-0.03em] text-ivory">
            <span className="sr-only">Vibe Class</span>
            <span className="block text-[clamp(84px,17vw,184px)]">
              <Letters text="Vibe" delay={100} />
            </span>
            <span className="block pl-[0.6em] text-[clamp(84px,17vw,184px)] italic">
              {/* background-clip:text는 변형된 자식 글자에 적용되지 않아 단어 단위로 등장시킨다 */}
              <span
                aria-hidden
                className="inline-block animate-[letter-rise_1.3s_cubic-bezier(0.16,1,0.3,1)_380ms_both] pr-[0.08em]"
              >
                <span className="text-sheen">Class</span>
              </span>
            </span>
          </h1>

          <div className="fade-up mt-8 max-w-md [animation-delay:700ms]">
            <p className="font-serif-kr text-lg leading-relaxed text-ivory/90 sm:text-xl">
              {winter
                ? "올겨울, 교실에 작은 반짝임을 선물하세요."
                : "수업에 바이브를 더하다."}
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-mist">
              초등교사가 직접 만든 바이브코딩 웹앱 수업자료 아카이브
            </p>
          </div>

          <div className="fade-up mt-9 [animation-delay:850ms]">
            <HeroActions />
          </div>

          {totals && (
            <dl className="fade-up mt-12 grid max-w-md grid-cols-3 border-t border-line pt-6 [animation-delay:1000ms]">
              {[
                { label: "수업자료", value: totals.games },
                { label: "누적 조회", value: totals.views },
                { label: "받은 마음", value: totals.likes },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs tracking-wide text-fog">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-display text-3xl text-ivory sm:text-4xl">
                    <CountUp value={item.value} />
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6">
            <VisitorCounter />
          </div>
        </div>

        <div className="fade-up relative px-6 [animation-delay:400ms] sm:px-0">
          <ArchFrame
            image={about.bannerImage}
            winter={winter}
            serverToday={today}
          />
        </div>
      </div>
    </section>
  );
}
