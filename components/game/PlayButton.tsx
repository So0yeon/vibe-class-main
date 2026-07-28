type Props = { url: string | null };

export function PlayButton({ url }: Props) {
  const href = url ?? "#";
  const isExternal = Boolean(url);

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-disabled={!isExternal}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:text-cyan-200 hover:shadow-[0_0_20px_-4px_rgba(34,211,238,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/50 aria-disabled:pointer-events-none aria-disabled:opacity-40"
    >
      {isExternal ? (
        <>
          게임 열기
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </>
      ) : (
        "🚧 서버 한도 도달"
      )}
    </a>
  );
}
