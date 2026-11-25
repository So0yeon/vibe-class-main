"use client";

import { Search, Snowflake } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AboutModal } from "@/components/AboutModal";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { CommandPalette } from "@/components/nav/CommandPalette";
import { StarMark } from "@/components/ui/StarMark";
import type { AboutContent } from "@/lib/about";
import type { GameItem } from "@/lib/games";
import { snowStore } from "@/lib/local-store";
import { onOpenPalette, openPalette, toast } from "@/lib/ui-events";

const INSTAGRAM_URL = "https://www.instagram.com/vibeclas.s/";

type Props = {
  about: AboutContent;
  games: GameItem[];
  /** 겨울 시즌이면 어드벤트 링크와 눈 내리기 토글을 보여준다 */
  winter?: boolean;
};

export function SiteNav({ about, games, winter = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const snowOn = snowStore.useFlag();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    const offPalette = onOpenPalette(() => setPaletteOpen(true));
    return () => {
      window.removeEventListener("keydown", onKey);
      offPalette();
    };
  }, []);

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
  const openAbout = useCallback(() => setAboutOpen(true), []);

  const toggleSnow = () => {
    snowStore.set(!snowOn);
    toast(snowOn ? "눈이 그쳤어요" : "눈이 내리기 시작해요", "gold");
  };

  const iconBtn =
    "grid h-10 w-10 place-items-center rounded-full text-mist transition duration-300 hover:bg-white/[0.06] hover:text-ivory";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled
            ? "border-b border-line bg-ink/70 backdrop-blur-2xl backdrop-saturate-150"
            : "border-b border-transparent"
        }`}
      >
        {/* 스크롤 진행 바 */}
        <div
          aria-hidden
          className="scroll-progress absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-gold to-gold-soft"
        />

        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group mr-auto flex items-center gap-2"
            aria-label="Vibe Class 홈"
          >
            <StarMark className="h-5 w-5 text-gold transition-transform duration-700 group-hover:rotate-90" />
            <span className="font-display text-[22px] italic leading-none text-ivory">
              Vibe Class
            </span>
          </Link>

          <div className="mr-2 hidden items-center gap-1 text-sm md:flex">
            <Link
              href="/#archive"
              className="rounded-full px-3 py-2 text-mist transition hover:text-ivory"
            >
              아카이브
            </Link>
            {winter && (
              <Link
                href="/#advent"
                className="rounded-full px-3 py-2 text-mist transition hover:text-ivory"
              >
                어드벤트
              </Link>
            )}
            <button
              type="button"
              onClick={openAbout}
              className="rounded-full px-3 py-2 text-mist transition hover:text-ivory"
            >
              제작자 소개
            </button>
          </div>

          <button
            type="button"
            onClick={() => openPalette()}
            className="hidden h-10 items-center gap-2 rounded-full border border-line bg-white/[0.02] pl-3.5 pr-2 text-sm text-fog transition hover:border-line-strong hover:text-ivory sm:flex"
            aria-label="빠른 검색 열기"
          >
            <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            <span className="pr-4">검색</span>
            <kbd className="rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => openPalette()}
            className={`${iconBtn} sm:hidden`}
            aria-label="빠른 검색 열기"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>

          {winter && (
            <button
              type="button"
              onClick={toggleSnow}
              aria-pressed={snowOn}
              className={`${iconBtn} ${snowOn ? "text-gold" : ""}`}
              aria-label={snowOn ? "눈 내리기 끄기" : "눈 내리기 켜기"}
              title={snowOn ? "눈 끄기" : "눈 켜기"}
            >
              <Snowflake
                className={`h-[18px] w-[18px] transition-transform duration-700 ${snowOn ? "rotate-180" : ""}`}
                strokeWidth={1.75}
              />
            </button>
          )}

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vibe Class 인스타그램"
            className={`${iconBtn} hidden sm:grid`}
          >
            <InstagramIcon className="h-[18px] w-[18px]" />
          </a>
        </nav>
      </header>

      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        games={games}
        winter={winter}
        onOpenAbout={openAbout}
      />
      <AboutModal open={aboutOpen} onClose={closeAbout} about={about} />
    </>
  );
}
