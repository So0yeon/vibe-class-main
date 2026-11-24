import type { WorksheetFile } from "@/lib/games";

type Props = { worksheets: WorksheetFile[] };

export function WorksheetLinks({ worksheets }: Props) {
  return (
    <>
      {worksheets.map((ws) => (
        <a
          key={ws.url}
          href={ws.url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-500/35 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-violet-200 hover:shadow-[0_0_16px_-6px_rgba(167,139,250,0.35)]"
        >
          <span aria-hidden>📄</span>
          <span className="truncate">{ws.name}</span>
        </a>
      ))}
    </>
  );
}
