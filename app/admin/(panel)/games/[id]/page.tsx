import Link from "next/link";
import { notFound } from "next/navigation";
import { GameForm } from "@/components/admin/GameForm";
import { getGameForAdmin } from "@/lib/admin/data";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGameForAdmin(id);
  if (!game) notFound();

  return (
    <>
      <Link href="/admin" className="mb-4 inline-block text-sm text-slate-400 hover:text-slate-200">
        ← 목록으로
      </Link>
      <h1 className="mb-6 text-xl font-bold text-slate-100">게임 수정</h1>
      <GameForm key={game.id} game={game} />
    </>
  );
}
