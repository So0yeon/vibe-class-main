import Link from "next/link";
import { ReorderableGameList } from "@/components/admin/ReorderableGameList";
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
            전체 {games.length}개 · 공개 {publishedCount}개 · 사이트에 보이는 순서
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
        <ReorderableGameList games={games} />
      )}
    </>
  );
}
