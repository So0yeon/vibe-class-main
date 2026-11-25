"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StarMark } from "@/components/ui/StarMark";
import type { GameItem } from "@/lib/games";
import { openedDoorsStore } from "@/lib/local-store";
import {
  ADVENT_DAYS,
  adventToday,
  buildAdventSchedule,
  daysUntilAdvent,
  decemberFirstWeekday,
  openableAdventDays,
  seasonYear,
} from "@/lib/season";
import { toast } from "@/lib/ui-events";
import { useKstToday } from "@/lib/use-today";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type Props = {
  games: GameItem[];
  serverToday: string;
};

/**
 * 12월 1~25일, 날마다 수업자료 하나가 들어 있는 창문이 열린다.
 * 날짜가 된 창은 눌러서 문을 열고(이 기기에 기억), 열린 창을 다시 누르면 자료로 이동한다.
 */
export function AdventCalendar({ games, serverToday }: Props) {
  const today = useKstToday(serverToday);
  const year = seasonYear(today);
  const openable = openableAdventDays(today);
  const todayDay = adventToday(today);
  const untilAdvent = daysUntilAdvent(today);
  const schedule = useMemo(
    () => buildAdventSchedule(games, year),
    [games, year],
  );
  const opened = openedDoorsStore.useIds();
  const [shaking, setShaking] = useState<number | null>(null);
  const leadingBlanks = decemberFirstWeekday(year);

  if (schedule.length === 0) return null;

  const doorKey = (day: number) => `${year}-${day}`;

  const onDoor = (day: number) => {
    if (day > openable) {
      setShaking(day);
      window.setTimeout(() => setShaking(null), 460);
      toast(`12월 ${day}일에 열려요. 조금만 기다려 주세요 ✦`);
      return;
    }
    openedDoorsStore.add(doorKey(day));
    toast(`${day}번째 창문이 열렸어요`, "gold");
  };

  const status =
    openable === 0
      ? `첫 번째 창문까지 ${untilAdvent}일 남았어요`
      : openable >= ADVENT_DAYS && todayDay !== ADVENT_DAYS
        ? "모든 창문이 열렸어요. 메리 크리스마스!"
        : `오늘은 12월 ${todayDay}일 — ${todayDay}번째 창문이 열렸어요`;

  return (
    <section id="advent" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="reveal grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">Advent Calendar</p>
            <h2 className="mt-3 font-display text-[44px] leading-[1.02] tracking-tight text-ivory sm:text-6xl">
              스물다섯 개의
              <br />
              <em className="text-gold">작은 창문</em>
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-mist">
              12월 1일부터 크리스마스까지, 매일 하나씩 수업 선물이 들어 있는
              창문이 열립니다. 아침 조회 전에 오늘의 창문을 열어보세요.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-garnet/40 bg-garnet/10 px-4 py-2 text-sm text-[#f3c3cd]">
              <span className="h-1.5 w-1.5 rounded-full bg-garnet" />
              {status}
            </p>
          </div>

          <div>
            <div className="mb-2 hidden grid-cols-7 gap-2 md:grid">
              {WEEKDAYS.map((w, i) => (
                <p
                  key={w}
                  className={`text-center text-[11px] ${i === 0 ? "text-garnet/80" : "text-fog"}`}
                >
                  {w}
                </p>
              ))}
            </div>

            <ol className="grid grid-cols-5 gap-2 sm:gap-2.5 md:grid-cols-7">
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <li
                  key={`blank-${i}`}
                  aria-hidden
                  className="hidden md:block"
                />
              ))}

              {schedule.map((game, i) => {
                const day = i + 1;
                const isOpen = day <= openable && opened.includes(doorKey(day));
                const isLocked = day > openable;
                const isToday = day === todayDay;
                const isChristmas = day === ADVENT_DAYS;

                return (
                  <li
                    key={day}
                    className={`door-scene relative aspect-square ${shaking === day ? "shake" : ""}`}
                  >
                    {/* 문 뒤의 선물: 열린 뒤에만 자료로 이동 */}
                    <Link
                      href={`/program/${game.id}`}
                      tabIndex={isOpen ? 0 : -1}
                      aria-hidden={!isOpen}
                      className="group/gift absolute inset-0 overflow-hidden rounded-2xl border border-gold/30 bg-ink-3"
                    >
                      {isOpen && game.thumbnail && (
                        <Image
                          src={game.thumbnail}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 20vw, 110px"
                          className="object-cover transition duration-700 group-hover/gift:scale-110"
                        />
                      )}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <span className="absolute inset-x-1.5 bottom-1.5 line-clamp-2 text-[10px] font-medium leading-tight text-white sm:text-[11px]">
                        {isOpen ? game.title : ""}
                      </span>
                      {isOpen && (
                        <span className="absolute left-1.5 top-1 font-display text-sm italic text-gold-soft">
                          {day}
                        </span>
                      )}
                    </Link>

                    {/* 문 */}
                    <button
                      type="button"
                      data-open={isOpen}
                      onClick={() => onDoor(day)}
                      style={{
                        transitionDelay: isOpen ? `${(i % 7) * 45}ms` : "0ms",
                      }}
                      aria-label={
                        isLocked
                          ? `12월 ${day}일 창문 (아직 잠김)`
                          : `12월 ${day}일 창문 열기`
                      }
                      className={`door group/door absolute inset-0 flex flex-col items-center justify-center rounded-2xl border transition-colors ${
                        isToday
                          ? "today-pulse border-garnet/70 bg-[linear-gradient(160deg,#2a1219,#13100f)]"
                          : isChristmas
                            ? "border-gold/50 bg-[linear-gradient(160deg,#2a2416,#121410)]"
                            : isLocked
                              ? "border-line bg-ink-2"
                              : "border-line-strong bg-[linear-gradient(160deg,#18241e,#0f1613)] hover:border-gold/50"
                      }`}
                    >
                      {/* 문 손잡이 */}
                      <span
                        aria-hidden
                        className={`absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${isLocked ? "bg-fog/40" : "bg-gold/80"}`}
                      />
                      {isChristmas ? (
                        <StarMark
                          className={`h-1/3 w-1/3 ${isLocked ? "text-gold/40" : "text-gold"}`}
                        />
                      ) : (
                        <span
                          className={`font-display text-[clamp(22px,5vw,36px)] leading-none ${
                            isLocked ? "text-ivory/25" : "text-ivory"
                          }`}
                        >
                          {day}
                        </span>
                      )}
                      {isToday && (
                        <span className="absolute top-1.5 font-mono text-[8px] tracking-[0.2em] text-[#f3c3cd]">
                          TODAY
                        </span>
                      )}
                      {isLocked && (
                        <Lock
                          aria-hidden
                          className="absolute bottom-1.5 h-3 w-3 text-fog opacity-0 transition-opacity group-hover/door:opacity-100"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>

            <p className="mt-4 text-xs text-fog">
              열어 본 창문은 이 기기에 기억돼요. 열린 창문을 한 번 더 누르면
              수업자료로 이동합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
