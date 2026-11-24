import Link from "next/link";
import { PublishToggle } from "@/components/admin/PublishToggle";
import { getAllGamesForAdmin } from "@/lib/admin/data";

export default async function AdminHomePage() {
  const games = await getAllGamesForAdmin();
  const publishedCount = games.filter((g) => g.published).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">게임 목록</h1>
          <p className="mt-1 text-sm text-slate-500">
            전체 {games.length}개 · 공개 {publishedCount}개 · 우선순위가 높은 순
          </p>
        </div>
        <Link
          href="/admin/games/new"
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          + 새 게임
        </Link>
      </div>

      {games.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-600 px-6 py-12 text-center text-sm text-slate-500">
          아직 등록된 게임이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-700/70 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-800/40">
          {games.map((game) => (
            <li key={game.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-slate-900">
                {game.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg opacity-50">🎮</div>
                )}
              </div>
              <Link href={`/admin/games/${game.id}`} className="min-w-0 flex-1 hover:underline">
                <span className="block truncate text-sm font-medium text-slate-100">{game.title}</span>
                <span className="block truncate text-xs text-slate-500">
                  우선순위 {game.priority}
                  {game.tags.length > 0 && ` · ${game.tags.join(", ")}`}
                  {game.worksheets.length > 0 && ` · 활동지 ${game.worksheets.length}개`}
                </span>
              </Link>
              <PublishToggle id={game.id} published={game.published} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
