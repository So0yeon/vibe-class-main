import Link from "next/link";
import { DeleteCommentButton } from "@/components/admin/DeleteCommentButton";
import { getRecentCommentsForAdmin } from "@/lib/admin/data";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function AdminCommentsPage() {
  const comments = await getRecentCommentsForAdmin();
  const hiddenCount = comments.filter((c) => c.hidden).length;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-100">댓글</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        최근 {comments.length}개 · 신고로 숨겨진 댓글 {hiddenCount}개
      </p>

      {comments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-600 px-6 py-12 text-center text-sm text-slate-500">
          아직 댓글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-700/70 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-800/40">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-300">
                    {c.nickname?.trim() || "익명 선생님"}
                  </span>
                  <span>{formatDate(c.createdAt)}</span>
                  <Link
                    href={`/program/${c.programId}`}
                    target="_blank"
                    className="truncate text-cyan-400 hover:underline"
                  >
                    {c.gameTitle ?? "(삭제된 게임)"}
                  </Link>
                  {c.hidden && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">
                      신고로 숨김
                    </span>
                  )}
                  {!c.hidden && c.reportCount > 0 && (
                    <span className="text-amber-400/80">신고 {c.reportCount}회</span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">
                  {c.content}
                </p>
              </div>
              <DeleteCommentButton id={c.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
