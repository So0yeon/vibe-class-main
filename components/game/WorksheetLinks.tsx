import { FileText } from "lucide-react";
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
          className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm text-mist transition duration-300 hover:border-gold/50 hover:bg-gold/5 hover:text-gold-soft"
        >
          <FileText
            aria-hidden
            className="h-4 w-4 shrink-0"
            strokeWidth={1.75}
          />
          <span className="truncate">{ws.name}</span>
        </a>
      ))}
    </>
  );
}
