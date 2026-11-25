import Link from "next/link";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { StarMark } from "@/components/ui/StarMark";

const INSTAGRAM_URL = "https://www.instagram.com/vibeclas.s/";

export function SiteFooter({ winter = false }: { winter?: boolean }) {
  return (
    <footer className="relative mt-auto border-t border-line">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <p className="font-display text-[clamp(44px,9vw,96px)] leading-[0.95] tracking-tight text-ivory/90">
          {winter ? (
            <>
              Warm wishes,
              <br />
              <em className="text-gold">from our classroom.</em>
            </>
          ) : (
            <>
              Play, learn,
              <br />
              <em className="text-gold">repeat.</em>
            </>
          )}
        </p>

        <div className="mt-14 flex flex-col gap-6 border-t border-line pt-6 text-sm text-fog sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <StarMark className="h-4 w-4 text-gold" />
            <span className="font-display text-lg italic text-ivory">
              Vibe Class
            </span>
            <span className="ml-2 text-xs">
              © Vibe Class. All Rights Reserved.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="transition-colors hover:text-ivory"
            >
              개인정보처리방침
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ivory"
            >
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
